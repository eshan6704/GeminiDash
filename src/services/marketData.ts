import { MarketAsset, Candle } from '../types/trading';

export const INITIAL_ASSETS: Record<string, MarketAsset> = {
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
    description: 'Regulated digital gold token backed 1:1 by London Good Delivery gold bars held by Paxos Trust.',
    goldOunceFactor: 1,
  },
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
    description: 'The pioneering decentralized digital cryptocurrency and store of value.',
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
    description: 'Leading smart-contract platform for decentralized finance and web3 applications.',
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
    description: 'High-throughput, ultra-low fee proof-of-stake layer 1 blockchain.',
  },
  BNB: {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    category: 'crypto',
    price: 792.00,
    change24h: 0.55,
    high24h: 805.00,
    low24h: 780.00,
    volume24h: 1200000000,
    marketCap: 105000000000,
    lastUpdated: Date.now(),
    description: 'Utility and governance token powering the BNB Chain ecosystem.',
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
    description: 'Popular decentralized peer-to-peer digital currency.',
  },
};

const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  PAXG: 'PAXGUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  DOGE: 'DOGEUSDT',
};

// Fetch live market data for all supported assets
export async function fetchLiveMarketData(): Promise<Record<string, MarketAsset>> {
  const updatedAssets = { ...INITIAL_ASSETS };

  try {
    // Fetch Binance 24hr tickers for crypto & PAXG
    const symbols = Object.values(BINANCE_SYMBOL_MAP);
    const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
    try {
      const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`);
      if (binanceRes.ok) {
        const binanceList = await binanceRes.json();
        if (Array.isArray(binanceList)) {
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

              updatedAssets[sym] = {
                ...updatedAssets[sym],
                price: isNaN(price) ? updatedAssets[sym].price : price,
                change24h: isNaN(change) ? updatedAssets[sym].change24h : change,
                high24h: isNaN(high) ? updatedAssets[sym].high24h : high,
                low24h: isNaN(low) ? updatedAssets[sym].low24h : low,
                volume24h: isNaN(volume) ? updatedAssets[sym].volume24h : volume,
                lastUpdated: Date.now(),
              };
            }
          });
        }
      }
    } catch (e) {
      // Fallback handled gracefully
    }

    // 3. Fallback check for any missing/stale coin data using CoinGecko simple price
    const now = Date.now();
    const needsGecko = Object.values(updatedAssets).some((a) => now - a.lastUpdated > 15000);
    if (needsGecko) {
      try {
        const geckoIds = 'tether-gold,pax-gold,bitcoin,ethereum,solana,binancecoin,ripple,dogecoin';
        const geckoRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );
        if (geckoRes.ok) {
          const geckoData = await geckoRes.json();
          Object.keys(updatedAssets).forEach((key) => {
            const asset = updatedAssets[key];
            const g = geckoData[asset.id];
            if (g && g.usd) {
              updatedAssets[key] = {
                ...asset,
                price: g.usd,
                change24h: g.usd_24h_change ? Number(g.usd_24h_change.toFixed(2)) : asset.change24h,
                volume24h: g.usd_24h_vol || asset.volume24h,
                lastUpdated: Date.now(),
              };
            }
          });
        }
      } catch (err) {
        // Fallback handled gracefully
      }
    }
  } catch (err) {
    // Fallback handled gracefully
  }

  return updatedAssets;
}

// Fetch historical candles for charting from Binance / Bitfinex API
export type ChartInterval = '1s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';

export async function fetchCandles(symbol: string, interval: ChartInterval): Promise<Candle[]> {
  try {
    const binanceSymbol = BINANCE_SYMBOL_MAP[symbol] || 'BTCUSDT';
    const bRes = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=100`
    );
    if (bRes.ok) {
      const data = await bRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any[]) => ({
          time: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }));
      }
    }
  } catch (e) {
    // Fallback candles generated gracefully
  }

  // Graceful fallback: generate procedural continuous candles anchored to current price
  return generateFallbackCandles(symbol, interval);
}

function generateFallbackCandles(symbol: string, interval: string): Candle[] {
  const asset = INITIAL_ASSETS[symbol] || INITIAL_ASSETS.PAXG;
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
    const close = Math.max(1, open + delta);
    const high = Math.max(open, close) + Math.random() * basePrice * volVolatility * 0.6;
    const low = Math.min(open, close) - Math.random() * basePrice * volVolatility * 0.6;
    const volume = Math.floor(Math.random() * 500 + 50);
    candles.push({ time, open, high, low, close, volume });
    current = close;
  }
  return candles;
}
