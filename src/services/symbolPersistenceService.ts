import { collection, onSnapshot, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './authService';
import { useState, useEffect } from 'react';

export interface PersistedSymbolPrice {
  symbol: string;
  name?: string;
  price: number;
  previousClose?: number;
  change?: number;
  changePct?: number;
  high?: number;
  low?: number;
  volume?: number;
  currency?: string;
  category?: 'crypto' | 'gold' | 'equity' | 'index' | 'commodity' | string;
  source?: string;
  updatedAt: string;
  updatedAtMs?: number;
  dataTimestamp?: number;
}

const STORAGE_CACHE_KEY = 'aurumx_persisted_symbols_v1';

// Global cache to avoid redundant network/database calls across components
let memoryCache: Record<string, PersistedSymbolPrice> = {};
const listeners = new Set<(prices: Record<string, PersistedSymbolPrice>) => void>();
let isInitialized = false;
let lastSyncTimestamp = 0;

// Initialize cache from local storage on load
try {
  const local = localStorage.getItem(STORAGE_CACHE_KEY);
  if (local) {
    memoryCache = JSON.parse(local);
  }
} catch {
  // Ignore localStorage parsing errors
}

function notifyListeners() {
  const current = { ...memoryCache };
  listeners.forEach((callback) => callback(current));
}

// Subscribe to Firestore symbol_prices collection
export function initSymbolPersistence() {
  if (isInitialized) return;
  isInitialized = true;

  const collectionPath = 'symbol_prices';
  try {
    const colRef = collection(db, collectionPath);
    onSnapshot(
      colRef,
      (snapshot) => {
        let hasChanges = false;
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as PersistedSymbolPrice;
          if (data && data.symbol && typeof data.price === 'number') {
            const sym = data.symbol.toUpperCase();
            const existing = memoryCache[sym];
            const incomingTimestamp = data.dataTimestamp || data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now());
            const existingTimestamp = existing ? (existing.dataTimestamp || existing.updatedAtMs || (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0)) : 0;

            // Reject any Firestore update whose timestamp is older than or equal to local state
            if (!existing || incomingTimestamp > existingTimestamp) {
              memoryCache[sym] = {
                ...data,
                symbol: sym,
                updatedAtMs: incomingTimestamp,
                dataTimestamp: incomingTimestamp,
              };
              hasChanges = true;
            }
          }
        });

        // Also ensure full initial snapshot is populated
        if (snapshot.size > 0 && Object.keys(memoryCache).length === 0) {
          snapshot.forEach((d) => {
            const data = d.data() as PersistedSymbolPrice;
            if (data && data.symbol) {
              const sym = data.symbol.toUpperCase();
              const incomingTimestamp = data.dataTimestamp || data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now());
              memoryCache[sym] = {
                ...data,
                symbol: sym,
                updatedAtMs: incomingTimestamp,
                dataTimestamp: incomingTimestamp,
              };
              hasChanges = true;
            }
          });
        }

        if (hasChanges) {
          lastSyncTimestamp = Date.now();
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(memoryCache));
          } catch {
            // LocalStorage quota safety
          }
          notifyListeners();
        }
      },
      (error) => {
        console.warn('[SymbolPersistence] Firestore listener fallback triggered:', error);
        // Fallback to backend API if Firestore realtime is unavailable
        fetchBackendPersistedQuotes();
      }
    );
  } catch (err) {
    console.warn('[SymbolPersistence] Firestore init warning:', err);
    fetchBackendPersistedQuotes();
  }

  // Initial proactive fetch from backend persistent storage
  fetchBackendPersistedQuotes();
}

// Fallback or booster sync with backend persistent store
export async function fetchBackendPersistedQuotes(): Promise<Record<string, PersistedSymbolPrice>> {
  try {
    const res = await fetch('/api/quotes/persistent');
    if (!res.ok) return memoryCache;
    const json = await res.json();
    if (json.success && json.quotes) {
      Object.entries(json.quotes).forEach(([sym, data]) => {
        const quote = data as PersistedSymbolPrice;
        if (quote && quote.symbol && typeof quote.price === 'number') {
          memoryCache[sym.toUpperCase()] = {
            ...quote,
            symbol: sym.toUpperCase(),
          };
        }
      });
      lastSyncTimestamp = Date.now();
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(memoryCache));
      } catch {
        // Safe quota
      }
      notifyListeners();
    }
  } catch (err) {
    console.warn('[SymbolPersistence] Backend persistent fetch error:', err);
  }
  return memoryCache;
}

// Hook for components to subscribe to real-time persisted prices
export function usePersistentSymbols() {
  const [prices, setPrices] = useState<Record<string, PersistedSymbolPrice>>(() => memoryCache);
  const [lastSync, setLastSync] = useState<number>(() => lastSyncTimestamp);

  useEffect(() => {
    initSymbolPersistence();

    const handler = (updatedPrices: Record<string, PersistedSymbolPrice>) => {
      setPrices(updatedPrices);
      setLastSync(lastSyncTimestamp);
    };

    listeners.add(handler);
    // Immediate push
    if (Object.keys(memoryCache).length > 0) {
      setPrices({ ...memoryCache });
    }

    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    prices,
    lastSync,
    symbolCount: Object.keys(prices).length,
    isPersisted: Object.keys(prices).length > 0,
    refresh: fetchBackendPersistedQuotes,
  };
}

// User portfolio and terminal state persistence in Firestore
export async function persistUserPortfolio(userId: string, data: any): Promise<boolean> {
  if (!userId) return false;
  const path = `users/${userId}/snapshots/${Date.now()}`;
  try {
    await setDoc(doc(db, 'users', userId, 'snapshots', String(Date.now())), {
      userId,
      data,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}
