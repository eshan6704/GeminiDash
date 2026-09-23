import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  RefreshCw,
  Search,
  Box,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';

export interface CommodityItem {
  id: string;
  name: string;
  symbol: string;
  yahooSymbol: string;
  unit: string;
  category: 'Energy' | 'Precious Metals' | 'Industrial Metals' | 'Agriculture';
  price: number;
  change1d: number;
  high24h: number;
  low24h: number;
  contractExpiry: string;
  isRealLive?: boolean;
}

export const CommoditiesMarketView: React.FC = () => {
  const { isLight } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [commodities, setCommodities] = useState<CommodityItem[]>([
    // Energy
    { id: 'wti', name: 'Crude Oil (WTI)', symbol: 'CL', yahooSymbol: 'CL=F', unit: 'USD / Barrel', category: 'Energy', price: 71.45, change1d: 1.25, high24h: 72.30, low24h: 70.20, contractExpiry: 'NOV 2026' },
    { id: 'brent', name: 'Brent Crude Oil', symbol: 'LCO', yahooSymbol: 'BZ=F', unit: 'USD / Barrel', category: 'Energy', price: 75.80, change1d: 0.98, high24h: 76.50, low24h: 74.80, contractExpiry: 'DEC 2026' },
    { id: 'natgas', name: 'Natural Gas', symbol: 'NG', yahooSymbol: 'NG=F', unit: 'USD / MMBtu', category: 'Energy', price: 2.85, change1d: -2.15, high24h: 2.95, low24h: 2.78, contractExpiry: 'NOV 2026' },

    // Precious & Industrial Metals
    { id: 'gold', name: 'Spot Gold Fine', symbol: 'XAU/USD', yahooSymbol: 'GC=F', unit: 'USD / Troy Oz', category: 'Precious Metals', price: 2750.40, change1d: 0.85, high24h: 2762.00, low24h: 2735.00, contractExpiry: 'SPOT' },
    { id: 'silver', name: 'Spot Silver Fine', symbol: 'XAG/USD', yahooSymbol: 'SI=F', unit: 'USD / Troy Oz', category: 'Precious Metals', price: 34.80, change1d: 1.65, high24h: 35.20, low24h: 34.10, contractExpiry: 'SPOT' },
    { id: 'copper', name: 'High Grade Copper', symbol: 'HG', yahooSymbol: 'HG=F', unit: 'USD / Lb', category: 'Industrial Metals', price: 4.42, change1d: 0.92, high24h: 4.48, low24h: 4.36, contractExpiry: 'DEC 2026' },

    // Agriculture
    { id: 'wheat', name: 'Wheat Futures', symbol: 'ZW', yahooSymbol: 'ZW=F', unit: 'US Cents / Bushel', category: 'Agriculture', price: 582.50, change1d: -0.82, high24h: 590.00, low24h: 578.00, contractExpiry: 'DEC 2026' },
    { id: 'corn', name: 'Corn Futures', symbol: 'ZC', yahooSymbol: 'ZC=F', unit: 'US Cents / Bushel', category: 'Agriculture', price: 418.25, change1d: 0.35, high24h: 422.00, low24h: 415.00, contractExpiry: 'DEC 2026' },
    { id: 'coffee', name: 'Coffee Arabica', symbol: 'KC', yahooSymbol: 'KC=F', unit: 'US Cents / Lb', category: 'Agriculture', price: 252.40, change1d: 2.45, high24h: 256.00, low24h: 246.00, contractExpiry: 'DEC 2026' },
  ]);

  const loadRealCommodityQuotes = async () => {
    setIsLoadingLive(true);
    const symbolsToFetch = commodities.map((c) => c.yahooSymbol);
    const liveMap = await fetchBatchLiveQuotes(symbolsToFetch);

    if (Object.keys(liveMap).length > 0) {
      setCommodities((prev) =>
        prev.map((c) => {
          const live = liveMap[c.yahooSymbol];
          if (live && live.price > 0) {
            return {
              ...c,
              price: live.price,
              change1d: live.changePct,
              high24h: live.high || c.high24h,
              low24h: live.low || c.low24h,
              isRealLive: true,
            };
          }
          return c;
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString('en-IN'));
    }
    setIsLoadingLive(false);
  };

  useEffect(() => {
    loadRealCommodityQuotes();
    const interval = setInterval(loadRealCommodityQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredCommodities = commodities.filter((c) => {
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase());
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
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Global Energy, Precious Metals & Agricultural Commodities
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                NYMEX • COMEX • CBOT
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Spot and futures pricing for Crude Oil, Gold, Silver, Natural Gas, Copper, and Agricultural grains
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5" />
          <span>Commodity Futures Desk</span>
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
            placeholder="Search commodity (e.g. WTI, Gold, Natural Gas, Silver)..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-neutral-950 border-neutral-800 text-neutral-100'
            }`}
          />
        </div>

        <div className={`flex p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
          {['ALL', 'Energy', 'Precious Metals', 'Industrial Metals', 'Agriculture'].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                categoryFilter === c
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
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

      {/* COMMODITIES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCommodities.map((item) => {
          const isUp = item.change1d >= 0;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border space-y-2.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md'
                  : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-extrabold text-sm font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">{item.symbol}</span>
                    <span>• {item.unit}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {item.contractExpiry}
                </span>
              </div>

              {/* Price & Change */}
              <div className="flex items-baseline justify-between font-mono pt-1">
                <span className="text-xl font-black text-white">
                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: item.price < 10 ? 3 : 2 })}
                </span>

                <div
                  className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                    isUp
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isUp ? '+' : ''}{item.change1d.toFixed(2)}%</span>
                </div>
              </div>

              {/* High / Low Bar */}
              <div className="space-y-1 font-mono text-[10px] pt-1 border-t border-neutral-800/60">
                <div className="flex justify-between text-neutral-400">
                  <span>24h Low: ${item.low24h}</span>
                  <span>24h High: ${item.high24h}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, ((item.price - item.low24h) / (item.high24h - item.low24h || 1)) * 100)
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
