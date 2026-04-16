
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../app/store/appStore';
import { offlineQueue } from '../lib/offline/offlineQueue';
import { cacheStore } from '../lib/cache/cacheStore';
import { Wifi, WifiOff, RefreshCw, Database, Trash2 } from 'lucide-react';

export const DebugOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isOnline, isSyncing, pendingSyncCount } = useAppStore();
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const updateQueue = async () => {
      const queue = await offlineQueue.getQueue();
      setQueueSize(queue.length);
    };
    const interval = setInterval(updateQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-[9999] w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-[10px] font-bold text-black/40 transition-colors"
      >
        DB
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-mono text-[10px]">
      <div className="bg-gray-900 p-3 flex items-center justify-between text-white">
        <span className="font-black uppercase tracking-widest">System Debug</span>
        <button onClick={() => setIsVisible(false)} className="opacity-50 hover:opacity-100">Close</button>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Network Status</span>
          <div className={`flex items-center gap-1.5 font-bold ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Sync Engine</span>
          <div className={`flex items-center gap-1.5 font-bold ${isSyncing ? 'text-blue-500' : 'text-gray-400'}`}>
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'SYNCING' : 'IDLE'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Pending Queue</span>
          <div className="flex items-center gap-1.5 font-bold text-orange-500">
            <Database size={12} />
            {queueSize} items
          </div>
        </div>

        <div className="pt-2 border-t border-gray-50 flex gap-2">
          <button 
            onClick={() => cacheStore.clear()}
            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center gap-1.5 text-gray-600 transition-colors"
          >
            <Trash2 size={10} /> Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
};
