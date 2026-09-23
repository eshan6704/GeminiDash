import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory quote cache (30 seconds to reduce external API load)
const quoteCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30000;

// Helper to fetch live quote with multiple fallback providers
async function fetchYahooQuote(rawSymbol: string) {
  const cached = quoteCache.get(rawSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
  ];

  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

  // Strategy 0: Direct HuggingFace NSE Market API (https://eshan6704-marketapi2.hf.space/)
  if (rawSymbol.endsWith('.NS') || rawSymbol.startsWith('^NSE') || rawSymbol === '^BSESN') {
    try {
      const cleanSym = rawSymbol.replace('.NS', '').replace('^', '');
      const hfUrls = [
        `https://eshan6704-marketapi2.hf.space/quote?symbol=${encodeURIComponent(cleanSym)}`,
        `https://eshan6704-marketapi2.hf.space/api/quote?symbol=${encodeURIComponent(cleanSym)}`,
        `https://eshan6704-marketapi2.hf.space/stock/${encodeURIComponent(cleanSym)}`,
        `https://eshan6704-marketapi2.hf.space/stock?symbol=${encodeURIComponent(cleanSym)}`,
      ];

      for (const url of hfUrls) {
        const hfRes = await fetch(url, { headers: { 'User-Agent': randomUA }, signal: AbortSignal.timeout(3000) });
        if (hfRes.ok) {
          const json = await hfRes.json();
          const p = json?.lastPrice || json?.price || json?.last_price || json?.data?.lastPrice || json?.quote?.lastPrice;
          if (p && typeof p === 'number' && p > 0) {
            const chg = json?.change || json?.pChange || json?.price_change || 0;
            const chgPct = json?.pChange || json?.change_percent || json?.changePct || 0;
            const h = json?.dayHigh || json?.high || p;
            const l = json?.dayLow || json?.low || p;

            const data = {
              symbol: rawSymbol,
              currency: 'INR',
              exchangeName: 'NSE Direct (HF Space)',
              instrumentType: 'EQUITY',
              price: Number(p.toFixed(2)),
              previousClose: Number((p - chg).toFixed(2)),
              change: Number(chg.toFixed(2)),
              changePct: Number(chgPct.toFixed(2)),
              high: Number(h.toFixed(2)),
              low: Number(l.toFixed(2)),
              volume: json?.totalTradedVolume || json?.volume || 0,
              source: 'HF NSE Market API',
              updatedAt: new Date().toISOString(),
            };

            quoteCache.set(rawSymbol, { data, timestamp: Date.now() });
            return data;
          }
        }
      }
    } catch (err: any) {
      // Continue to Yahoo / Google fallbacks if HF Space timeout/error
    }
  }
  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(rawSymbol)}?interval=1m&range=1d`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': randomUA,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const result = json?.chart?.result?.[0];
        if (result) {
          const meta = result.meta;
          const quote = result.indicators?.quote?.[0];

          const regularMarketPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
          const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? regularMarketPrice;
          const change = regularMarketPrice - previousClose;
          const changePct = previousClose !== 0 ? (change / previousClose) * 100 : 0;

          const data = {
            symbol: rawSymbol,
            currency: meta.currency || 'USD',
            exchangeName: meta.exchangeName || '',
            instrumentType: meta.instrumentType || '',
            price: Number(regularMarketPrice.toFixed(2)),
            previousClose: Number(previousClose.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePct: Number(changePct.toFixed(2)),
            high: Number((meta.regularMarketDayHigh || regularMarketPrice).toFixed(2)),
            low: Number((meta.regularMarketDayLow || regularMarketPrice).toFixed(2)),
            volume: meta.regularMarketVolume || (quote?.volume ? quote.volume[quote.volume.length - 1] : 0),
            source: 'Yahoo Finance Live',
            updatedAt: new Date().toISOString(),
          };

          quoteCache.set(rawSymbol, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch (err: any) {
      // Continue to next fallback
    }
  }

  // Strategy 2: Google Finance Scraper fallback (especially for Indian NSE stocks & indices)
  try {
    let gfSymbol = rawSymbol;
    if (rawSymbol === '^NSEI') gfSymbol = 'NIFTY_50:INDEXNSE';
    else if (rawSymbol === '^NSEBANK') gfSymbol = 'NIFTY_BANK:INDEXNSE';
    else if (rawSymbol === '^BSESN') gfSymbol = 'SENSEX:INDEXBOM';
    else if (rawSymbol === '^CNXIT') gfSymbol = 'NIFTY_IT:INDEXNSE';
    else if (rawSymbol.endsWith('.NS')) gfSymbol = `${rawSymbol.replace('.NS', '')}:NSE`;

    const gfUrl = `https://www.google.com/finance/quote/${encodeURIComponent(gfSymbol)}`;
    const gfRes = await fetch(gfUrl, {
      headers: { 'User-Agent': randomUA },
    });

    if (gfRes.ok) {
      const html = await gfRes.text();
      // Scrape data-last-price or class "YMlA8" / "fx414"
      const priceMatch = html.match(/data-last-price="([0-9.,]+)"/);
      const priceVal = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

      if (priceVal && !isNaN(priceVal)) {
        // Scrape price change if available
        const changeMatch = html.match(/data-price-change="([0-9.\-+]+)"/);
        const changeVal = changeMatch ? parseFloat(changeMatch[1]) : 0;

        const data = {
          symbol: rawSymbol,
          currency: rawSymbol.endsWith('.NS') || rawSymbol.startsWith('^NSE') ? 'INR' : 'USD',
          exchangeName: 'NSE/BSE/Google',
          instrumentType: 'EQUITY',
          price: Number(priceVal.toFixed(2)),
          previousClose: Number((priceVal - changeVal).toFixed(2)),
          change: Number(changeVal.toFixed(2)),
          changePct: Number((((changeVal) / (priceVal - changeVal || 1)) * 100).toFixed(2)),
          high: Number(priceVal.toFixed(2)),
          low: Number(priceVal.toFixed(2)),
          volume: 0,
          source: 'Google Finance Realtime',
          updatedAt: new Date().toISOString(),
        };

        quoteCache.set(rawSymbol, { data, timestamp: Date.now() });
        return data;
      }
    }
  } catch (err: any) {
    console.warn(`[GoogleFinance Scraper Error] ${rawSymbol}:`, err.message);
  }

  return null;
}

// Batch quote fetching endpoint
app.post('/api/quotes/batch', async (req, res) => {
  const { symbols } = req.body as { symbols: string[] };

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'symbols array is required' });
  }

  // Limit max batch to 30 symbols per call for fast response
  const targetSymbols = symbols.slice(0, 35);
  
  const results = await Promise.all(
    targetSymbols.map(async (sym) => {
      const data = await fetchYahooQuote(sym);
      return { symbol: sym, quote: data };
    })
  );

  const quotesMap: Record<string, any> = {};
  results.forEach(({ symbol, quote }) => {
    if (quote) {
      quotesMap[symbol] = quote;
    }
  });

  return res.json({ success: true, quotes: quotesMap, timestamp: new Date().toISOString() });
});

// Single quote fetching endpoint
app.get('/api/quote', async (req, res) => {
  const symbol = req.query.symbol as string;
  if (!symbol) {
    return res.status(400).json({ error: 'symbol query param is required' });
  }

  const quote = await fetchYahooQuote(symbol);
  if (!quote) {
    return res.status(404).json({ error: `Failed to fetch live quote for ${symbol}` });
  }

  return res.json({ success: true, quote });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Full-Stack Market Terminal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
