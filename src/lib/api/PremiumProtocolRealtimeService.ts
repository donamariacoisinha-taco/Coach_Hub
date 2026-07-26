import { supabase } from './supabase';

const isDev = typeof import.meta !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

export interface RealtimeProtocolPayload {
  eventType: string;
  new: any;
  old: any;
}

export type RealtimeProtocolListener = (payload: RealtimeProtocolPayload) => void;

class PremiumProtocolRealtimeService {
  private channel: any = null;
  private listeners: Set<RealtimeProtocolListener> = new Set();
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private isSubscribing = false;

  /**
   * Subscribes a callback to receive real-time updates for premium_protocols.
   * If this is the first listener, it initializes the Supabase Realtime channel.
   * Returns an unsubscribe function.
   */
  subscribe(listener: RealtimeProtocolListener): () => void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.listeners.add(listener);

    if (!this.channel && !this.isSubscribing) {
      this.initChannel();
    }

    return () => {
      this.unsubscribe(listener);
    };
  }

  private unsubscribe(listener: RealtimeProtocolListener) {
    this.listeners.delete(listener);

    // Debounce cleanup to tolerate React Strict Mode, rapid route changes, and listener remounts.
    if (this.listeners.size === 0 && this.channel && !this.cleanupTimer) {
      this.cleanupTimer = setTimeout(() => {
        this.cleanupTimer = null;
        if (this.listeners.size === 0) {
          this.cleanupChannel();
        }
      }, 5000);
    }
  }

  private initChannel() {
    this.isSubscribing = true;
    if (isDev) console.log('[PremiumProtocolRealtimeService] Initializing Supabase Realtime Channel for premium_protocols...');

    this.channel = supabase
      .channel('premium_protocols_realtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_protocols',
        },
        (payload) => {
          if (isDev) console.log('[PremiumProtocolRealtimeService] Real-time event received:', payload.eventType, payload);

          const eventPayload: RealtimeProtocolPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          };

          // Notify all listeners
          this.listeners.forEach((listener) => {
            try {
              listener(eventPayload);
            } catch (err) {
              console.error('[PremiumProtocolRealtimeService] Error executing listener callback:', err);
            }
          });
        }
      )
      .subscribe((status) => {
        if (isDev) console.log(`[PremiumProtocolRealtimeService] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.isSubscribing = false;
        }
      });
  }

  private cleanupChannel() {
    if (this.channel) {
      if (isDev) console.log('[PremiumProtocolRealtimeService] Cleaning up channel subscription as no listeners are active...');
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {
        console.error('[PremiumProtocolRealtimeService] Error removing channel:', e);
      }
      this.channel = null;
      this.isSubscribing = false;
    }
  }
}

export const premiumProtocolRealtimeService = new PremiumProtocolRealtimeService();