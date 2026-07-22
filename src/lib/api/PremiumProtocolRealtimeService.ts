import { supabase } from './supabase';

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

  subscribe(listener: RealtimeProtocolListener): () => void {
    this.listeners.add(listener);

    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (!this.channel && !this.isSubscribing) {
      this.initChannel();
    }

    return () => this.unsubscribe(listener);
  }

  private unsubscribe(listener: RealtimeProtocolListener) {
    this.listeners.delete(listener);

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
    if (import.meta.env.DEV) {
      console.debug('[PremiumProtocolRealtimeService] Initializing channel for premium_protocols...');
    }

    this.channel = supabase
      .channel('premium_protocols_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'premium_protocols' },
        (payload) => {
          const eventPayload: RealtimeProtocolPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          };

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
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.isSubscribing = false;
        }
        if (import.meta.env.DEV) {
          console.debug(`[PremiumProtocolRealtimeService] Subscription status: ${status}`);
        }
      });
  }

  private cleanupChannel() {
    if (!this.channel) return;

    if (import.meta.env.DEV) {
      console.debug('[PremiumProtocolRealtimeService] Cleaning up channel subscription.');
    }

    try {
      supabase.removeChannel(this.channel);
    } catch (e) {
      console.error('[PremiumProtocolRealtimeService] Error removing channel:', e);
    } finally {
      this.channel = null;
      this.isSubscribing = false;
    }
  }
}

export const premiumProtocolRealtimeService = new PremiumProtocolRealtimeService();
