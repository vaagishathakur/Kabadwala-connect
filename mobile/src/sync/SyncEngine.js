import * as Network from 'expo-network';
import api from '../api/client';
import { getUnsyncedItems, markSynced, cachePrices, cacheRecyclers, addToSyncQueue } from '../db/queries';
import { SYNC_INTERVAL_MS } from '../utils/constants';

class SyncEngine {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
  }

  async isOnline() {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected && networkState.isInternetReachable;
  }

  async queueChange(entity, action, data) {
    await addToSyncQueue(entity, action, data);
    this.sync(); // Trigger immediate sync attempt
  }

  async sync() {
    if (this.isSyncing) return;
    
    const online = await this.isOnline();
    if (!online) return;

    this.isSyncing = true;
    try {
      // 1. Push unsynced changes to server
      const unsynced = await getUnsyncedItems();
      if (unsynced.length > 0) {
        const payload = unsynced.map(item => ({
          id: item.id,
          entity: item.entity,
          action: item.action,
          data: JSON.parse(item.data),
          timestamp: item.client_timestamp
        }));

        const response = await api.post('/sync', { changes: payload });
        
        if (response.status === 200) {
          const syncedIds = unsynced.map(u => u.id);
          await markSynced(syncedIds);
        }
      }

      // 2. Pull updates from server
      const pricesRes = await api.get('/prices');
      if (pricesRes.data) {
        await cachePrices(pricesRes.data);
      }

      const recyclersRes = await api.get('/recyclers');
      if (recyclersRes.data) {
        await cacheRecyclers(recyclersRes.data);
      }

    } catch (error) {
      console.warn('Sync failed:', error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(intervalMs = SYNC_INTERVAL_MS) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default new SyncEngine();
