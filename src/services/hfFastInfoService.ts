export const HF_MARKETAPI2_BASE = 'https://eshan6704-marketapi2.hf.space';

/**
 * Strict global rate limit: Max 1 API call per 10 seconds (10,000 ms)
 */
export const MIN_API_CALL_INTERVAL_MS = 10_000;

let lastApiCallTimestamp = 0;
let activeRequestQueue: Promise<any> = Promise.resolve();
const cooldownListeners = new Set<() => void>();

function notifyCooldownListeners() {
  cooldownListeners.forEach((cb) => cb());
}

export function subscribeMarketApiCooldown(cb: () => void): () => void {
  cooldownListeners.add(cb);
  return () => {
    cooldownListeners.delete(cb);
  };
}

export function getMarketApiCooldownRemainingMs(): number {
  const elapsed = Date.now() - lastApiCallTimestamp;
  if (lastApiCallTimestamp === 0 || elapsed >= MIN_API_CALL_INTERVAL_MS) {
    return 0;
  }
  return MIN_API_CALL_INTERVAL_MS - elapsed;
}

export function getMarketApiCooldownSeconds(): number {
  return Math.ceil(getMarketApiCooldownRemainingMs() / 1000);
}

/**
 * Serialized, strictly rate-limited fetch wrapper for eshan6704/marketapi2.
 * Guarantees at most 1 HTTP call every 10 seconds.
 */
async function rateLimitedFetch(
  url: string,
  init?: RequestInit,
  options?: { rejectIfCoolingDown?: boolean }
): Promise<Response> {
  if (options?.rejectIfCoolingDown) {
    const remaining = getMarketApiCooldownRemainingMs();
    if (remaining > 0) {
      throw new Error(`Rate limit active (1 call / 10s). Try again in ${Math.ceil(remaining / 1000)}s.`);
    }
  }

  const execute = async (): Promise<Response> => {
    const remaining = getMarketApiCooldownRemainingMs();
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    lastApiCallTimestamp = Date.now();
    notifyCooldownListeners();
    return await fetch(url, init);
  };

  const nextTask = activeRequestQueue.then(execute, execute);
  activeRequestQueue = nextTask.catch(() => {});
  return nextTask;
}

export type FastInfoGroupId =
  | 'indian_indices'
  | 'global_indices'
  | 'crypto'
  | 'nifty50_stocks'
  | 'commodities'
  | 'forex_major'
  | 'forex_emerging'
  | 'bonds';

export interface FastInfoGroupMeta {
  icon: string;
  label: string;
  desc: string;
}

export const FASTINFO_GROUP_CONFIG: Record<FastInfoGroupId, FastInfoGroupMeta> = {
  indian_indices: {
    icon: '🇮🇳',
    label: 'Indian Indices',
    desc: 'NSE/BSE sectoral indices',
  },
  global_indices: {
    icon: '🌍',
    label: 'Global Indices',
    desc: 'Major world indices',
  },
  crypto: {
    icon: '🪙',
    label: 'Crypto',
    desc: 'Top cryptocurrencies, by market cap',
  },
  nifty50_stocks: {
    icon: '📈',
    label: 'Nifty 50 Stocks',
    desc: 'Nifty 50 constituents',
  },
  commodities: {
    icon: '🛢️',
    label: 'Commodities',
    desc: 'Metals, energy, agri',
  },
  forex_major: {
    icon: '💱',
    label: 'Forex Major',
    desc: 'Major currency pairs',
  },
  forex_emerging: {
    icon: '💰',
    label: 'Forex Emerging',
    desc: 'Emerging market FX',
  },
  bonds: {
    icon: '📉',
    label: 'Bonds & Yields',
    desc: 'Treasury yields',
  },
};

export const FASTINFO_GROUP_ORDER: FastInfoGroupId[] = [
  'indian_indices',
  'global_indices',
  'crypto',
  'nifty50_stocks',
  'commodities',
  'forex_major',
  'forex_emerging',
  'bonds',
];

export const FASTINFO_SYMBOL_NAMES: Record<string, string> = {
  // Indian Indices (15)
  '^NSEI': 'NIFTY 50',
  '^BSESN': 'BSE SENSEX',
  '^NSEBANK': 'NIFTY BANK',
  '^CNXIT': 'NIFTY IT',
  '^CNXAUTO': 'NIFTY AUTO',
  '^CNXPHARMA': 'NIFTY PHARMA',
  '^CNXMETAL': 'NIFTY METAL',
  '^CNXENERGY': 'NIFTY ENERGY',
  '^CNXFMCG': 'NIFTY FMCG',
  '^CNXREALTY': 'NIFTY REALTY',
  '^CNXINFRA': 'NIFTY INFRA',
  '^CNXMEDIA': 'NIFTY MEDIA',
  '^CNXPSUBANK': 'NIFTY PSU BANK',
  '^CNXFIN': 'NIFTY FIN SERVICE',
  '^NSEMDCP50': 'NIFTY MIDCAP 50',

  // Global Indices (19)
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones 30',
  '^IXIC': 'NASDAQ Composite',
  '^RUT': 'Russell 2000',
  '^FTSE': 'FTSE 100 (UK)',
  '^GDAXI': 'DAX 40 (Germany)',
  '^FCHI': 'CAC 40 (France)',
  '^STOXX50E': 'Euro Stoxx 50',
  '^N225': 'Nikkei 225 (Japan)',
  '^HSI': 'Hang Seng (HK)',
  '^AXJO': 'ASX 200 (Australia)',
  '^KS11': 'KOSPI (South Korea)',
  '^TWII': 'TAIEX (Taiwan)',
  '^GSPTSE': 'S&P/TSX (Canada)',
  '^BVSP': 'Bovespa (Brazil)',
  '^MXX': 'IPC Mexico',
  '^JKSE': 'Jakarta Composite',

  // Nifty 50 Stocks (49)
  'RELIANCE.NS': 'Reliance Industries',
  'TCS.NS': 'Tata Consultancy Services',
  'HDFCBANK.NS': 'HDFC Bank',
  'BHARTIARTL.NS': 'Bharti Airtel',
  'ICICIBANK.NS': 'ICICI Bank',
  'INFY.NS': 'Infosys',
  'SBIN.NS': 'State Bank of India',
  'HINDUNILVR.NS': 'Hindustan Unilever',
  'ITC.NS': 'ITC Limited',
  'LICI.NS': 'LIC India',
  'BAJFINANCE.NS': 'Bajaj Finance',
  'KOTAKBANK.NS': 'Kotak Mahindra Bank',
  'LT.NS': 'Larsen & Toubro',
  'HCLTECH.NS': 'HCL Technologies',
  'SUNPHARMA.NS': 'Sun Pharma',
  'AXISBANK.NS': 'Axis Bank',
  'MARUTI.NS': 'Maruti Suzuki',
  'ULTRACEMCO.NS': 'UltraTech Cement',
  'ONGC.NS': 'ONGC',
  'NTPC.NS': 'NTPC Limited',
  'ADANIENT.NS': 'Adani Enterprises',
  'POWERGRID.NS': 'Power Grid Corp',
  'TITAN.NS': 'Titan Company',
  'ADANIPORTS.NS': 'Adani Ports & SEZ',
  'COALINDIA.NS': 'Coal India',
  'BAJAJFINSV.NS': 'Bajaj Finserv',
  'ASIANPAINT.NS': 'Asian Paints',
  'NESTLEIND.NS': 'Nestlé India',
  'WIPRO.NS': 'Wipro',
  'M&M.NS': 'Mahindra & Mahindra',
  'JSWSTEEL.NS': 'JSW Steel',
  'GRASIM.NS': 'Grasim Industries',
  'TATASTEEL.NS': 'Tata Steel',
  'TECHM.NS': 'Tech Mahindra',
  'BRITANNIA.NS': 'Britannia Industries',
  'CIPLA.NS': 'Cipla',
  'INDUSINDBK.NS': 'IndusInd Bank',
  'DRREDDY.NS': "Dr. Reddy's Labs",
  'APOLLOHOSP.NS': 'Apollo Hospitals',
  'EICHERMOT.NS': 'Eicher Motors',
  'HDFCLIFE.NS': 'HDFC Life Insurance',
  'SBILIFE.NS': 'SBI Life Insurance',
  'HEROMOTOCO.NS': 'Hero MotoCorp',
  'TATACONSUM.NS': 'Tata Consumer Products',
  'BAJAJ-AUTO.NS': 'Bajaj Auto',
  'DIVISLAB.NS': "Divi's Laboratories",
  'HINDALCO.NS': 'Hindalco Industries',
  'UPL.NS': 'UPL Limited',
  'BPCL.NS': 'Bharat Petroleum (BPCL)',

  // Commodities (20)
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'HG=F': 'Copper',
  'PL=F': 'Platinum',
  'PA=F': 'Palladium',
  'CL=F': 'WTI Crude Oil',
  'BZ=F': 'Brent Crude Oil',
  'NG=F': 'Natural Gas',
  'RB=F': 'RBOB Gasoline',
  'HO=F': 'Heating Oil',
  'ZW=F': 'Wheat',
  'ZC=F': 'Corn',
  'ZS=F': 'Soybeans',
  'ZL=F': 'Soybean Oil',
  'ZO=F': 'Oats',
  'ZR=F': 'Rough Rice',
  'CT=F': 'Cotton',
  'CC=F': 'Cocoa',
  'KC=F': 'Coffee',
  'SB=F': 'Sugar #11',

  // Forex Major (20)
  'EURUSD=X': 'EUR / USD (Euro)',
  'GBPUSD=X': 'GBP / USD (British Pound)',
  'USDJPY=X': 'USD / JPY (Japanese Yen)',
  'USDCHF=X': 'USD / CHF (Swiss Franc)',
  'AUDUSD=X': 'AUD / USD (Australian Dollar)',
  'NZDUSD=X': 'NZD / USD (New Zealand Dollar)',
  'USDCAD=X': 'USD / CAD (Canadian Dollar)',
  'EURGBP=X': 'EUR / GBP (Euro / Pound)',
  'EURJPY=X': 'EUR / JPY (Euro / Yen)',
  'GBPJPY=X': 'GBP / JPY (Pound / Yen)',
  'EURCHF=X': 'EUR / CHF (Euro / Franc)',
  'GBPCHF=X': 'GBP / CHF (Pound / Franc)',
  'AUDJPY=X': 'AUD / JPY (Aussie / Yen)',
  'CADJPY=X': 'CAD / JPY (Loonie / Yen)',
  'CHFJPY=X': 'CHF / JPY (Franc / Yen)',
  'EURAUD=X': 'EUR / AUD (Euro / Aussie)',
  'EURCAD=X': 'EUR / CAD (Euro / Loonie)',
  'GBPAUD=X': 'GBP / AUD (Pound / Aussie)',
  'GBPCAD=X': 'GBP / CAD (Pound / Loonie)',
  'AUDNZD=X': 'AUD / NZD (Aussie / Kiwi)',

  // Forex Emerging (20)
  'USDINR=X': 'USD / INR (Indian Rupee)',
  'EURINR=X': 'EUR / INR (Euro / Rupee)',
  'GBPINR=X': 'GBP / INR (Pound / Rupee)',
  'JPYINR=X': 'JPY / INR (Yen / Rupee)',
  'USDCNY=X': 'USD / CNY (Chinese Yuan)',
  'USDKRW=X': 'USD / KRW (Korean Won)',
  'USDBRL=X': 'USD / BRL (Brazilian Real)',
  'USDMXN=X': 'USD / MXN (Mexican Peso)',
  'USDRUB=X': 'USD / RUB (Russian Ruble)',
  'USDZAR=X': 'USD / ZAR (South African Rand)',
  'USDTRY=X': 'USD / TRY (Turkish Lira)',
  'USDSGD=X': 'USD / SGD (Singapore Dollar)',
  'USDHKD=X': 'USD / HKD (Hong Kong Dollar)',
  'USDTWD=X': 'USD / TWD (Taiwan Dollar)',
  'USDTHB=X': 'USD / THB (Thai Baht)',
  'USDMYR=X': 'USD / MYR (Malaysian Ringgit)',
  'USDIDR=X': 'USD / IDR (Indonesian Rupiah)',
  'USDPHP=X': 'USD / PHP (Philippine Peso)',
  'USDPKR=X': 'USD / PKR (Pakistani Rupee)',
  'USDBDT=X': 'USD / BDT (Bangladeshi Taka)',

  // Bonds & Yields (4)
  '^TNX': 'US 10-Year Treasury Yield',
  '^FVX': 'US 5-Year Treasury Yield',
  '^TYX': 'US 30-Year Treasury Yield',
  '^IRX': 'US 13-Week Treasury Bill',

  // Crypto (10)
  'BTC-USD': 'Bitcoin (BTC)',
  'ETH-USD': 'Ethereum (ETH)',
  'XRP-USD': 'XRP (Ripple)',
  'SOL-USD': 'Solana (SOL)',
  'DOGE-USD': 'Dogecoin (DOGE)',
  'ADA-USD': 'Cardano (ADA)',
  'LINK-USD': 'Chainlink (LINK)',
  'AVAX-USD': 'Avalanche (AVAX)',
  'DOT-USD': 'Polkadot (DOT)',
  'PAXG-USD': 'PAX Gold (PAXG)',
};

export function getSymbolDisplayName(sym: string): string {
  if (!sym) return '';
  if (FASTINFO_SYMBOL_NAMES[sym]) return FASTINFO_SYMBOL_NAMES[sym];
  if (/^[A-Z]{6}=X$/i.test(sym)) {
    const clean = sym.replace(/=X$/i, '').toUpperCase();
    return `${clean.slice(0, 3)} / ${clean.slice(3, 6)}`;
  }
  if (sym.endsWith('.NS')) {
    return sym.replace(/\.NS$/i, '');
  }
  if (sym.endsWith('-USD')) {
    return sym.replace(/-USD$/i, '');
  }
  return sym.replace(/^\^/, '');
}

export interface FastInfoSymbolQuote {
  price: number;
  change_pct: number;
  currency: string;
  timestamp: string;
}

export interface FastInfoGroupData {
  data: Record<string, FastInfoSymbolQuote>;
  failed: string[];
  count: number;
  fetched: number;
  refreshed_at?: string;
}

export interface FastInfoSnapshot {
  groups: Partial<Record<FastInfoGroupId, FastInfoGroupData>>;
  updated_at: string;
}

/**
 * CSV Parser matching eshan6704/marketapi2 templates/index.html
 */
export function parseMarketApiCSV(text: string): Record<string, string>[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/);
  if (!lines.length) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = splitLine(lines[0]);
  return lines
    .slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const vals = splitLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] !== undefined ? vals[i] : '';
      });
      return obj;
    });
}

export function coerceNumeric(v: any): any {
  if (v === '' || v === null || v === undefined) return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

export function displaySymbol(sym: string): string {
  return (sym || '').replace(/\.NS$/i, '');
}

/**
 * Rebuild nested { [group]: { data, failed, count, fetched } } from CSV rows
 * returned by /fastinfo/snapshot or /fastinfo/refresh/<group>
 */
export function rowsToSnapshotGroups(
  rows: Record<string, string>[]
): Partial<Record<FastInfoGroupId, FastInfoGroupData>> {
  const snap: Partial<Record<FastInfoGroupId, FastInfoGroupData>> = {};

  for (const row of rows) {
    const group = row.group as FastInfoGroupId;
    if (!group) continue;
    if (!snap[group]) {
      snap[group] = { data: {}, failed: [], count: 0, fetched: 0 };
    }
    const g = snap[group]!;
    const sym = row.symbol;
    if (!sym) continue;

    const priceNum = coerceNumeric(row.price);
    const changeNum = coerceNumeric(row.change_pct);

    g.data[sym] = {
      price: typeof priceNum === 'number' ? priceNum : 0,
      change_pct: typeof changeNum === 'number' ? changeNum : 0,
      currency: row.currency || 'USD',
      timestamp: row.timestamp || '',
    };
    g.count++;
    if (row.status === 'failed') {
      g.failed.push(sym);
    } else {
      g.fetched++;
    }
  }

  return snap;
}

// Module-level snapshot cache so switching tabs doesn't re-fetch unnecessarily
let cachedSnapshot: FastInfoSnapshot | null = null;

export function getCachedFastInfoSnapshot(): FastInfoSnapshot | null {
  return cachedSnapshot;
}

export async function fetchFastInfoSnapshot(options?: {
  rejectIfCoolingDown?: boolean;
}): Promise<FastInfoSnapshot> {
  const res = await rateLimitedFetch(
    `${HF_MARKETAPI2_BASE}/fastinfo/snapshot`,
    undefined,
    options
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parseMarketApiCSV(text);
  const groups = rowsToSnapshotGroups(rows);

  let latestIso = new Date().toISOString();
  for (const row of rows) {
    if (row.timestamp) {
      latestIso = row.timestamp;
      break;
    }
  }

  const snapshot: FastInfoSnapshot = {
    groups,
    updated_at: latestIso,
  };
  cachedSnapshot = snapshot;
  return snapshot;
}

export async function refreshFastInfoGroup(
  group: FastInfoGroupId,
  options?: { rejectIfCoolingDown?: boolean }
): Promise<FastInfoGroupData> {
  const res = await rateLimitedFetch(
    `${HF_MARKETAPI2_BASE}/fastinfo/refresh/${encodeURIComponent(group)}`,
    { method: 'POST' },
    options
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parseMarketApiCSV(text);
  const rebuilt = rowsToSnapshotGroups(rows)[group] || {
    data: {},
    failed: [],
    count: 0,
    fetched: 0,
  };
  const groupData: FastInfoGroupData = {
    ...rebuilt,
    refreshed_at: new Date().toISOString(),
  };

  if (cachedSnapshot) {
    cachedSnapshot = {
      ...cachedSnapshot,
      groups: {
        ...cachedSnapshot.groups,
        [group]: groupData,
      },
    };
  }

  return groupData;
}

/**
 * Refresh all groups while strictly respecting the 1 call / 10s rate limit:
 * 1. Triggers POST /fastinfo/refresh-all (1 call)
 * 2. Automatically waits the required 10s interval inside rateLimitedFetch before reading GET /fastinfo/snapshot
 */
export async function refreshAllFastInfoGroups(options?: {
  rejectIfCoolingDown?: boolean;
}): Promise<FastInfoSnapshot> {
  const res = await rateLimitedFetch(
    `${HF_MARKETAPI2_BASE}/fastinfo/refresh-all`,
    { method: 'POST' },
    options
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  // rateLimitedFetch will automatically wait 10s before firing the snapshot read
  return await fetchFastInfoSnapshot();
}

export interface FastInfoHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchFastInfoSymbolHistory(symbol: string): Promise<FastInfoHistoryPoint[]> {
  const res = await rateLimitedFetch(
    `${HF_MARKETAPI2_BASE}/api/yf_history/${encodeURIComponent(symbol)}?period=1mo&interval=1d`
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parseMarketApiCSV(text);
  return rows
    .map((r) => {
      const close = coerceNumeric(r.close);
      const open = coerceNumeric(r.open);
      const high = coerceNumeric(r.high);
      const low = coerceNumeric(r.low);
      const volume = coerceNumeric(r.volume);
      return {
        date: r.date || r.datetime || '',
        open: typeof open === 'number' ? open : typeof close === 'number' ? close : 0,
        high: typeof high === 'number' ? high : typeof close === 'number' ? close : 0,
        low: typeof low === 'number' ? low : typeof close === 'number' ? close : 0,
        close: typeof close === 'number' ? close : NaN,
        volume: typeof volume === 'number' ? volume : 0,
      };
    })
    .filter((p) => !Number.isNaN(p.close));
}
