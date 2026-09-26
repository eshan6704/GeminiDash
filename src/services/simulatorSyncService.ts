import { backblazeService } from './backblazeService';

export interface SyncStatusInfo {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt: number | null;
  error: string | null;
  simulatorId: string;
  source: 'local' | 'cloud';
}

let syncTimeout: any = null;
let statusCallback: ((status: SyncStatusInfo) => void) | null = null;
let currentStatus: SyncStatusInfo = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  simulatorId: 'institutional-user-01',
  source: 'local',
};

function updateStatus(patch: Partial<SyncStatusInfo>) {
  currentStatus = { ...currentStatus, ...patch };
  if (statusCallback) {
    statusCallback(currentStatus);
  }
}

export async function saveSimulatorStateToB2(state: any) {
  updateStatus({ status: 'syncing', error: null });
  const simulatorId = getSimulatorId();
  const filename = `simulator-state-${simulatorId}.json`;
  
  try {
    const result = await backblazeService.saveJson(filename, state);
    if (result.success) {
      updateStatus({ status: 'success', lastSyncedAt: Date.now() });
      return true;
    } else {
      updateStatus({ status: 'error', error: result.error || 'Unknown error' });
      return false;
    }
  } catch (err: any) {
    updateStatus({ status: 'error', error: err.message });
    return false;
  }
}

export async function loadSimulatorStateFromB2() {
  const simulatorId = getSimulatorId();
  const filename = `simulator-state-${simulatorId}.json`;
  try {
    const data = await backblazeService.loadJson<any>(filename);
    if (data) {
      updateStatus({ source: 'cloud', lastSyncedAt: Date.now() });
    }
    return data;
  } catch (err) {
    console.error('Failed to load simulator state from B2:', err);
    return null;
  }
}

/**
 * Debounced sync function to avoid excessive B2 API calls
 */
export function scheduleSimulatorSync(state: any) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    saveSimulatorStateToB2(state);
  }, 3000); // 3 second debounce
}

export function subscribeSyncStatus(callback: (status: SyncStatusInfo) => void) {
  statusCallback = callback;
  callback(currentStatus);
  return () => {
    statusCallback = null;
  };
}

export function getSimulatorId() {
  return 'institutional-user-01';
}
