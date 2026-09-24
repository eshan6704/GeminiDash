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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';
import { subscribeMarketTable, fetchMarketTable, MASTER_GLOBAL_INDICES, MASTER_FUTURES } from '../../services/marketDataTables';
import { GlobalIndexDetailModal, GlobalIndexDetailItem } from '../Modals/GlobalIndexDetailModal';

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
  currency?: string;
  isRealLive?: boolean;
}

const GLOBAL_YAHOO_MAP: Record<string, string> = {
  'US500': '^GSPC',
  'SP500': '^GSPC',
  'US100': '^NDX',
  'NASDAQ': '^NDX',
  'US30': '^DJI',
  'DOW30': '^DJI',
  'US2000': '^RUT',
  'RUSSELL2000': '^RUT',
  'UK100': '^FTSE',
  'FTSE100': '^FTSE',
  'GER40': '^GDAXI',
  'DAX40': '^GDAXI',
  'FRA40': '^FCHI',
  'CAC40': '^FCHI',
  'EU50': '^STOXX50E',
  'EUROSTOXX50': '^STOXX50E',
  'JP225': '^N225',
  'NIKKEI225': '^N225',
  'HK50': '^HSI',
  'HANGSENG': '^HSI',
  'CN50': '000001.SS',
  'SHANGHAI': '000001.SS',
  'KR200': '^KS11',
  'KOSPI': '^KS11',
  'AU200': '^AXJO',
  'ASX200': '^AXJO',
  'TW50': '^TWII',
  'TAIEX': '^TWII',
  'GIFTNIFTY': '^NSEI',
  'ES1!': 'ES=F',
  'ES_FUT': 'ES=F',
  'NQ1!': 'NQ=F',
  'NQ_FUT': 'NQ=F',
  'YM1!': 'YM=F',
  'YM_FUT': 'YM=F',
  'CL1!': 'CL=F',
  'CL_FUT': 'CL=F',
  'GC1!': 'GC=F',
  'GC_FUT': 'GC=F',
  'SI1!': 'SI=F',
  'SI_FUT': 'SI=F',
  'NG1!': 'NG=F',
  'NG_FUT': 'NG=F',
  'HG1!': 'HG=F',
  'HG_FUT': 'HG=F',
  'BTC1!': 'BTC=F',
  'ETH1!': 'ETH=F',
};

export const GlobalIndicesView: React.FC = () => {
  const { isLight, theme } = useTheme();
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Detail Modal state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GlobalIndexDetailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [indices, setIndices] = useState<IndexItem[]>(() => [
    ...MASTER_GLOBAL_INDICES.map((m) => ({
      id: m.id,
      name: m.name,
      symbol: m.symbol,
      yahooSymbol: GLOBAL_YAHOO_MAP[m.symbol] || GLOBAL_YAHOO_MAP[m.id] || m.symbol,
      region: (m.sector as any) || 'US & Americas',
      category: (m.category as any) || 'Cash Index',
      price: m.price,
      change1d: m.change1d,
      change1dPts: m.change1dPts || 0,
      high24h: m.high24h || m.price,
      low24h: m.low24h || m.price,
      status: (m.status as any) || 'OPEN',
      currency: m.currency || 'USD',
    })),
    ...MASTER_FUTURES.map((m) => ({
      id: m.id,
      name: m.name,
      symbol: m.symbol,
      yahooSymbol: GLOBAL_YAHOO_MAP[m.symbol] || GLOBAL_YAHOO_MAP[m.id] || m.symbol,
      region: 'US & Americas' as const,
      category: 'Futures' as const,
      price: m.price,
      change1d: m.change1d,
      change1dPts: m.change1dPts || 0,
      high24h: m.high24h || m.price,
      low24h: m.low24h || m.price,
      status: (m.status as any) || 'OPEN',
      currency: m.currency || 'USD',
    })),
  ]);

  // Subscribe to grouped Global Indices and Futures tables in Firestore (batch format)
  useEffect(() => {
    const unsubIndices = subscribeMarketTable('global_indices', (table) => {
      if (table && table.data && table.data.length > 0) {
        setIndices((prev) => {
          const nonIndices = prev.filter((i) => i.category === 'Futures');
          const existingMap = new Map(prev.map((i) => [i.id, i]));
          const updated = table.data.map((m) => {
            const existing = existingMap.get(m.id);
            const incomingMs = m.updatedAtMs || (m.updatedAt ? new Date(m.updatedAt).getTime() : (table.updatedAtMs || new Date(table.updatedAt || 0).getTime()));
            const existingMs = (existing as any)?.updatedAtMs || 0;

            if (existing && existingMs > 0 && incomingMs <= existingMs) {
              return existing;
            }

            const validPrice = (typeof m.price === 'number' && !isNaN(m.price) && m.price > 0) ? m.price : (existing?.price || m.price);
            return {
              id: m.id,
              name: m.name,
              symbol: m.symbol,
              yahooSymbol: GLOBAL_YAHOO_MAP[m.symbol] || GLOBAL_YAHOO_MAP[m.id] || m.symbol,
              region: (m.sector as any) || 'US & Americas',
              category: 'Cash Index' as const,
              price: validPrice,
              change1d: m.change1d,
              change1dPts: m.change1dPts || 0,
              high24h: m.high24h || validPrice,
              low24h: m.low24h || validPrice,
              status: (m.status as any) || 'OPEN',
              currency: m.currency || 'USD',
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
          return [...updated, ...nonIndices];
        });
        setLastRefreshed(new Date(table.updatedAt || Date.now()).toLocaleTimeString());
      }
    });

    const unsubFutures = subscribeMarketTable('futures', (table) => {
      if (table && table.data && table.data.length > 0) {
        setIndices((prev) => {
          const nonFutures = prev.filter((i) => i.category !== 'Futures');
          const existingMap = new Map(prev.map((i) => [i.id, i]));
          const updatedFutures = table.data.map((m) => {
            const existing = existingMap.get(m.id);
            const incomingMs = m.updatedAtMs || (m.updatedAt ? new Date(m.updatedAt).getTime() : (table.updatedAtMs || new Date(table.updatedAt || 0).getTime()));
            const existingMs = (existing as any)?.updatedAtMs || 0;

            if (existing && existingMs > 0 && incomingMs <= existingMs) {
              return existing;
            }

            const validPrice = (typeof m.price === 'number' && !isNaN(m.price) && m.price > 0) ? m.price : (existing?.price || m.price);
            return {
              id: m.id,
              name: m.name,
              symbol: m.symbol,
              yahooSymbol: GLOBAL_YAHOO_MAP[m.symbol] || GLOBAL_YAHOO_MAP[m.id] || m.symbol,
              region: 'US & Americas' as const,
              category: 'Futures' as const,
              price: validPrice,
              change1d: m.change1d,
              change1dPts: m.change1dPts || 0,
              high24h: m.high24h || validPrice,
              low24h: m.low24h || validPrice,
              status: (m.status as any) || 'OPEN',
              currency: m.currency || 'USD',
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
          return [...nonFutures, ...updatedFutures];
        });
      }
    });

    return () => {
      unsubIndices();
      unsubFutures();
    };
  }, []);

  const loadRealGlobalQuotes = async () => {
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
    const interval = setInterval(loadRealGlobalQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleIndexClick = (item: IndexItem) => {
    setSelectedItemForDetail({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      yahooSymbol: item.yahooSymbol,
      category: item.category,
      region: item.region,
      price: item.price,
      change1d: item.change1d,
      change1dPts: item.change1dPts,
      high24h: item.high24h,
      low24h: item.low24h,
      status: item.status,
      currency: item.currency || 'USD',
      isRealLive: item.isRealLive,
    });
    setIsDetailModalOpen(true);
  };

  const filteredIndices = indices.filter((item) => {
    const matchesRegion = regionFilter === 'ALL' || item.region === regionFilter;
    const matchesType = typeFilter === 'ALL' || item.category === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesType && matchesSearch;
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
            <div
              className="p-2.5 rounded-xl border shadow-xs"
              style={{
                backgroundColor: 'var(--theme-accent-light)',
                borderColor: 'var(--theme-accent-border)',
                color: 'var(--theme-accent)',
              }}
            >
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold tracking-wide">
                  Global Stock Indices & Benchmark Futures
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                  style={{
                    backgroundColor: 'var(--theme-accent-light)',
                    borderColor: 'var(--theme-accent-border)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  Americas • Europe • Asia
                </span>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Click any index for Historical Trend & AI Insights</span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Real-time cash index benchmarks, E-mini futures, 24h ranges, and international market hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRealGlobalQuotes}
              disabled={isLoadingLive}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all hover:bg-slate-100 cursor-pointer"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
              title="Refresh Global Live Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isLoadingLive ? 'Refreshing...' : 'Live Quotes'}</span>
            </button>
            <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500/30" />
              <span>Live Desk: {lastRefreshed || 'Active'}</span>
            </div>
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
              placeholder="Search global index (e.g. S&P 500, Nikkei, DAX)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none font-sans text-xs"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex p-1 rounded-xl border"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
            >
              {['ALL', 'US & Americas', 'Europe', 'Asia-Pacific'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    regionFilter === r
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: regionFilter === r ? 'var(--theme-accent)' : 'transparent',
                    color: regionFilter === r ? '#ffffff' : 'inherit',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div
              className="flex p-1 rounded-xl border"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
            >
              {['ALL', 'Cash Index', 'Futures'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    typeFilter === t
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: typeFilter === t ? 'var(--theme-accent)' : 'transparent',
                    color: typeFilter === t ? '#ffffff' : 'inherit',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INDICES CARDS GRID (CLICKABLE FOR DETAIL MODAL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredIndices.map((idx) => {
            const isUp = idx.change1d >= 0;
            const currencySymbol = idx.currency === 'INR' ? '₹' : idx.currency === 'EUR' ? '€' : idx.currency === 'GBP' ? '£' : idx.currency === 'JPY' ? '¥' : '$';

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
                      <h3 className="font-extrabold text-sm font-sans group-hover:text-blue-600 transition-colors">
                        {idx.name}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', color: 'var(--theme-text-primary)' }}>
                        {idx.symbol}
                      </span>
                      <span>• {idx.region}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                      idx.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {idx.status}
                  </span>
                </div>

                {/* Price & Change */}
                <div className="flex items-baseline justify-between font-mono pt-1">
                  <span className="text-xl font-black">
                    {currencySymbol}{idx.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>

                  <div
                    className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isUp ? '+' : ''}{idx.change1dPts.toFixed(2)} ({isUp ? '+' : ''}{idx.change1d.toFixed(2)}%)</span>
                  </div>
                </div>

                {/* High / Low Bar */}
                <div className="space-y-1 font-mono text-[10px] pt-1 border-t" style={{ borderColor: 'var(--theme-border-subtle)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span>24h Low: {currencySymbol}{idx.low24h.toLocaleString()}</span>
                    <span>24h High: {currencySymbol}{idx.high24h.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-amber-500 h-full rounded-full"
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
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 pt-0.5 opacity-90 group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>AI Analysis Available</span>
                  </span>
                  <span className="underline group-hover:text-blue-700">View Trend Chart →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GLOBAL INDEX DETAIL MODAL */}
      <GlobalIndexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemForDetail}
      />
    </>
  );
};
