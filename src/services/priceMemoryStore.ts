/**
 * Global Module-Level Price Memory Store
 * Remembers the latest price for every symbol across re-renders, view switches, and filter changes.
 * Guarantees that once a live price is received, components never bounce back to hardcoded default prices.
 */

export interface RememberedPrice {
  symbol: string;
  price: number;
  change1d?: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  dataTimestamp: number;
}

const STORAGE_KEY = 'aurumx_price_memory_v2';

// Module-level persistent map surviving component unmounts and view switches
const memoryStore: Record<string, RememberedPrice> = {};

// Load persisted memory store from localStorage on boot
try {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    const parsed = JSON.parse(local);
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([sym, val]: [string, any]) => {
        if (val && typeof val.price === 'number' && val.price > 0) {
          memoryStore[sym.toUpperCase()] = {
            symbol: sym.toUpperCase(),
            price: val.price,
            change1d: val.change1d,
            change24h: val.change24h,
            high24h: val.high24h,
            low24h: val.low24h,
            volume24h: val.volume24h,
            dataTimestamp: val.dataTimestamp || Date.now(),
          };
        }
      });
    }
  }
} catch {
  // Safe quota fallback
}

export function getRememberedPrice(symbol: string): RememberedPrice | undefined {
  if (!symbol) return undefined;
  return memoryStore[symbol.toUpperCase()];
}

/**
 * Update remembered price only if incoming data is newer and valid
 */
export function updateRememberedPrice(
  symbol: string,
  price: number,
  dataTimestamp: number,
  extra?: Partial<RememberedPrice>
): boolean {
  if (!symbol || typeof price !== 'number' || isNaN(price) || price <= 0) {
    return false;
  }

  const cleanSym = symbol.toUpperCase();
  const existing = memoryStore[cleanSym];
  const existingTs = existing?.dataTimestamp || 0;

  if (!existing || dataTimestamp > existingTs) {
    memoryStore[cleanSym] = {
      ...existing,
      ...extra,
      symbol: cleanSym,
      price,
      dataTimestamp,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch {}

    return true;
  }

  return false;
}

/**
 * Hydrates an item with remembered price if remembered data is newer than default/hardcoded item data
 */
export function getHydratedPrice<T extends { symbol?: string; id?: string; price: number; dataTimestamp?: number; change1d?: number; change24h?: number; high24h?: number; low24h?: number }>(
  item: T
): T {
  if (!item) return item;
  const sym = item.symbol || item.id;
  if (!sym) return item;

  const remembered = getRememberedPrice(sym);
  if (!remembered) return item;

  const itemTs = item.dataTimestamp || 0;
  if (remembered.dataTimestamp >= itemTs) {
    return {
      ...item,
      price: remembered.price,
      dataTimestamp: remembered.dataTimestamp,
      ...(remembered.change1d !== undefined ? { change1d: remembered.change1d } : {}),
      ...(remembered.change24h !== undefined ? { change24h: remembered.change24h } : {}),
      ...(remembered.high24h !== undefined ? { high24h: remembered.high24h } : {}),
      ...(remembered.low24h !== undefined ? { low24h: remembered.low24h } : {}),
    };
  }

  return item;
}

/**
 * Resolves the true live price for a symbol.
 * Guarantees that once a live price is received, it is NEVER overwritten by a hardcoded master price or stale payload.
 */
export function resolveLivePrice<T extends { symbol?: string; id?: string; price: number; dataTimestamp?: number; updatedAtMs?: number }>(
  incoming: T,
  fallbackExistingPrice?: number
): number {
  if (!incoming) return fallbackExistingPrice || 0;
  const sym = incoming.symbol || incoming.id;
  if (!sym) return incoming.price;

  const remembered = getRememberedPrice(sym);
  const incomingTs = incoming.dataTimestamp || incoming.updatedAtMs || 0;

  if (remembered) {
    // If incoming data has a strictly newer valid timestamp, accept incoming price
    if (incomingTs > remembered.dataTimestamp && typeof incoming.price === 'number' && incoming.price > 0) {
      return incoming.price;
    }
    // Otherwise maintain the remembered live price!
    return remembered.price;
  }

  // If no remembered price yet, use fallbackExistingPrice if present, or incoming.price
  if (fallbackExistingPrice && fallbackExistingPrice > 0) {
    return fallbackExistingPrice;
  }

  return incoming.price;
}
