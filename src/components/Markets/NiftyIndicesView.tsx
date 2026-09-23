import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
  Search,
  Building2,
  PieChart,
  BarChart3,
  Flame,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';

export interface NiftyIndexItem {
  id: string;
  name: string;
  symbol: string;
  yahooSymbol: string;
  category: 'Benchmark' | 'Sectoral' | 'Broad Market';
  price: number;
  change1d: number;
  change1dPts: number;
  high24h: number;
  low24h: number;
  peRatio: number;
  isRealLive?: boolean;
}

export const NiftyIndicesView: React.FC = () => {
  const { isLight } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [indices, setIndices] = useState<NiftyIndexItem[]>([
    { id: 'nifty50', name: 'Nifty 50', symbol: 'NIFTY 50', yahooSymbol: '^NSEI', category: 'Benchmark', price: 25480.20, change1d: 0.72, change1dPts: 182.40, high24h: 25540.00, low24h: 25320.00, peRatio: 22.8 },
    { id: 'banknifty', name: 'Nifty Bank', symbol: 'BANKNIFTY', yahooSymbol: '^NSEBANK', category: 'Sectoral', price: 53820.50, change1d: 0.95, change1dPts: 508.10, high24h: 53980.00, low24h: 53250.00, peRatio: 16.4 },
    { id: 'sensex', name: 'BSE Sensex', symbol: 'SENSEX', yahooSymbol: '^BSESN', category: 'Benchmark', price: 83120.40, change1d: 0.68, change1dPts: 560.20, high24h: 83300.00, low24h: 82600.00, peRatio: 23.5 },
    { id: 'niftyit', name: 'Nifty IT', symbol: 'NIFTY IT', yahooSymbol: '^CNXIT', category: 'Sectoral', price: 42150.80, change1d: 1.42, change1dPts: 590.30, high24h: 42300.00, low24h: 41500.00, peRatio: 28.2 },
    { id: 'midcap100', name: 'Nifty Midcap 100', symbol: 'NIFTY MIDCAP', yahooSymbol: 'NIFTY_MIDSELECT.NS', category: 'Broad Market', price: 59280.00, change1d: 0.45, change1dPts: 265.00, high24h: 59450.00, low24h: 58900.00, peRatio: 31.5 },
    { id: 'niftyauto', name: 'Nifty Auto', symbol: 'NIFTY AUTO', yahooSymbol: '^CNXAUTO', category: 'Sectoral', price: 26180.50, change1d: 1.15, change1dPts: 298.00, high24h: 26300.00, low24h: 25850.00, peRatio: 24.0 },
    { id: 'niftypharma', name: 'Nifty Pharma', symbol: 'NIFTY PHARMA', yahooSymbol: '^CNXPHARMA', category: 'Sectoral', price: 22850.10, change1d: -0.32, change1dPts: -73.00, high24h: 23020.00, low24h: 22750.00, peRatio: 34.2 },
    { id: 'niftyfmcg', name: 'Nifty FMCG', symbol: 'NIFTY FMCG', yahooSymbol: '^CNXFMCG', category: 'Sectoral', price: 62450.00, change1d: 0.12, change1dPts: 75.00, high24h: 62700.00, low24h: 62200.00, peRatio: 42.0 },
    { id: 'niftymetal', name: 'Nifty Metal', symbol: 'NIFTY METAL', yahooSymbol: '^CNXMETAL', category: 'Sectoral', price: 9840.60, change1d: 1.85, change1dPts: 178.40, high24h: 9920.00, low24h: 9680.00, peRatio: 14.8 },
  ]);

  const loadRealQuotes = async () => {
    setIsLoadingLive(true);
    const symbolsToFetch = indices.map((i) => i.yahooSymbol);
    const liveMap = await fetchBatchLiveQuotes(symbolsToFetch);

    if (Object.keys(liveMap).length > 0) {
      setIndices((prev) =>
        prev.map((idx) => {
          const live = liveMap[idx.yahooSymbol];
          if (live && live.price > 0) {
            return {
              ...idx,
              price: live.price,
              change1d: live.changePct,
              change1dPts: live.change,
              high24h: Math.max(idx.high24h, live.high || live.price),
              low24h: live.low || idx.low24h,
              isRealLive: true,
            };
          }
          return idx;
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString('en-IN'));
    }
    setIsLoadingLive(false);
  };

  useEffect(() => {
    loadRealQuotes();
    const interval = setInterval(loadRealQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredIndices = indices.filter((idx) => {
    const matchesCat = categoryFilter === 'ALL' || idx.category === categoryFilter;
    const matchesSearch =
      idx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idx.symbol.toLowerCase().includes(searchQuery.toLowerCase());
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
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <Building2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                NSE India Nifty Benchmark & Sectoral Indices
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold">
                NSE & BSE Dalal Street
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Nifty 50, Bank Nifty, Sectoral leadership, India VIX volatility, and FII/DII institutional cash flow
            </p>
          </div>
        </div>

        {/* India VIX & FII/DII Net Flow Banner */}
        <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-purple-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>India VIX: <strong>12.85</strong> (-2.4%)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-emerald-400 flex items-center gap-1.5">
            <span>FII Net: <strong>+₹2,450 Cr</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-cyan-400 flex items-center gap-1.5">
            <span>DII Net: <strong>+₹1,820 Cr</strong></span>
          </div>

          <button
            onClick={loadRealQuotes}
            disabled={isLoadingLive}
            className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>{isLoadingLive ? 'Syncing Real NSE...' : 'Live Refreshed'}</span>
            {lastRefreshed && <span className="text-[10px] text-orange-200/70">({lastRefreshed})</span>}
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Nifty index (e.g. Nifty 50, Bank Nifty, IT, Metal)..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-neutral-950 border-neutral-800 text-neutral-100'
            }`}
          />
        </div>

        <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
          {['ALL', 'Benchmark', 'Sectoral', 'Broad Market'].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                categoryFilter === c
                  ? 'bg-orange-500 text-neutral-950 font-black shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* NIFTY INDICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredIndices.map((idx) => {
          const isUp = idx.change1d >= 0;

          return (
            <div
              key={idx.id}
              className={`p-4 rounded-xl border space-y-2.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md'
                  : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-extrabold text-sm font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {idx.name}
                  </h3>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-orange-400 font-bold">{idx.symbol}</span>
                    <span>• P/E: {idx.peRatio}x</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {idx.category}
                </span>
              </div>

              {/* Price & Change */}
              <div className="flex items-baseline justify-between font-mono pt-1">
                <span className="text-xl font-black text-white">
                  ₹{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>

                <div
                  className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                    isUp
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isUp ? '+' : ''}{idx.change1dPts.toFixed(1)} ({isUp ? '+' : ''}{idx.change1d.toFixed(2)}%)</span>
                </div>
              </div>

              {/* High / Low Bar */}
              <div className="space-y-1 font-mono text-[10px] pt-1 border-t border-neutral-800/60">
                <div className="flex justify-between text-neutral-400">
                  <span>Day Low: ₹{idx.low24h.toLocaleString('en-IN')}</span>
                  <span>Day High: ₹{idx.high24h.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, ((idx.price - idx.low24h) / (idx.high24h - idx.low24h || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
