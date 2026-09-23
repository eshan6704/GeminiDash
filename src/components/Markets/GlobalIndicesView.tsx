import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Clock,
  Zap,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';

export interface IndexItem {
  id: string;
  name: string;
  symbol: string;
  yahooSymbol: string;
  region: 'US & Americas' | 'Europe' | 'Asia-Pacific';
  category: 'Cash Index' | 'Futures';
  price: number;
  change1d: number;
  change1dPts: number;
  high24h: number;
  low24h: number;
  status: 'OPEN' | 'CLOSED' | 'PRE-MARKET';
  isRealLive?: boolean;
}

export const GlobalIndicesView: React.FC = () => {
  const { isLight } = useTheme();
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [indices, setIndices] = useState<IndexItem[]>([
    // Americas
    { id: 'sp500', name: 'S&P 500', symbol: 'US500', yahooSymbol: '^GSPC', region: 'US & Americas', category: 'Cash Index', price: 5892.40, change1d: 0.65, change1dPts: 38.10, high24h: 5910.00, low24h: 5854.20, status: 'OPEN' },
    { id: 'nq100', name: 'Nasdaq 100', symbol: 'US100', yahooSymbol: '^IXIC', region: 'US & Americas', category: 'Cash Index', price: 20450.80, change1d: 1.12, change1dPts: 226.50, high24h: 20520.00, low24h: 20210.30, status: 'OPEN' },
    { id: 'dow30', name: 'Dow Jones Industrial', symbol: 'US30', yahooSymbol: '^DJI', region: 'US & Americas', category: 'Cash Index', price: 43210.15, change1d: 0.28, change1dPts: 120.40, high24h: 43350.00, low24h: 43080.00, status: 'OPEN' },
    { id: 'es_fut', name: 'E-mini S&P 500 Futures', symbol: 'ES1!', yahooSymbol: 'ES=F', region: 'US & Americas', category: 'Futures', price: 5912.25, change1d: 0.72, change1dPts: 42.00, high24h: 5925.00, low24h: 5870.00, status: 'OPEN' },
    { id: 'nq_fut', name: 'E-mini Nasdaq Futures', symbol: 'NQ1!', yahooSymbol: 'NQ=F', region: 'US & Americas', category: 'Futures', price: 20520.50, change1d: 1.25, change1dPts: 253.00, high24h: 20580.00, low24h: 20280.00, status: 'OPEN' },

    // Europe
    { id: 'ftse100', name: 'FTSE 100 (UK)', symbol: 'UK100', yahooSymbol: '^FTSE', region: 'Europe', category: 'Cash Index', price: 8340.20, change1d: 0.18, change1dPts: 15.10, high24h: 8380.00, low24h: 8310.00, status: 'CLOSED' },
    { id: 'dax40', name: 'DAX 40 (Germany)', symbol: 'GER40', yahooSymbol: '^GDAXI', region: 'Europe', category: 'Cash Index', price: 19580.90, change1d: 0.84, change1dPts: 163.20, high24h: 19640.00, low24h: 19410.00, status: 'CLOSED' },

    // Asia-Pacific
    { id: 'nikkei', name: 'Nikkei 225 (Japan)', symbol: 'JP225', yahooSymbol: '^N225', region: 'Asia-Pacific', category: 'Cash Index', price: 38920.00, change1d: 1.45, change1dPts: 556.00, high24h: 39100.00, low24h: 38350.00, status: 'CLOSED' },
    { id: 'hsi', name: 'Hang Seng (Hong Kong)', symbol: 'HK50', yahooSymbol: '^HSI', region: 'Asia-Pacific', category: 'Cash Index', price: 20680.50, change1d: -0.85, change1dPts: -177.20, high24h: 20950.00, low24h: 20510.00, status: 'CLOSED' },
  ]);

  const loadRealGlobalQuotes = async () => {
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
              high24h: live.high || idx.high24h,
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
    loadRealGlobalQuotes();
    const interval = setInterval(loadRealGlobalQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredIndices = indices.filter((item) => {
    const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter;
    const matchesType = typeFilter === 'ALL' || item.category === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesType && matchesSearch;
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
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Global Stock Indices & Benchmark Futures
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                Americas • Europe • Asia
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Real-time cash index benchmarks, E-mini futures, 24h ranges, and international market hours
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Live Wall Street & Global Desk</span>
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
            placeholder="Search global index (e.g. S&P 500, Nikkei, DAX)..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-neutral-950 border-neutral-800 text-neutral-100'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
            {['ALL', 'US & Americas', 'Europe', 'Asia-Pacific'].map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  regionFilter === r
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
            {['ALL', 'Cash Index', 'Futures'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-blue-500 text-white font-black shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INDICES CARDS GRID */}
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
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">{idx.symbol}</span>
                    <span>• {idx.region}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                    idx.status === 'OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {idx.status}
                </span>
              </div>

              {/* Price & Change */}
              <div className="flex items-baseline justify-between font-mono pt-1">
                <span className="text-xl font-black text-white">
                  {idx.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>

                <div
                  className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                    isUp
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isUp ? '+' : ''}{idx.change1dPts.toFixed(2)} ({isUp ? '+' : ''}{idx.change1d.toFixed(2)}%)</span>
                </div>
              </div>

              {/* High / Low Bar */}
              <div className="space-y-1 font-mono text-[10px] pt-1 border-t border-neutral-800/60">
                <div className="flex justify-between text-neutral-400">
                  <span>24h Low: ${idx.low24h.toLocaleString()}</span>
                  <span>24h High: ${idx.high24h.toLocaleString()}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full"
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
