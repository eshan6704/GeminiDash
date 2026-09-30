/**
 * Real-time Exchange WebSocket Feed (Active-Tab & Visibility Optimized)
 * Streams lightweight 1s @miniTicker updates only for the active coin / required symbols
 * and pauses automatically when the user is on non-crypto tabs or when the browser tab is hidden.
 */

import { MarketAsset } from '../types/trading';

export type PriceUpdateCallback = (updates: Partial<Record<string, Partial<MarketAsset>>>) => void;

interface StreamStatus {
  binanceConnected: boolean;
  bitfinexConnected: boolean;
  lastTickTimestamp: number;
  totalTicksReceived: number;
  activeFeedName: string;
}

export interface WebSocketNetworkScope {
  isActivePage: boolean; // True when on COIN or CRYPTO tab
  activeSymbol: string;  // Currently selected coin in COIN tab
  requiredSymbols?: string[]; // Symbols with open positions/orders or visible in active view
}

class LiveWebSocketFeedManager {
  private binanceWs: WebSocket | null = null;
  private listeners: Set<PriceUpdateCallback> = new Set();
  private statusListeners: Set<(status: StreamStatus) => void> = new Set();

  private isStarted = false;
  private binanceReconnectTimer: any = null;
  private flushTimer: any = null;
  private pendingUpdates: Partial<Record<string, Partial<MarketAsset>>> = {};
  private currentStreamKey = '';

  private scope: WebSocketNetworkScope = {
    isActivePage: true,
    activeSymbol: 'BTC',
    requiredSymbols: ['BTC', 'PAXG', 'ZEC', 'SOL'],
  };

  private status: StreamStatus = {
    binanceConnected: false,
    bitfinexConnected: false,
    lastTickTimestamp: Date.now(),
    totalTicksReceived: 0,
    activeFeedName: 'Active-Tab Live WS',
  };

  private binanceSymbolMap: Record<string, string> = {
    BTCUSDT: 'BTC',
    ETHUSDT: 'ETH',
    SOLUSDT: 'SOL',
    PAXGUSDT: 'PAXG',
    BNBUSDT: 'BNB',
    XRPUSDT: 'XRP',
    DOGEUSDT: 'DOGE',
    ZECUSDT: 'ZEC',
  };

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.disconnectSocketOnly();
        } else if (this.isStarted && this.shouldConnect()) {
          this.connectBinance();
        }
      });
    }
  }

  private shouldConnect(): boolean {
    if (typeof document !== 'undefined' && document.hidden) return false;
    if (this.scope.isActivePage) return true;
    return Array.isArray(this.scope.requiredSymbols) && this.scope.requiredSymbols.length > 0;
  }

  /**
   * Controls which symbols are fetched/streamed based on the currently active page/tab.
   */
  public setNetworkScope(nextScope: WebSocketNetworkScope) {
    this.scope = nextScope;
    if (!this.isStarted) return;

    if (!this.shouldConnect()) {
      this.disconnectSocketOnly();
      return;
    }

    const desiredKey = this.buildStreamsList().join('/');
    if (!this.binanceWs || this.currentStreamKey !== desiredKey) {
      this.connectBinance();
    }
  }

  private buildStreamsList(): string[] {
    const wanted = new Set<string>();

    const addSym = (raw: string) => {
      const s = (raw || '').toUpperCase();
      if (s === 'XAUT' || s === 'PAXG') {
        wanted.add('paxgusdt@miniTicker');
      } else if (s === 'BTC') {
        wanted.add('btcusdt@miniTicker');
      } else if (s === 'ZEC') {
        wanted.add('zecusdt@miniTicker');
      } else if (s === 'SOL') {
        wanted.add('solusdt@miniTicker');
      } else if (s === 'ETH') {
        wanted.add('ethusdt@miniTicker');
      } else if (s === 'XRP') {
        wanted.add('xrpusdt@miniTicker');
      } else if (s === 'DOGE') {
        wanted.add('dogeusdt@miniTicker');
      } else if (s === 'BNB') {
        wanted.add('bnbusdt@miniTicker');
      }
    };

    if (this.scope.activeSymbol) {
      addSym(this.scope.activeSymbol);
    }
    if (Array.isArray(this.scope.requiredSymbols)) {
      this.scope.requiredSymbols.forEach(addSym);
    }

    if (wanted.size === 0) {
      wanted.add('btcusdt@miniTicker');
      wanted.add('paxgusdt@miniTicker');
    }

    return Array.from(wanted).sort();
  }

  public subscribe(cb: PriceUpdateCallback): () => void {
    this.listeners.add(cb);
    if (!this.isStarted) {
      this.start();
    }
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  public subscribeStatus(cb: (status: StreamStatus) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  public getStatus(): StreamStatus {
    return this.status;
  }

  private queueUpdate(updates: Partial<Record<string, Partial<MarketAsset>>>) {
    Object.entries(updates).forEach(([sym, patch]) => {
      if (!patch) return;
      this.pendingUpdates[sym] = {
        ...(this.pendingUpdates[sym] || {}),
        ...patch,
      };
    });

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        const batch = this.pendingUpdates;
        this.pendingUpdates = {};
        if (Object.keys(batch).length > 0) {
          this.notify(batch);
        }
      }, 1000);
    }
  }

  private notify(updates: Partial<Record<string, Partial<MarketAsset>>>) {
    this.status.lastTickTimestamp = Date.now();
    this.status.totalTicksReceived += 1;
    this.status.activeFeedName =
      this.binanceWs?.readyState === WebSocket.OPEN ? 'Active-Tab Live WS' : 'Standby (Page Inactive)';

    this.listeners.forEach((cb) => {
      try {
        cb(updates);
      } catch (err) {
        console.error('Error in price update listener', err);
      }
    });

    this.statusListeners.forEach((cb) => cb(this.status));
  }

  public start() {
    if (this.isStarted) return;
    this.isStarted = true;
    if (this.shouldConnect()) {
      this.connectBinance();
    }
  }

  private disconnectSocketOnly() {
    if (this.binanceReconnectTimer) {
      clearTimeout(this.binanceReconnectTimer);
      this.binanceReconnectTimer = null;
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.binanceWs) {
      this.binanceWs.onclose = null;
      this.binanceWs.onerror = null;
      if (
        this.binanceWs.readyState === WebSocket.CONNECTING ||
        this.binanceWs.readyState === WebSocket.OPEN
      ) {
        this.binanceWs.close();
      }
      this.binanceWs = null;
    }
    this.currentStreamKey = '';
    this.status.binanceConnected = false;
    this.status.activeFeedName = 'Paused (Inactive Tab)';
    this.statusListeners.forEach((cb) => cb(this.status));
  }

  public stop() {
    this.isStarted = false;
    this.disconnectSocketOnly();
  }

  private connectBinance() {
    if (!this.isStarted || !this.shouldConnect()) return;

    this.disconnectSocketOnly();

    try {
      const streamArr = this.buildStreamsList();
      const streams = streamArr.join('/');
      this.currentStreamKey = streams;

      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      const ws = new WebSocket(url);
      this.binanceWs = ws;

      ws.onopen = () => {
        this.status.binanceConnected = true;
        this.status.activeFeedName = 'Active-Tab Live WS';
        this.statusListeners.forEach((cb) => cb(this.status));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || !payload.data) return;

          const data = payload.data;
          if (data.e === '24hrMiniTicker' || data.e === '24hrTicker') {
            const sym =
              this.binanceSymbolMap[data.s] ||
              (typeof data.s === 'string' && data.s.endsWith('USDT')
                ? data.s.slice(0, -4).toUpperCase()
                : undefined);
            if (sym) {
              const price = parseFloat(data.c);
              const openPrice = parseFloat(data.o);
              const high24h = parseFloat(data.h);
              const low24h = parseFloat(data.l);
              const volume24h = parseFloat(data.q);
              const sourceTime = data.E || Date.now();
              const change24h =
                !isNaN(openPrice) && openPrice > 0
                  ? Number((((price - openPrice) / openPrice) * 100).toFixed(2))
                  : undefined;

              if (!isNaN(price) && price > 0) {
                const updates: Partial<Record<string, Partial<MarketAsset>>> = {
                  [sym]: {
                    price,
                    change24h,
                    high24h: isNaN(high24h) ? undefined : high24h,
                    low24h: isNaN(low24h) ? undefined : low24h,
                    volume24h: isNaN(volume24h) ? undefined : volume24h,
                    lastUpdated: sourceTime,
                    dataTimestamp: sourceTime,
                  },
                };
                if (sym === 'PAXG') {
                  const xautPrice = Number((price * 1.0005).toFixed(2));
                  updates.XAUT = {
                    price: xautPrice,
                    change24h,
                    high24h: isNaN(high24h) ? undefined : Number((high24h * 1.0005).toFixed(2)),
                    low24h: isNaN(low24h) ? undefined : Number((low24h * 1.0005).toFixed(2)),
                    lastUpdated: sourceTime,
                    dataTimestamp: sourceTime,
                  };
                }
                this.queueUpdate(updates);
              }
            }
          }
        } catch {
          // Ignore malformed WS frame
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        this.status.binanceConnected = false;
        this.statusListeners.forEach((cb) => cb(this.status));
        if (this.isStarted && this.shouldConnect()) {
          this.binanceReconnectTimer = setTimeout(() => this.connectBinance(), 5000);
        }
      };
    } catch {
      if (this.isStarted && this.shouldConnect()) {
        this.binanceReconnectTimer = setTimeout(() => this.connectBinance(), 6000);
      }
    }
  }
}

export const liveWebSocketFeed = new LiveWebSocketFeedManager();
