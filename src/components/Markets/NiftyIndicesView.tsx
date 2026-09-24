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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';
import { usePersistentSymbols } from '../../services/symbolPersistenceService';
import { subscribeMarketTable, fetchMarketTable, MASTER_INDIAN_INDICES } from '../../services/marketDataTables';
import { GlobalIndexDetailModal, GlobalIndexDetailItem } from '../Modals/GlobalIndexDetailModal';

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
  currency?: string;
  isRealLive?: boolean;
}

const NIFTY_YAHOO_MAP: Record<string, string> = {
  'NIFTY 50': '^NSEI',
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'NIFTY BANK': '^NSEBANK',
  'SENSEX': '^BSESN',
  'NIFTY IT': '^CNXIT',
  'NIFTY MIDCAP': '^NSEMDCP50',
  'MIDCAP100': '^NSEMDCP50',
  'NIFTY SMALLCAP': '^CNXSC',
  'SMALLCAP100': '^CNXSC',
  'NIFTY AUTO': '^CNXAUTO',
  'NIFTY PHARMA': '^CNXPHARMA',
  'NIFTY FMCG': '^CNXFMCG',
  'NIFTY METAL': '^CNXMETAL',
  'NIFTY REALTY': '^CNXREALTY',
  'NIFTY ENERGY': '^CNXENERGY',
  'INDIA VIX': '^INDIAVIX',
};

export const NiftyIndicesView: React.FC = () => {
  const { isLight, theme } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Detail Modal state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GlobalIndexDetailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [indices, setIndices] = useState<NiftyIndexItem[]>(() =>
    MASTER_INDIAN_INDICES.map((m) => ({
      id: m.id.toLowerCase(),
      name: m.name,
      symbol: m.symbol,
      yahooSymbol: NIFTY_YAHOO_MAP[m.symbol] || NIFTY_YAHOO_MAP[m.id] || m.symbol,
      category: (m.category as any) || 'Benchmark',
      price: m.price,
      change1d: m.change1d,
      change1dPts: m.change1dPts || 0,
      high24h: m.high24h || m.price,
      low24h: m.low24h || m.price,
      peRatio: m.peRatio || 22.5,
      currency: 'INR',
    }))
  );

  // Subscribe to grouped Indian Indices table in Firestore (batch format)
  useEffect(() => {
    const unsub = subscribeMarketTable('indian_indices', (table) => {
      if (table && table.data && table.data.length > 0) {
        setIndices((prev) => {
          const existingMap = new Map(prev.map((i) => [i.symbol, i]));
          return table.data.map((m) => {
            const existing = existingMap.get(m.symbol);
            const incomingMs = m.updatedAtMs || (m.updatedAt ? new Date(m.updatedAt).getTime() : (table.updatedAtMs || new Date(table.updatedAt || 0).getTime()));
            const existingMs = (existing as any)?.updatedAtMs || 0;

            if (existing && existingMs > 0 && incomingMs <= existingMs) {
              return existing;
            }

            const validPrice = (typeof m.price === 'number' && !isNaN(m.price) && m.price > 0) ? m.price : (existing?.price || m.price);
            return {
              id: m.id.toLowerCase(),
              name: m.name,
              symbol: m.symbol,
              yahooSymbol: NIFTY_YAHOO_MAP[m.symbol] || NIFTY_YAHOO_MAP[m.id] || m.symbol,
              category: (m.category as any) || 'Benchmark',
              price: validPrice,
              change1d: m.change1d,
              change1dPts: m.change1dPts || 0,
              high24h: m.high24h || validPrice,
              low24h: m.low24h || validPrice,
              peRatio: m.peRatio || 22.5,
              currency: 'INR',
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
        });
        setLastRefreshed(new Date(table.updatedAt || Date.now()).toLocaleTimeString('en-IN'));
      }
    });

    return () => unsub();
  }, []);

  const { prices: persistentPrices } = usePersistentSymbols();

  // Instant update from Firestore persistence
  useEffect(() => {
    if (!persistentPrices || Object.keys(persistentPrices).length === 0) return;
    setIndices((prev) =>
      prev.map((idx) => {
        const cleanSym = idx.symbol.replace(/\s+/g, '').toUpperCase();
        const live =
          persistentPrices[idx.yahooSymbol] ||
          persistentPrices[idx.yahooSymbol.toUpperCase()] ||
          persistentPrices[cleanSym] ||
          persistentPrices[idx.symbol];

        if (live && live.price > 0 && live.price !== idx.price) {
          return {
            ...idx,
            price: live.price,
            change1d: live.changePct !== undefined ? live.changePct : idx.change1d,
            change1dPts: live.change !== undefined ? live.change : idx.change1dPts,
            high24h: Math.max(idx.high24h, live.high || live.price),
            low24h: live.low || idx.low24h,
            isRealLive: true,
          };
        }
        return idx;
      })
    );
  }, [persistentPrices]);

  const loadRealQuotes = async () => {
    setIsLoadingLive(true);
    const symbolsToFetch = indices.map((i) => i.yahooSymbol || i.symbol);
    const liveMap = await fetchBatchLiveQuotes(symbolsToFetch);

    if (Object.keys(liveMap).length > 0) {
      setIndices((prev) =>
        prev.map((idx) => {
          const targetKey = idx.yahooSymbol || idx.symbol;
          const live = liveMap[targetKey] || liveMap[idx.symbol] || liveMap[idx.id];
          if (live && live.price > 0) {
            return {
              ...idx,
              price: live.price,
              change1d: live.changePct !== undefined ? live.changePct : idx.change1d,
              change1dPts: live.change !== undefined ? live.change : idx.change1dPts,
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
    const interval = setInterval(loadRealQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleIndexClick = (item: NiftyIndexItem) => {
    setSelectedItemForDetail({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      yahooSymbol: item.yahooSymbol,
      category: item.category,
      region: 'India (NSE)',
      price: item.price,
      change1d: item.change1d,
      change1dPts: item.change1dPts,
      high24h: item.high24h,
      low24h: item.low24h,
      status: 'OPEN',
      currency: 'INR',
      peRatio: item.peRatio,
      isRealLive: item.isRealLive,
    });
    setIsDetailModalOpen(true);
  };

  const filteredIndices = indices.filter((idx) => {
    const matchesCat = categoryFilter === 'ALL' || idx.category === categoryFilter;
    const matchesSearch =
      idx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idx.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      <div
        className="rounded-2xl p-4 sm:p-5 shadow-xl border space-y-4 transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-primary)',
        }}
      >
        {/* HEADER */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
          style={{ borderColor: 'var(--theme-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
              <Building2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold tracking-wide">
                  NSE India Nifty Benchmark & Sectoral Indices
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-mono font-bold border border-orange-200">
                  NSE & BSE Dalal Street
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Click any Nifty index for Historical Chart & AI Insights</span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Real-time Nifty 50, Bank Nifty, Sectoral leadership, and India VIX institutional volatility
              </p>
            </div>
          </div>

          {/* India VIX & FII/DII Net Flow Banner */}
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 font-bold">
              <Flame className="w-3.5 h-3.5 text-purple-600" />
              <span>India VIX: <strong>12.85</strong> (-2.4%)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-bold">
              <span>FII Net: <strong>+₹2,450 Cr</strong></span>
            </div>

            <button
              onClick={loadRealQuotes}
              disabled={isLoadingLive}
              className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Syncing Live NSE...' : 'Live Refreshed'}</span>
              {lastRefreshed && <span className="text-[10px] opacity-75">({lastRefreshed})</span>}
            </button>
          </div>
        </div>

        {/* FILTER CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Nifty index (e.g. Nifty 50, Bank Nifty, IT, Metal)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none font-sans text-xs"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            />
          </div>

          <div
            className="flex p-1 rounded-xl border"
            style={{
              backgroundColor: 'var(--theme-bg-card-subtle)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {['ALL', 'Benchmark', 'Sectoral', 'Broad Market'].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  categoryFilter === c
                    ? 'bg-orange-600 text-white font-black shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: categoryFilter === c ? '#ea580c' : 'transparent',
                  color: categoryFilter === c ? '#ffffff' : 'inherit',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* NIFTY INDICES GRID (CLICKABLE FOR DETAIL MODAL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredIndices.map((idx) => {
            const isUp = idx.change1d >= 0;

            return (
              <div
                key={idx.id}
                onClick={() => handleIndexClick(idx)}
                className="p-4 rounded-xl border space-y-2.5 transition-all hover:scale-[1.015] cursor-pointer group shadow-2xs hover:shadow-md"
                style={{
                  backgroundColor: 'var(--theme-bg-card)',
                  borderColor: 'var(--theme-border)',
                }}
                title="Click to view historical trend chart & Gemini AI insights"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm font-sans group-hover:text-orange-600 transition-colors">
                        {idx.name}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-600" />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', color: 'var(--theme-text-primary)' }}>
                        {idx.symbol}
                      </span>
                      <span>• P/E: {idx.peRatio}x</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-800 border border-orange-200">
                    {idx.category}
                  </span>
                </div>

                {/* Price & Change */}
                <div className="flex items-baseline justify-between font-mono pt-1">
                  <span className="text-xl font-black">
                    ₹{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  <div
                    className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isUp ? '+' : ''}{idx.change1dPts.toFixed(1)} ({isUp ? '+' : ''}{idx.change1d.toFixed(2)}%)</span>
                  </div>
                </div>

                {/* High / Low Bar */}
                <div className="space-y-1 font-mono text-[10px] pt-1 border-t" style={{ borderColor: 'var(--theme-border-subtle)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span>Day Low: ₹{idx.low24h.toLocaleString('en-IN')}</span>
                    <span>Day High: ₹{idx.high24h.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, ((idx.price - idx.low24h) / (idx.high24h - idx.low24h || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Micro Action link */}
                <div className="flex items-center justify-between text-[11px] font-bold text-orange-600 pt-0.5 opacity-90 group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>AI Analysis Available</span>
                  </span>
                  <span className="underline group-hover:text-orange-700">View Trend Chart →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NIFTY INDEX DETAIL MODAL */}
      <GlobalIndexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemForDetail}
      />
    </>
  );
};
