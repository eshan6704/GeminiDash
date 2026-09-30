import { MarketAsset, Candle } from '../types/trading';
import { getHydratedPrice, updateRememberedPrice } from './priceMemoryStore';

export const INITIAL_ASSETS: Record<string, MarketAsset> = {
  BTC: {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'crypto',
    price: 86520.00,
    change24h: 1.15,
    high24h: 87800.00,
    low24h: 85200.00,
    volume24h: 42000000000,
    marketCap: 1730000000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'The pioneering decentralized digital cryptocurrency and store of value.',
  },
  XAUT: {
    id: 'tether-gold',
    symbol: 'XAUT',
    name: 'Tether Gold',
    category: 'gold',
    price: 4335.50,
    change24h: 0.31,
    high24h: 4368.00,
    low24h: 4298.00,
    volume24h: 195000000,
    marketCap: 1920000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Tether Gold (XAUt) token backed 1:1 by one fine troy ounce of physical London Good Delivery gold.',
    goldOunceFactor: 1,
  },
  PAXG: {
    id: 'pax-gold',
    symbol: 'PAXG',
    name: 'PAX Gold',
    category: 'gold',
    price: 4332.20,
    change24h: 0.28,
    high24h: 4365.00,
    low24h: 4295.00,
    volume24h: 173000000,
    marketCap: 1880000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Regulated digital gold token backed 1:1 by London Good Delivery gold bars held by Paxos Trust.',
    goldOunceFactor: 1,
  },
  ZEC: {
    id: 'zcash',
    symbol: 'ZEC',
    name: 'Zcash',
    category: 'crypto',
    price: 45.50,
    change24h: -0.5,
    high24h: 47.0,
    low24h: 44.0,
    volume24h: 50000000,
    marketCap: 700000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Privacy-focused cryptocurrency based on zk-SNARKs technology.',
  },
  SOL: {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    category: 'crypto',
    price: 119.10,
    change24h: 1.95,
    high24h: 124.50,
    low24h: 115.80,
    volume24h: 4140000000,
    marketCap: 69900000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'High-throughput, ultra-low fee proof-of-stake layer 1 blockchain.',
  },
  CL: {
    id: 'crude-oil-wti',
    symbol: 'CL',
    name: 'Crude Oil (WTI)',
    category: 'crypto',
    price: 71.45,
    change24h: 0.85,
    high24h: 72.30,
    low24h: 70.60,
    volume24h: 1850000000,
    marketCap: 145000000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'West Texas Intermediate (WTI) Crude Oil benchmark futures & spot market feed ($/bbl).',
  },
  XAG: {
    id: 'silver-xag',
    symbol: 'XAG',
    name: 'Silver (XAG)',
    category: 'gold',
    price: 31.42,
    change24h: 1.15,
    high24h: 31.85,
    low24h: 31.05,
    volume24h: 920000000,
    marketCap: 18200000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Spot Silver (XAG/USD) precious metal benchmark per troy ounce.',
  },
  ETH: {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'crypto',
    price: 2758.50,
    change24h: 0.85,
    high24h: 2810.00,
    low24h: 2715.00,
    volume24h: 16100000000,
    marketCap: 336000000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Leading smart-contract platform for decentralized finance and web3 applications.',
  },
  XRP: {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    category: 'crypto',
    price: 1.63,
    change24h: 6.85,
    high24h: 1.72,
    low24h: 1.51,
    volume24h: 6700000000,
    marketCap: 102000000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Real-time gross settlement system and currency exchange network token.',
  },
  DOGE: {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'crypto',
    price: 0.215,
    change24h: -1.2,
    high24h: 0.228,
    low24h: 0.208,
    volume24h: 1900000000,
    marketCap: 31000000000,
    lastUpdated: Date.now(),
    dataTimestamp: Date.now(),
    description: 'Popular decentralized peer-to-peer digital currency.',
  },
};

const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  PAXG: 'PAXGUSDT',
  XRP: 'XRPUSDT',
  DOGE: 'DOGEUSDT',
  ZEC: 'ZECUSDT',
};

let lastMarketFetchTs = 0;
let cachedMarketAssets: Record<string, MarketAsset> | null = null;
const candleCache = new Map<string, { candles: Candle[]; timestamp: number }>();

// Fetch live market data for supported assets while preserving current live prices
export async function fetchLiveMarketData(
  existingAssets?: Record<string, MarketAsset>,
  targetSymbols?: string[]
): Promise<Record<string, MarketAsset>> {
  if (typeof document !== 'undefined' && document.hidden && cachedMarketAssets) {
    return cachedMarketAssets;
  }

  // Reuse cached market data if fetched within last 15 seconds
  if (cachedMarketAssets && Date.now() - lastMarketFetchTs < 15000 && !targetSymbols) {
    return cachedMarketAssets;
  }

  const updatedAssets: Record<string, MarketAsset> = {};

  Object.keys(INITIAL_ASSETS).forEach((symbol) => {
    const existing = existingAssets?.[symbol];
    const initial = INITIAL_ASSETS[symbol];
    const baseAsset = existing ? { ...existing } : { ...initial };
    updatedAssets[symbol] = getHydratedPrice(baseAsset);
  });

  try {
    // Only request target symbols if specified, otherwise core mapped symbols
    const symbols =
      Array.isArray(targetSymbols) && targetSymbols.length > 0
        ? Array.from(
            new Set(
              targetSymbols
                .map((s) => {
                  const u = s.toUpperCase();
                  if (u === 'XAUT') return 'PAXGUSDT';
                  return BINANCE_SYMBOL_MAP[u];
                })
                .filter(Boolean)
            )
          )
        : Object.values(BINANCE_SYMBOL_MAP);

    if (symbols.length === 0) {
      return updatedAssets;
    }

    const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
    let binanceSucceeded = false;
    try {
      const binanceRes = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (binanceRes.ok) {
        const binanceList = await binanceRes.json();
        if (Array.isArray(binanceList) && binanceList.length > 0) {
          binanceSucceeded = true;
          binanceList.forEach((item) => {
            const sym = Object.keys(BINANCE_SYMBOL_MAP).find(
              (key) => BINANCE_SYMBOL_MAP[key] === item.symbol
            );
            if (sym && updatedAssets[sym]) {
              const price = parseFloat(item.lastPrice);
              const change = parseFloat(item.priceChangePercent);
              const high = parseFloat(item.highPrice);
              const low = parseFloat(item.lowPrice);
              const volume = parseFloat(item.quoteVolume);
              const sourceTime = item.closeTime || item.eventTime || Date.now();

              if (!isNaN(price) && price > 0) {
                updatedAssets[sym] = {
                  ...updatedAssets[sym],
                  price,
                  change24h: isNaN(change) ? updatedAssets[sym].change24h : change,
                  high24h: isNaN(high) ? updatedAssets[sym].high24h : high,
                  low24h: isNaN(low) ? updatedAssets[sym].low24h : low,
                  volume24h: isNaN(volume) ? updatedAssets[sym].volume24h : volume,
                  lastUpdated: sourceTime,
                  dataTimestamp: sourceTime,
                };
                updateRememberedPrice(sym, price, sourceTime, { change24h: change, high24h: high, low24h: low });

                // Sync XAUT closely to PAXG live spot gold
                if (sym === 'PAXG' && updatedAssets.XAUT) {
                  const xautPrice = Number((price * 1.0005).toFixed(2));
                  updatedAssets.XAUT = {
                    ...updatedAssets.XAUT,
                    price: xautPrice,
                    change24h: isNaN(change) ? updatedAssets.XAUT.change24h : change,
                    high24h: isNaN(high) ? updatedAssets.XAUT.high24h : Number((high * 1.0005).toFixed(2)),
                    low24h: isNaN(low) ? updatedAssets.XAUT.low24h : Number((low * 1.0005).toFixed(2)),
                    lastUpdated: sourceTime,
                    dataTimestamp: sourceTime,
                  };
                  updateRememberedPrice('XAUT', xautPrice, sourceTime, { change24h: change, high24h: high, low24h: low });
                }
              }
            }
          });
        }
      }
    } catch {
      // Fallback handled gracefully
    }

    // Only call CoinGecko fallback if Binance request actually failed
    if (!binanceSucceeded) {
      try {
        const geckoIds = 'tether-gold,pax-gold,bitcoin,solana,zcash';
        const geckoRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (geckoRes.ok) {
          const geckoData = await geckoRes.json();
          Object.keys(updatedAssets).forEach((key) => {
            const asset = updatedAssets[key];
            const g = geckoData[asset.id];
            if (g && g.usd) {
              const nowMs = Date.now();
              updatedAssets[key] = {
                ...asset,
                price: g.usd,
                change24h: g.usd_24h_change ? Number(g.usd_24h_change.toFixed(2)) : asset.change24h,
                volume24h: g.usd_24h_vol || asset.volume24h,
                lastUpdated: nowMs,
                dataTimestamp: nowMs,
              };
            }
          });
        }
      } catch {
        // Fallback handled gracefully
      }
    }
  } catch {
    // Fallback handled gracefully
  }

  lastMarketFetchTs = Date.now();
  cachedMarketAssets = updatedAssets;
  return updatedAssets;
}

// Fetch historical candles for charting from Binance (with 25s cache per symbol+interval)
export type ChartInterval = '1s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';

export async function fetchCandles(symbol: string, interval: ChartInterval): Promise<Candle[]> {
  const upper = (symbol || 'BTC').toUpperCase();
  const cacheKey = `${upper}:${interval}`;
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 25000) {
    return cached.candles;
  }

  // Non-Binance spot commodities (CL Crude Oil, XAG Silver) use price-anchored candles
  if (upper !== 'CL' && upper !== 'XAG') {
    try {
      const binanceSymbol =
        BINANCE_SYMBOL_MAP[upper] ||
        (upper === 'XAUT' ? 'PAXGUSDT' : `${upper}USDT`);
      const bRes = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=100`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (bRes.ok) {
        const data = await bRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const candles = data.map((item: any[]) => ({
            time: item[0],
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
          candleCache.set(cacheKey, { candles, timestamp: Date.now() });
          return candles;
        }
      }
    } catch {
      // Fallback candles generated gracefully
    }
  }

  // Graceful fallback: generate procedural continuous candles anchored to current price
  const fallback = generateFallbackCandles(upper, interval);
  candleCache.set(cacheKey, { candles: fallback, timestamp: Date.now() });
  return fallback;
}

function generateFallbackCandles(symbol: string, interval: string): Candle[] {
  const asset = INITIAL_ASSETS[symbol] || INITIAL_ASSETS.BTC;
  const basePrice = asset.price;
  const count = 60;
  const candles: Candle[] = [];
  const stepMs = interval === '1m' ? 60000 : interval === '5m' ? 300000 : interval === '15m' ? 900000 : interval === '1h' ? 3600000 : 86400000;
  const now = Date.now();
  let current = basePrice * 0.985;
  const volVolatility = asset.category === 'gold' ? 0.002 : 0.008;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const delta = (Math.random() - 0.49) * basePrice * volVolatility;
    const open = current;
    const close = Math.max(0.0001, open + delta);
    const high = Math.max(open, close) + Math.random() * basePrice * volVolatility * 0.6;
    const low = Math.min(open, close) - Math.random() * basePrice * volVolatility * 0.6;
    const volume = Math.floor(Math.random() * 500 + 50);
    candles.push({ time, open, high, low, close, volume });
    current = close;
  }
  return candles;
}
