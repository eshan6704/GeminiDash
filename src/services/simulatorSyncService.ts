import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './authService';
import { BatchWriterService } from './batchWriterService';
import {
  MarketAsset,
  Position,
  LimitOrder,
  TradeRecord,
  SpotHolding,
  SimulatorConfig,
} from '../types/trading';
import { PriceAlert } from '../hooks/useTradeSimulator';

export interface SimulatorSyncData {
  simulatorId: string;
  userId?: string;
  cashBalance: number;
  positions: Position[];
  assets?: Record<string, Partial<MarketAsset>>;
  limitOrders: LimitOrder[];
  tradeHistory: TradeRecord[];
  spotHoldings: SpotHolding[];
  priceAlerts: PriceAlert[];
  config: SimulatorConfig;
  totalEquity?: number;
  totalRealizedPnL?: number;
  updatedAt: string;
}

export type SyncStateStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncStatusInfo {
  status: SyncStateStatus;
  lastSyncedAt: Date | null;
  error: string | null;
  simulatorId: string;
  source: 'firestore' | 'rest' | 'local';
}

const LOCAL_STORAGE_CLIENT_ID = 'aurumx_simulator_client_id_v2';
const LOCAL_STORAGE_BACKUP_STATE = 'aurumx_simulator_cloud_mirror_v2';

/**
 * Returns a persistent identifier for the simulator state.
 * If user is authenticated, uses user UID. Otherwise generates or retrieves a stable client ID.
 */
export function getSimulatorId(): string {
  if (auth.currentUser?.uid) {
    return `user_${auth.currentUser.uid}`;
  }

  try {
    let clientId = localStorage.getItem(LOCAL_STORAGE_CLIENT_ID);
    if (!clientId) {
      clientId = `sim_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem(LOCAL_STORAGE_CLIENT_ID, clientId);
    }
    return clientId;
  } catch {
    return 'sim_default_terminal';
  }
}

// Current status trackers & listeners
let currentStatus: SyncStatusInfo = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  simulatorId: getSimulatorId(),
  source: 'local',
};

const statusListeners = new Set<(status: SyncStatusInfo) => void>();

function updateStatus(patch: Partial<SyncStatusInfo>) {
  currentStatus = { ...currentStatus, ...patch };
  statusListeners.forEach((cb) => cb(currentStatus));
}

export function subscribeSyncStatus(listener: (status: SyncStatusInfo) => void): () => void {
  listener(currentStatus);
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getCurrentSyncStatus(): SyncStatusInfo {
  return currentStatus;
}

/**
 * Strips undefined properties and truncates unbounded structures to prevent Firestore serialization errors
 */
function sanitizeSimulatorPayload(data: SimulatorSyncData): SimulatorSyncData {
  const sanitizedAssets: Record<string, Partial<MarketAsset>> = {};
  if (data.assets) {
    Object.entries(data.assets).forEach(([symbol, asset]) => {
      if (asset) {
        sanitizedAssets[symbol] = {
          symbol: asset.symbol || symbol,
          price: Number(asset.price ?? 0),
          change24h: Number(asset.change24h ?? 0),
          high24h: Number(asset.high24h ?? asset.price ?? 0),
          low24h: Number(asset.low24h ?? asset.price ?? 0),
          volume24h: Number(asset.volume24h ?? 0),
          lastUpdated: Number(asset.lastUpdated ?? Date.now()),
        };
      }
    });
  }

  return {
    simulatorId: data.simulatorId || getSimulatorId(),
    userId: auth.currentUser?.uid || data.userId || 'anonymous_trader',
    cashBalance: Number(data.cashBalance ?? 100),
    positions: (data.positions || []).slice(0, 200).map((p) => ({
      ...p,
      takeProfitPrice: p.takeProfitPrice !== undefined ? Number(p.takeProfitPrice) : 0,
      stopLossPrice: p.stopLossPrice !== undefined ? Number(p.stopLossPrice) : 0,
      trailingStopPercent: p.trailingStopPercent !== undefined ? Number(p.trailingStopPercent) : 0,
      peakPrice: p.peakPrice !== undefined ? Number(p.peakPrice) : p.entryPrice,
    })),
    assets: sanitizedAssets,
    limitOrders: (data.limitOrders || []).slice(0, 200).map((o) => ({
      ...o,
      takeProfitPrice: o.takeProfitPrice !== undefined ? Number(o.takeProfitPrice) : 0,
      stopLossPrice: o.stopLossPrice !== undefined ? Number(o.stopLossPrice) : 0,
      trailingStopPercent: o.trailingStopPercent !== undefined ? Number(o.trailingStopPercent) : 0,
    })),
    tradeHistory: (data.tradeHistory || []).slice(0, 1000),
    spotHoldings: (data.spotHoldings || []).slice(0, 200),
    priceAlerts: (data.priceAlerts || []).slice(0, 200),
    config: {
      initialBalance: Number(data.config?.initialBalance ?? 100),
      brokerName: String(data.config?.brokerName || 'Shark Exchange'),
      takerFeeRate: Number(data.config?.takerFeeRate ?? 0.00064),
      makerFeeRate: Number(data.config?.makerFeeRate ?? 0.00016),
      slippageRate: Number(data.config?.slippageRate ?? 0.0004),
      enableSlippage: Boolean(data.config?.enableSlippage ?? true),
      enableFees: Boolean(data.config?.enableFees ?? true),
    },
    totalEquity: data.totalEquity !== undefined ? Number(data.totalEquity) : undefined,
    totalRealizedPnL: data.totalRealizedPnL !== undefined ? Number(data.totalRealizedPnL) : undefined,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Save simulator state directly into Firestore configured in firebase-applet-config.json
 */
export async function saveSimulatorStateToFirestore(rawState: SimulatorSyncData): Promise<boolean> {
  const simulatorId = rawState.simulatorId || getSimulatorId();
  const path = `simulator_states/${simulatorId}`;
  const payload = sanitizeSimulatorPayload({ ...rawState, simulatorId });

  updateStatus({ status: 'syncing', simulatorId, error: null });

  try {
    // Use BatchWriterService to queue simulator state write (reduces network frequency & rate limits)
    BatchWriterService.enqueueWrite('simulator_states', simulatorId, payload, false);
    if (auth.currentUser?.uid) {
      BatchWriterService.enqueueWrite(`users/${auth.currentUser.uid}/simulator`, 'state', payload, false);
    }
    await BatchWriterService.flushNow();

    // Save local mirror backup
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_STATE, JSON.stringify(payload));
    } catch {
      // Safe storage
    }

    updateStatus({
      status: 'synced',
      lastSyncedAt: new Date(),
      error: null,
      source: 'firestore',
    });
    return true;
  } catch (error) {
    console.warn(`[SimulatorSync] Direct Firestore write failed for ${path}, attempting backend fallback:`, error);
    
    // Fallback to backend server sync endpoint
    try {
      const resp = await fetch('/api/simulator/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        updateStatus({
          status: 'synced',
          lastSyncedAt: new Date(),
          error: null,
          source: 'rest',
        });
        return true;
      }
    } catch (restErr) {
      console.error('[SimulatorSync] Backend REST sync also failed:', restErr);
    }

    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (e: any) {
      updateStatus({
        status: 'error',
        error: e.message || 'Firestore write failed',
      });
    }

    return false;
  }
}

/**
 * Load simulator state from Firestore across page refreshes
 */
export async function loadSimulatorStateFromFirestore(customId?: string): Promise<SimulatorSyncData | null> {
  const simulatorId = customId || getSimulatorId();
  const path = `simulator_states/${simulatorId}`;

  updateStatus({ status: 'syncing', simulatorId, error: null });

  try {
    // 1. Try reading from Firestore directly
    const docRef = doc(db, 'simulator_states', simulatorId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as SimulatorSyncData;
      updateStatus({
        status: 'synced',
        lastSyncedAt: new Date(),
        error: null,
        source: 'firestore',
      });
      return data;
    }

    // 2. If authenticated, try user profile subcollection
    if (auth.currentUser?.uid) {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'simulator', 'state');
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as SimulatorSyncData;
        updateStatus({
          status: 'synced',
          lastSyncedAt: new Date(),
          error: null,
          source: 'firestore',
        });
        return data;
      }
    }

    // 3. Fallback to backend REST endpoint
    const res = await fetch(`/api/simulator/state/${encodeURIComponent(simulatorId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        updateStatus({
          status: 'synced',
          lastSyncedAt: new Date(),
          error: null,
          source: 'rest',
        });
        return json.data as SimulatorSyncData;
      }
    }

    updateStatus({ status: 'idle', error: null });
    return null;
  } catch (error) {
    console.warn(`[SimulatorSync] Failed to load state from ${path}:`, error);

    // Fallback: check local backup
    try {
      const backup = localStorage.getItem(LOCAL_STORAGE_BACKUP_STATE);
      if (backup) {
        const parsed = JSON.parse(backup);
        updateStatus({ status: 'idle', source: 'local' });
        return parsed;
      }
    } catch {
      // Ignore
    }

    updateStatus({ status: 'error', error: 'Failed to load simulator state' });
    return null;
  }
}

/**
 * Real-time listener for remote changes to simulator state
 */
export function subscribeSimulatorState(
  simulatorId: string,
  onRemoteChange: (state: SimulatorSyncData) => void
): () => void {
  const path = `simulator_states/${simulatorId}`;
  try {
    const docRef = doc(db, 'simulator_states', simulatorId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SimulatorSyncData;
          onRemoteChange(data);
          updateStatus({
            status: 'synced',
            lastSyncedAt: new Date(),
            source: 'firestore',
          });
        }
      },
      (error) => {
        console.warn(`[SimulatorSync] Listener error on ${path}:`, error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[SimulatorSync] Failed to setup Firestore snapshot listener:', err);
    return () => {};
  }
}

// Debounce controller for automatic state synchronization
let syncDebounceTimer: any = null;
let pendingState: SimulatorSyncData | null = null;

export function scheduleSimulatorSync(state: SimulatorSyncData, immediate = false): void {
  pendingState = state;

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  if (immediate) {
    if (pendingState) {
      const toSync = pendingState;
      pendingState = null;
      saveSimulatorStateToFirestore(toSync);
    }
    return;
  }

  syncDebounceTimer = setTimeout(() => {
    if (pendingState) {
      const toSync = pendingState;
      pendingState = null;
      saveSimulatorStateToFirestore(toSync);
    }
  }, 1200); // 1.2 second debounce to prevent rapid fire mutations
}
