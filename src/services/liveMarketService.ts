export interface LiveQuote {
  symbol: string;
  currency: string;
  exchangeName: string;
  instrumentType: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  source?: string;
  updatedAt: string;
}

export interface BatchQuotesResponse {
  success: boolean;
  quotes: Record<string, LiveQuote>;
  timestamp: string;
}

// Client-side per-symbol quote cache (25s TTL) to eliminate duplicate requests across tabs
const clientQuoteCache = new Map<string, { quote: LiveQuote; timestamp: number }>();
const CLIENT_QUOTE_TTL_MS = 25000;

// Fetch single live quote from backend proxy (with client-side cache & visibility guard)
export async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  if (!symbol) return null;
  const cached = clientQuoteCache.get(symbol) || clientQuoteCache.get(symbol.toUpperCase());
  if (
    cached &&
    (Date.now() - cached.timestamp < CLIENT_QUOTE_TTL_MS ||
      (typeof document !== 'undefined' && document.hidden))
  ) {
    return cached.quote;
  }

  if (typeof document !== 'undefined' && document.hidden) {
    return null;
  }

  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return cached?.quote || null;
    const json = await res.json();
    if (json.quote) {
      const now = Date.now();
      clientQuoteCache.set(symbol, { quote: json.quote, timestamp: now });
      clientQuoteCache.set(symbol.toUpperCase(), { quote: json.quote, timestamp: now });
      return json.quote;
    }
    return cached?.quote || null;
  } catch {
    return cached?.quote || null;
  }
}

// Fetch batch live quotes from backend proxy (only requests uncached symbols for active tab)
export async function fetchBatchLiveQuotes(symbols: string[]): Promise<Record<string, LiveQuote>> {
  if (!symbols || symbols.length === 0) return {};

  const now = Date.now();
  const isTabHidden = typeof document !== 'undefined' && document.hidden;
  const result: Record<string, LiveQuote> = {};
  const missingSymbols: string[] = [];

  for (const sym of symbols) {
    if (!sym) continue;
    const cached = clientQuoteCache.get(sym) || clientQuoteCache.get(sym.toUpperCase());
    if (cached && (now - cached.timestamp < CLIENT_QUOTE_TTL_MS || isTabHidden)) {
      result[sym] = cached.quote;
    } else if (!isTabHidden) {
      missingSymbols.push(sym);
    }
  }

  if (missingSymbols.length === 0) {
    return result;
  }

  try {
    const res = await fetch('/api/quotes/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: missingSymbols }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return result;
    const json: BatchQuotesResponse = await res.json();
    const fetchedQuotes = json.quotes || {};
    const fetchTs = Date.now();

    Object.entries(fetchedQuotes).forEach(([key, quote]) => {
      if (quote) {
        result[key] = quote;
        clientQuoteCache.set(key, { quote, timestamp: fetchTs });
        clientQuoteCache.set(key.toUpperCase(), { quote, timestamp: fetchTs });
      }
    });

    return result;
  } catch {
    return result;
  }
}
