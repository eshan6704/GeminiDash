export const MASTER_COMMODITIES = [
  { id: 'oil', name: 'Crude Oil WTI', symbol: 'CL', price: 71.45, change1d: 0.85, category: 'Energy' },
  { id: 'gold', name: 'Gold Spot', symbol: 'GC', price: 2645.20, change1d: 0.12, category: 'Precious Metals' },
  { id: 'silver', name: 'Silver Spot', symbol: 'SI', price: 31.15, change1d: -0.45, category: 'Precious Metals' },
  { id: 'natgas', name: 'Natural Gas', symbol: 'NG', price: 2.34, change1d: -1.20, category: 'Energy' },
  { id: 'copper', name: 'Copper', symbol: 'HG', price: 4.12, change1d: 0.55, category: 'Industrial Metals' },
];

export const MASTER_INDIAN_INDICES: MarketTableRow[] = [
  { id: 'nifty50', name: 'NIFTY 50', symbol: 'NIFTY 50', price: 24320.50, change1d: 0.45, change1dPts: 108.20, category: 'Benchmark', status: 'Active' },
  { id: 'banknifty', name: 'NIFTY BANK', symbol: 'BANKNIFTY', price: 51240.30, change1d: -0.15, change1dPts: -76.40, category: 'Benchmark', status: 'Active' },
];

export const MASTER_GLOBAL_INDICES: MarketTableRow[] = [
  { id: 'sp500', name: 'S&P 500', symbol: 'SPX', price: 5980.50, change1d: 0.35, category: 'US', sector: 'Equity', high24h: 6000, low24h: 5950, status: 'Open', currency: 'USD' },
  { id: 'nasdaq', name: 'NASDAQ 100', symbol: 'NDX', price: 21150.20, change1d: 0.55, category: 'US', sector: 'Tech', high24h: 21200, low24h: 21000, status: 'Open', currency: 'USD' },
];

export interface MarketTableRow {
  rank?: number;
  id: string;
  name: string;
  symbol: string;
  price: number;
  change1d: number;
  change1dPts?: number;
  category?: string;
  exchange?: string;
  sector?: string;
  tier?: string;
  currency?: string;
  marketCap?: number | string;
  high24h?: number;
  low24h?: number;
  peRatio?: number;
  volume24h?: number;
  status?: string;
  dataTimestamp?: number;
  updatedAtMs?: number;
  updatedAt?: string;
}

export const MASTER_FUTURES: MarketTableRow[] = [];
export const MASTER_NIFTY_500: MarketTableRow[] = [];
export const MASTER_CRYPTO_250: MarketTableRow[] = [];
export const MASTER_FOREX: MarketTableRow[] = [
  { id: 'eurusd', name: 'EUR / USD', symbol: 'EURUSD', price: 1.0542, change1d: -0.12, category: 'Major', high24h: 1.0600, low24h: 1.0500 },
  { id: 'usdjpy', name: 'USD / JPY', symbol: 'USDJPY', price: 154.20, change1d: 0.45, category: 'Major', high24h: 155.00, low24h: 153.50 },
];

export function subscribeMarketTable(tableName: string, callback: (data: { data: MarketTableRow[], dataTimestamp?: number, updatedAtMs?: number, updatedAt?: string }) => void) {
  // Return a no-op unsubscribe function
  return () => {};
}

export async function fetchMarketTable(tableName: string): Promise<{ data: MarketTableRow[], dataTimestamp?: number, updatedAtMs?: number, updatedAt?: string }> {
  return { data: [] as MarketTableRow[] };
}
