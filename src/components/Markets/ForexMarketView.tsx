import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Zap,
  RefreshCw,
  Search,
  Calculator,
  ShieldAlert,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';

export interface ForexPair {
  id: string;
  pair: string;
  yahooSymbol: string;
  category: 'Major' | 'Minor Cross' | 'Emerging';
  bid: number;
  ask: number;
  spreadPips: number;
  change1d: number;
  high24h: number;
  low24h: number;
  isRealLive?: boolean;
}

export const ForexMarketView: React.FC = () => {
  const { isLight } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lotSizeInput, setLotSizeInput] = useState<number>(1.0); // 1 Standard Lot = 100,000 units
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [pairs, setPairs] = useState<ForexPair[]>([
    { id: 'usdinr', pair: 'USD/INR', yahooSymbol: 'USDINR=X', category: 'Emerging', bid: 84.08, ask: 84.10, spreadPips: 2.0, change1d: 0.05, high24h: 84.15, low24h: 83.95 },
    { id: 'eurinr', pair: 'EUR/INR', yahooSymbol: 'EURINR=X', category: 'Emerging', bid: 91.18, ask: 91.22, spreadPips: 3.5, change1d: 0.30, high24h: 91.40, low24h: 90.85 },
    { id: 'gbpinr', pair: 'GBP/INR', yahooSymbol: 'GBPINR=X', category: 'Emerging', bid: 109.15, ask: 109.20, spreadPips: 4.2, change1d: 0.50, high24h: 109.50, low24h: 108.70 },
    { id: 'jpyinr', pair: 'JPY/INR', yahooSymbol: 'JPYINR=X', category: 'Emerging', bid: 0.552, ask: 0.554, spreadPips: 1.5, change1d: 0.10, high24h: 0.558, low24h: 0.548 },

    { id: 'eurusd', pair: 'EUR/USD', yahooSymbol: 'EURUSD=X', category: 'Major', bid: 1.0845, ask: 1.0846, spreadPips: 0.8, change1d: 0.24, high24h: 1.0870, low24h: 1.0820 },
    { id: 'gbpusd', pair: 'GBP/USD', yahooSymbol: 'GBPUSD=X', category: 'Major', bid: 1.2982, ask: 1.2983, spreadPips: 1.1, change1d: 0.45, high24h: 1.3010, low24h: 1.2940 },
    { id: 'usdjpy', pair: 'USD/JPY', yahooSymbol: 'USDJPY=X', category: 'Major', bid: 151.42, ask: 151.44, spreadPips: 1.3, change1d: -0.38, high24h: 152.10, low24h: 150.90 },
    { id: 'audusd', pair: 'AUD/USD', yahooSymbol: 'AUDUSD=X', category: 'Major', bid: 0.6652, ask: 0.6653, spreadPips: 0.9, change1d: 0.52, high24h: 0.6680, low24h: 0.6620 },
    { id: 'usdcad', pair: 'USD/CAD', yahooSymbol: 'USDCAD=X', category: 'Major', bid: 1.3820, ask: 1.3822, spreadPips: 1.2, change1d: 0.12, high24h: 1.3850, low24h: 1.3790 },
  ]);

  const loadRealForexQuotes = async () => {
    setIsLoadingLive(true);
    const symbolsToFetch = pairs.map((p) => p.yahooSymbol);
    const liveMap = await fetchBatchLiveQuotes(symbolsToFetch);

    if (Object.keys(liveMap).length > 0) {
      setPairs((prev) =>
        prev.map((p) => {
          const live = liveMap[p.yahooSymbol];
          if (live && live.price > 0) {
            const mid = live.price;
            const halfSpread = (p.spreadPips * (p.pair.includes('JPY') ? 0.01 : 0.0001)) / 2;
            return {
              ...p,
              bid: Number((mid - halfSpread).toFixed(4)),
              ask: Number((mid + halfSpread).toFixed(4)),
              change1d: live.changePct,
              high24h: live.high || p.high24h,
              low24h: live.low || p.low24h,
              isRealLive: true,
            };
          }
          return p;
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString('en-IN'));
    }
    setIsLoadingLive(false);
  };

  useEffect(() => {
    loadRealForexQuotes();
    const interval = setInterval(loadRealForexQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredPairs = pairs.filter((item) => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.pair.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-xl border space-y-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/50'
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Forex Currency Exchange Markets & Cross Rates
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                Institutional Spreads (Pips)
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Real-time Bid/Ask rates, Pip value calculator, Central bank policy rates, and currency strength
            </p>
          </div>
        </div>

        {/* Central Bank Rates Summary Bar */}
        <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
          <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">FED: <strong>4.75%</strong></span>
          <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">ECB: <strong>3.25%</strong></span>
          <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">BOE: <strong>4.75%</strong></span>
          <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-amber-300">RBI: <strong>6.50%</strong></span>
          <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">BOJ: <strong>0.25%</strong></span>
        </div>
      </div>

      {/* FILTER & PIP CALCULATOR BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forex pair (e.g. EUR/USD, USD/INR, GBP/JPY)..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-neutral-950 border-neutral-800 text-neutral-100'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
            {['ALL', 'Major', 'Minor Cross', 'Emerging'].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  categoryFilter === c
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px]">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">Standard Lot:</span>
            <input
              type="number"
              step="0.1"
              value={lotSizeInput}
              onChange={(e) => setLotSizeInput(parseFloat(e.target.value) || 1.0)}
              className="w-14 bg-neutral-900 border border-neutral-700 text-emerald-400 text-center rounded px-1 font-bold focus:outline-none"
            />
            <span className="text-neutral-500">100k Units</span>
          </div>
        </div>
      </div>

      {/* FOREX PAIRS TABLE */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className={`sticky top-0 z-10 text-[10px] uppercase font-bold tracking-wider border-b ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}>
              <th className="py-2.5 px-3">Currency Pair</th>
              <th className="py-2.5 px-3 text-right text-emerald-400">Bid (Sell)</th>
              <th className="py-2.5 px-3 text-right text-rose-400">Ask (Buy)</th>
              <th className="py-2.5 px-3 text-right text-amber-400">Spread (Pips)</th>
              <th className="py-2.5 px-3 text-right">Pip Value ($ / 10 Pips)</th>
              <th className="py-2.5 px-3 text-right">24h Change</th>
              <th className="py-2.5 px-3 text-center">24h Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40">
            {filteredPairs.map((p) => {
              const isUp = p.change1d >= 0;
              const pipValueStdLot = p.pair.includes('JPY') ? (100000 / p.bid) * 0.01 * lotSizeInput : 10 * lotSizeInput;

              return (
                <tr key={p.id} className="transition-colors hover:bg-neutral-800/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-sans text-white">{p.pair}</span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                        {p.category}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right font-black text-emerald-400 text-sm">
                    {p.bid.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 4)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-black text-rose-400 text-sm">
                    {p.ask.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 4)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                    {p.spreadPips.toFixed(1)} pips
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                    ${(pipValueStdLot * 10).toFixed(2)} USD
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{p.change1d.toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div className="w-28 mx-auto space-y-1">
                      <div className="flex justify-between text-[9px] text-neutral-500">
                        <span>{p.low24h.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 3)}</span>
                        <span>{p.high24h.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 3)}</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, ((p.bid - p.low24h) / (p.high24h - p.low24h || 0.01)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
