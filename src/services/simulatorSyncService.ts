export interface SyncStatusInfo {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: number;
  error?: string;
  mode?: 'BROWSER_LOCAL' | 'CLOUD_FIRESTORE';
}

type SyncListener = (info: SyncStatusInfo) => void;

let currentSyncInfo: SyncStatusInfo = {
  status: 'success',
  lastSyncedAt: Date.now(),
  mode: 'BROWSER_LOCAL',
};

const listeners = new Set<SyncListener>();

export function updateSyncStatus(info: Partial<SyncStatusInfo>): void {
  currentSyncInfo = { ...currentSyncInfo, ...info };
  listeners.forEach((fn) => {
    try {
      fn(currentSyncInfo);
    } catch {
      // ignore
    }
  });
}

export function subscribeSyncStatus(fn: SyncListener): () => void {
  listeners.add(fn);
  fn(currentSyncInfo);
  return () => {
    listeners.delete(fn);
  };
}
