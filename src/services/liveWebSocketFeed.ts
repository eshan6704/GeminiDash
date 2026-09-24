/**
 * Real-time Exchange WebSocket Feeds (Binance & Bitfinex)
 * Provides 100% genuine live market prices and orderbook trades directly from official exchange streams.
 * NO simulated or Math.random jitter.
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

class LiveWebSocketFeedManager {
  private binanceWs: WebSocket | null = null;
  private bitfinexWs: WebSocket | null = null;
  private listeners: Set<PriceUpdateCallback> = new Set();
  private statusListeners: Set<(status: StreamStatus) => void> = new Set();

  private isStarted = false;
  private binanceReconnectTimer: any = null;
  private bitfinexReconnectTimer: any = null;
  private bitfinexChanId: number | null = null;

  private status: StreamStatus = {
    binanceConnected: false,
    bitfinexConnected: false,
    lastTickTimestamp: Date.now(),
    totalTicksReceived: 0,
    activeFeedName: 'Connecting...',
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

  private notify(updates: Partial<Record<string, Partial<MarketAsset>>>) {
    this.status.lastTickTimestamp = Date.now();
    this.status.totalTicksReceived += 1;
    this.status.activeFeedName = this.binanceWs?.readyState === WebSocket.OPEN
      ? 'Binance & Bitfinex Live WS'
      : 'Exchange Live WS';

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
    this.connectBinance();
    this.connectBitfinex();
  }

  public stop() {
    this.isStarted = false;
    if (this.binanceReconnectTimer) clearTimeout(this.binanceReconnectTimer);
    if (this.bitfinexReconnectTimer) clearTimeout(this.bitfinexReconnectTimer);

    if (this.binanceWs) {
      this.binanceWs.onclose = null;
      this.binanceWs.onerror = null;
      if (this.binanceWs.readyState === WebSocket.CONNECTING || this.binanceWs.readyState === WebSocket.OPEN) {
        this.binanceWs.close();
      }
      this.binanceWs = null;
    }
    if (this.bitfinexWs) {
      this.bitfinexWs.onclose = null;
      this.bitfinexWs.onerror = null;
      if (this.bitfinexWs.readyState === WebSocket.CONNECTING || this.bitfinexWs.readyState === WebSocket.OPEN) {
        this.bitfinexWs.close();
      }
      this.bitfinexWs = null;
    }
    this.status.binanceConnected = false;
    this.status.bitfinexConnected = false;
    this.statusListeners.forEach((cb) => cb(this.status));
  }

  /**
   * 1. Binance WebSocket Feed
   * Streams live 24hr tickers & real-time trades for PAXG (Gold), BTC, ETH, SOL, BNB, XRP, DOGE.
   */
  private connectBinance() {
    if (!this.isStarted) return;

    try {
      const streams = [
        'paxgusdt@ticker',
        'btcusdt@ticker',
        'ethusdt@ticker',
        'solusdt@ticker',
        'bnbusdt@ticker',
        'xrpusdt@ticker',
        'dogeusdt@ticker',
        'zecusdt@ticker',
        // Real-time mini tickers for instant sub-second price updates
        'paxgusdt@miniTicker',
        'btcusdt@miniTicker',
        'ethusdt@miniTicker',
        'solusdt@miniTicker',
        'bnbusdt@miniTicker',
        'xrpusdt@miniTicker',
        'dogeusdt@miniTicker',
        'zecusdt@miniTicker',
        // Real-time aggregate trade stream for Gold (PAXG) and BTC
        'paxgusdt@aggTrade',
        'btcusdt@aggTrade',
        'zecusdt@aggTrade',
      ].join('/');

      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      const ws = new WebSocket(url);
      this.binanceWs = ws;

      ws.onopen = () => {
        this.status.binanceConnected = true;
        this.statusListeners.forEach((cb) => cb(this.status));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || !payload.data) return;

          const data = payload.data;
          const eventType = data.e;

          // 24hr Ticker event
          if (eventType === '24hrTicker') {
            const sym = this.binanceSymbolMap[data.s];
            if (sym) {
              const price = parseFloat(data.c);
              const change24h = parseFloat(data.P);
              const high24h = parseFloat(data.h);
              const low24h = parseFloat(data.l);
              const volume24h = parseFloat(data.q); // quote volume (USDT)

              if (!isNaN(price) && price > 0) {
                const updates: Partial<Record<string, Partial<MarketAsset>>> = {
                  [sym]: {
                    price,
                    change24h: isNaN(change24h) ? undefined : change24h,
                    high24h: isNaN(high24h) ? undefined : high24h,
                    low24h: isNaN(low24h) ? undefined : low24h,
                    volume24h: isNaN(volume24h) ? undefined : volume24h,
                    lastUpdated: Date.now(),
                  },
                };

                // If updating PAXG, sync XAUT if Bitfinex is not connected
                if (sym === 'PAXG' && !this.status.bitfinexConnected) {
                  updates.XAUT = {
                    price,
                    change24h: isNaN(change24h) ? undefined : change24h,
                    high24h: isNaN(high24h) ? undefined : high24h,
                    low24h: isNaN(low24h) ? undefined : low24h,
                    lastUpdated: Date.now(),
                  };
                }

                this.notify(updates);
              }
            }
          } else if (eventType === '24hrMiniTicker') {
            // Instant sub-second mini ticker
            const sym = this.binanceSymbolMap[data.s];
            if (sym) {
              const price = parseFloat(data.c);
              const high24h = parseFloat(data.h);
              const low24h = parseFloat(data.l);
              const volume24h = parseFloat(data.q);

              if (!isNaN(price) && price > 0) {
                const nowMs = Date.now();
                const updates: Partial<Record<string, Partial<MarketAsset>>> = {
                  [sym]: {
                    price,
                    high24h: isNaN(high24h) ? undefined : high24h,
                    low24h: isNaN(low24h) ? undefined : low24h,
                    volume24h: isNaN(volume24h) ? undefined : volume24h,
                    lastUpdated: nowMs,
                    dataTimestamp: nowMs,
                  },
                };
                if (sym === 'PAXG' && !this.status.bitfinexConnected) {
                  updates.XAUT = { price, lastUpdated: nowMs, dataTimestamp: nowMs };
                }
                this.notify(updates);
              }
            }
          } else if (eventType === 'aggTrade') {
            // Real-time matched trade on Binance order matching engine
            const sym = this.binanceSymbolMap[data.s];
            if (sym) {
              const tradePrice = parseFloat(data.p);
              if (!isNaN(tradePrice) && tradePrice > 0) {
                const nowMs = Date.now();
                const updates: Partial<Record<string, Partial<MarketAsset>>> = {
                  [sym]: {
                    price: tradePrice,
                    lastUpdated: nowMs,
                    dataTimestamp: nowMs,
                  },
                };
                if (sym === 'PAXG' && !this.status.bitfinexConnected) {
                  updates.XAUT = { price: tradePrice, lastUpdated: nowMs, dataTimestamp: nowMs };
                }
                this.notify(updates);
              }
            }
          }
        } catch (e) {
          console.warn('Binance WS message parse error', e);
        }
      };

      ws.onerror = () => {
        // Silent handling for preview/sandbox network restrictions
      };

      ws.onclose = () => {
        this.status.binanceConnected = false;
        this.statusListeners.forEach((cb) => cb(this.status));
        if (this.isStarted) {
          this.binanceReconnectTimer = setTimeout(() => this.connectBinance(), 3000);
        }
      };
    } catch (err) {
      console.error('Failed to establish Binance WS', err);
      if (this.isStarted) {
        this.binanceReconnectTimer = setTimeout(() => this.connectBinance(), 5000);
      }
    }
  }

  /**
   * 2. Bitfinex WebSocket Feed for Tether Gold (XAUT)
   * Bitfinex is the primary liquidity issuer and market maker for Tether Gold (tXAUT:USD).
   */
  private connectBitfinex() {
    if (!this.isStarted) return;

    try {
      const url = 'wss://api-pub.bitfinex.com/ws/2';
      const ws = new WebSocket(url);
      this.bitfinexWs = ws;

      ws.onopen = () => {
        this.status.bitfinexConnected = true;
        this.statusListeners.forEach((cb) => cb(this.status));

        // Subscribe to Tether Gold (XAUt) real-time ticker
        const subMsg = {
          event: 'subscribe',
          channel: 'ticker',
          symbol: 'tXAUT:USD',
        };
        ws.send(JSON.stringify(subMsg));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Subscription confirmation
          if (data && data.event === 'subscribed' && data.channel === 'ticker') {
            this.bitfinexChanId = data.chanId;
            return;
          }

          // Ticker message: [chanId, [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_RELATIVE, LAST_PRICE, VOLUME, HIGH, LOW]]
          if (Array.isArray(data) && data[0] === this.bitfinexChanId && Array.isArray(data[1])) {
            const ticker = data[1];
            // [6] is LAST_PRICE
            const lastPrice = Number(ticker[6]);
            const changeRelative = Number(ticker[5]) * 100;
            const high = Number(ticker[8]);
            const low = Number(ticker[9]);
            const vol = Number(ticker[7]) * lastPrice;

            if (!isNaN(lastPrice) && lastPrice > 0) {
              this.notify({
                XAUT: {
                  price: lastPrice,
                  change24h: Number(changeRelative.toFixed(2)),
                  high24h: high,
                  low24h: low,
                  volume24h: vol,
                  lastUpdated: Date.now(),
                },
              });
            }
          }
        } catch (e) {
          console.warn('Bitfinex WS message parse error', e);
        }
      };

      ws.onerror = () => {
        // Silent handling for preview/sandbox network restrictions
      };

      ws.onclose = () => {
        this.status.bitfinexConnected = false;
        this.bitfinexChanId = null;
        this.statusListeners.forEach((cb) => cb(this.status));
        if (this.isStarted) {
          this.bitfinexReconnectTimer = setTimeout(() => this.connectBitfinex(), 4000);
        }
      };
    } catch (err) {
      console.error('Failed to establish Bitfinex WS', err);
      if (this.isStarted) {
        this.bitfinexReconnectTimer = setTimeout(() => this.connectBitfinex(), 6000);
      }
    }
  }
}

export const liveWebSocketFeed = new LiveWebSocketFeedManager();
