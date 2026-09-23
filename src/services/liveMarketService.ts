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

// Fetch single live quote from backend proxy
export async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.quote || null;
  } catch (err) {
    console.warn(`[LiveMarketService] Error fetching ${symbol}:`, err);
    return null;
  }
}

// Fetch batch live quotes from backend proxy
export async function fetchBatchLiveQuotes(symbols: string[]): Promise<Record<string, LiveQuote>> {
  if (!symbols || symbols.length === 0) return {};

  try {
    const res = await fetch('/api/quotes/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });

    if (!res.ok) return {};
    const json: BatchQuotesResponse = await res.json();
    return json.quotes || {};
  } catch (err) {
    console.warn('[LiveMarketService] Error fetching batch quotes:', err);
    return {};
  }
}
