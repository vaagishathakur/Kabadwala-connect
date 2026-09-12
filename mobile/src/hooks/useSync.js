import { useState, useEffect } from 'react';
import SyncEngine from '../sync/SyncEngine';

export const useSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    
    const checkStatus = async () => {
      const online = await SyncEngine.isOnline();
      if (mounted) {
        setIsOnline(online);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    await SyncEngine.sync();
    setLastSyncTime(Date.now());
  };

  return { isOnline, lastSyncTime, triggerSync };
};
