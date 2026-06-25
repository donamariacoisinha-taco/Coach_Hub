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

  /**
   * Subscribes a callback to receive real-time updates for premium_protocols.
   * If this is the first listener, it initializes the Supabase Realtime channel.
   * Returns an unsubscribe function.
   */
  subscribe(listener: RealtimeProtocolListener): () => void {
    this.listeners.add(listener);

    if (!this.channel) {
      this.initChannel();
    }

    return () => {
      this.unsubscribe(listener);
    };
  }

  private unsubscribe(listener: RealtimeProtocolListener) {
    this.listeners.delete(listener);

    // If no listeners remain, clean up the Supabase Realtime channel to prevent memory leaks and unnecessary connections
    if (this.listeners.size === 0 && this.channel) {
      this.cleanupChannel();
    }
  }

  private initChannel() {
    console.log('[PremiumProtocolRealtimeService] Initializing Supabase Realtime Channel for premium_protocols...');
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
          console.log('[PremiumProtocolRealtimeService] Real-time event received:', payload.eventType, payload);
          
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
        console.log(`[PremiumProtocolRealtimeService] Subscription status: ${status}`);
      });
  }

  private cleanupChannel() {
    if (this.channel) {
      console.log('[PremiumProtocolRealtimeService] Cleaning up channel subscription as no listeners are active...');
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {
        console.error('[PremiumProtocolRealtimeService] Error removing channel:', e);
      }
      this.channel = null;
    }
  }
}

export const premiumProtocolRealtimeService = new PremiumProtocolRealtimeService();
