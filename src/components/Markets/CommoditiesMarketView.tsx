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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';
import { subscribeMarketTable, fetchMarketTable, MASTER_COMMODITIES } from '../../services/marketDataTables';
import { GlobalIndexDetailModal, GlobalIndexDetailItem } from '../Modals/GlobalIndexDetailModal';

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
  const { isLight, theme } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Detail Modal state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GlobalIndexDetailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [commodities, setCommodities] = useState<CommodityItem[]>(() =>
    MASTER_COMMODITIES.map((m) => ({
      id: m.id.toLowerCase(),
      name: m.name,
      symbol: m.symbol,
      yahooSymbol: `${m.symbol}=F`,
      unit: m.category === 'Energy' ? 'USD / Barrel' : m.category === 'Precious Metals' ? 'USD / Troy Oz' : 'USD / Unit',
      category: (m.category as any) || 'Energy',
      price: m.price,
      change1d: m.change1d,
      high24h: m.high24h || m.price,
      low24h: m.low24h || m.price,
      contractExpiry: 'DEC 2026',
    }))
  );

  // Subscribe to grouped Commodities table in Firestore (batch format)
  useEffect(() => {
    const unsub = subscribeMarketTable('commodities', (table) => {
      if (table && table.data && table.data.length > 0) {
        setCommodities((prev) => {
          const existingMap = new Map(prev.map((c) => [c.symbol, c]));
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
              yahooSymbol: `${m.symbol}=F`,
              unit: m.category === 'Energy' ? 'USD / Barrel' : m.category === 'Precious Metals' ? 'USD / Troy Oz' : 'USD / Unit',
              category: (m.category as any) || 'Energy',
              price: validPrice,
              change1d: m.change1d,
              high24h: m.high24h || validPrice,
              low24h: m.low24h || validPrice,
              contractExpiry: 'DEC 2026',
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
        });
        setLastRefreshed(new Date(table.updatedAt || Date.now()).toLocaleTimeString());
      }
    });

    return () => unsub();
  }, []);

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
              change1d: live.changePct !== undefined ? live.changePct : c.change1d,
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
    const interval = setInterval(loadRealCommodityQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCommodityClick = (c: CommodityItem) => {
    setSelectedItemForDetail({
      id: c.id,
      name: `${c.name} Commodity`,
      symbol: c.symbol,
      yahooSymbol: c.yahooSymbol,
      category: `${c.category} Commodity`,
      region: 'Global Commodities Exchange',
      price: c.price,
      change1d: c.change1d,
      change1dPts: Number((c.price * (c.change1d / 100)).toFixed(2)),
      high24h: c.high24h,
      low24h: c.low24h,
      status: 'OPEN',
      currency: 'USD',
      isRealLive: c.isRealLive,
    });
    setIsDetailModalOpen(true);
  };

  const filteredCommodities = commodities.filter((c) => {
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase());
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
            <div
              className="p-2.5 rounded-xl border shadow-xs"
              style={{
                backgroundColor: 'var(--theme-accent-light)',
                borderColor: 'var(--theme-accent-border)',
                color: 'var(--theme-accent)',
              }}
            >
              <Flame className="w-5 h-5 animate-pulse text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold tracking-wide">
                  Global Energy, Precious Metals & Agricultural Commodities
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                  style={{
                    backgroundColor: 'var(--theme-accent-light)',
                    borderColor: 'var(--theme-accent-border)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  NYMEX • COMEX • CBOT
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Click any Commodity for Trend Chart & AI Insights</span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Spot and futures pricing for Crude Oil, Gold, Silver, Natural Gas, Copper, and Agricultural grains
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRealCommodityQuotes}
              disabled={isLoadingLive}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:bg-slate-100"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
              title="Refresh Commodities Live Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isLoadingLive ? 'Syncing...' : 'Live Quotes'}</span>
            </button>
            <div className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-600" />
              <span>Commodity Desk</span>
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
              placeholder="Search commodity (e.g. WTI, Gold, Natural Gas, Silver)..."
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
            {['ALL', 'Energy', 'Precious Metals', 'Industrial Metals', 'Agriculture'].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  categoryFilter === c
                    ? 'bg-amber-600 text-white font-black shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: categoryFilter === c ? '#d97706' : 'transparent',
                  color: categoryFilter === c ? '#ffffff' : 'inherit',
                }}
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
                onClick={() => handleCommodityClick(item)}
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
                      <h3 className="font-extrabold text-sm font-sans group-hover:text-amber-600 transition-colors">
                        {item.name}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', color: 'var(--theme-text-primary)' }}>
                        {item.symbol}
                      </span>
                      <span>• {item.unit}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {item.contractExpiry}
                  </span>
                </div>

                {/* Price & Change */}
                <div className="flex items-baseline justify-between font-mono pt-1">
                  <span className="text-xl font-black">
                    ${item.price.toLocaleString('en-US', { minimumFractionDigits: item.price < 10 ? 3 : 2 })}
                  </span>

                  <div
                    className={`flex items-center gap-1 font-extrabold text-xs px-2 py-0.5 rounded ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isUp ? '+' : ''}{item.change1d.toFixed(2)}%</span>
                  </div>
                </div>

                {/* High / Low Bar */}
                <div className="space-y-1 font-mono text-[10px] pt-1 border-t" style={{ borderColor: 'var(--theme-border-subtle)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span>24h Low: ${item.low24h}</span>
                    <span>24h High: ${item.high24h}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, ((item.price - item.low24h) / (item.high24h - item.low24h || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Micro Action link */}
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 pt-0.5 opacity-90 group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>AI Analysis Available</span>
                  </span>
                  <span className="underline group-hover:text-amber-700">View Trend Chart →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COMMODITY DETAIL MODAL */}
      <GlobalIndexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemForDetail}
      />
    </>
  );
};
