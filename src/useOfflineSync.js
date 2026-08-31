import { useEffect, useRef, useCallback, useState } from 'react';

// localStorage keys
const STORAGE_KEYS = {
  TRIP_DATA: 'trip_data',
  SYNC_QUEUE: 'sync_queue'
};

class SyncQueue {
  constructor() {
    this.queue = this.loadQueue();
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.queue));
    } catch (err) {
      console.error('Failed to save sync queue:', err);
    }
  }

  add(method, url, body) {
    const item = {
      id: `${Date.now()}-${Math.random()}`,
      method,
      url,
      body,
      timestamp: Date.now(),
      retries: 0
    };
    this.queue.push(item);
    this.saveQueue();
    console.log('📋 Queued:', method, url, `(${this.queue.length} pending)`);
    return item.id;
  }

  getAll() {
    return [...this.queue];
  }

  remove(id) {
    const before = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== id);
    if (this.queue.length < before) {
      this.saveQueue();
    }
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  size() {
    return this.queue.length;
  }
}

const globalSyncQueue = new SyncQueue();

export const saveTripToLocalStorage = (trip) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIP_DATA, JSON.stringify(trip));
  } catch (err) {
    console.error('Failed to save trip to localStorage:', err);
  }
};

export const loadTripFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRIP_DATA);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRIP_DATA);
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
};

export const fetchWithOfflineSupport = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (error) {
    if (options.method && options.method !== 'GET') {
      globalSyncQueue.add(options.method, url, options.body);
    }
    throw error;
  }
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(globalSyncQueue.size());
  const syncTimeoutRef = useRef(null);

  const syncQueue = useCallback(async () => {
    const queueSize = globalSyncQueue.size();
    if (isSyncing || !isOnline || queueSize === 0) {
      console.log('🔄 Sync skipped - syncing:', isSyncing, 'online:', isOnline, 'pending:', queueSize);
      return;
    }

    console.log('🔄 Starting sync of', queueSize, 'pending changes...');
    setIsSyncing(true);
    const queue = globalSyncQueue.getAll();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body,
        });

        if (response.ok) {
          globalSyncQueue.remove(item.id);
          synced++;
          console.log('✅ Synced:', item.method, item.url);
        } else {
          const errorText = await response.text();
          console.error('❌ Sync failed:', item.method, item.url, response.status, errorText);

          // Check if duplicate key error - skip it
          if (errorText.includes('duplicate key')) {
            console.log('⚠️ Duplicate found - removing from queue:', item.url);
            globalSyncQueue.remove(item.id);
            synced++;
          } else if (response.status >= 500) {
            // Server error - stop and retry later
            console.error('🛑 Server error, will retry later');
            break;
          } else {
            failed++;
          }
        }
      } catch (err) {
        console.error('❌ Network error during sync:', err.message);
        failed++;
        break;
      }
    }

    const remaining = globalSyncQueue.size();
    console.log(`✨ Sync complete: ${synced} synced, ${failed} failed, ${remaining} remaining`);
    setPendingCount(remaining);
    setIsSyncing(false);
  }, [isOnline, isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online detected');
      setIsOnline(true);
      syncTimeoutRef.current = setTimeout(() => {
        syncQueue();
      }, 500);
    };

    const handleOffline = () => {
      console.log('📡 Offline detected');
      setIsOnline(false);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [syncQueue]);

  // Periodic sync every 5 seconds if online with pending
  useEffect(() => {
    if (!isOnline || globalSyncQueue.size() === 0 || isSyncing) return;

    console.log('⏰ Setting up periodic sync check');
    const interval = setInterval(() => {
      console.log('⏲️ Periodic sync check (pending:', globalSyncQueue.size() + ')');
      syncQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline, isSyncing, syncQueue]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncQueue,
    hasPending: globalSyncQueue.size() > 0
  };
};
