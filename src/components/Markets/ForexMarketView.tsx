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
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { fetchBatchLiveQuotes } from '../../services/liveMarketService';
import { subscribeMarketTable, fetchMarketTable, MASTER_FOREX } from '../../services/marketDataTables';
import { updateRememberedPrice, getHydratedPrice, resolveLivePrice } from '../../services/priceMemoryStore';
import { formatIndianTime } from '../../utils/indianTime';
import { GlobalIndexDetailModal, GlobalIndexDetailItem } from '../Modals/GlobalIndexDetailModal';

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
  currency?: string;
  isRealLive?: boolean;
}

export const ForexMarketView: React.FC = () => {
  const { isLight, theme } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lotSizeInput, setLotSizeInput] = useState<number>(1.0); // 1 Standard Lot = 100,000 units
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Detail Modal state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GlobalIndexDetailItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [pairs, setPairs] = useState<ForexPair[]>(() =>
    MASTER_FOREX.map((m) => {
      const hydrated = getHydratedPrice({ ...m, price: m.price });
      const spreadPips = m.symbol.includes('INR') ? 2.5 : 1.0;
      const halfSpread = (spreadPips * (m.symbol.includes('JPY') ? 0.01 : 0.0001)) / 2;
      return {
        id: m.id.toLowerCase(),
        pair: m.symbol,
        yahooSymbol: `${m.symbol.replace('/', '')}=X`,
        category: (m.category as any) || 'Major',
        bid: Number((hydrated.price - halfSpread).toFixed(4)),
        ask: Number((hydrated.price + halfSpread).toFixed(4)),
        spreadPips,
        change1d: hydrated.change1d ?? m.change1d,
        high24h: m.high24h || hydrated.price,
        low24h: m.low24h || hydrated.price,
        currency: m.symbol.split('/')[1] || 'USD',
      };
    })
  );

  // Subscribe to grouped Forex table in Firestore (batch format)
  useEffect(() => {
    const unsub = subscribeMarketTable('forex', (table) => {
      if (table && table.data && table.data.length > 0) {
        setPairs((prev) => {
          const existingMap = new Map(prev.map((p) => [p.pair, p]));
          return table.data.map((m) => {
            const existing = existingMap.get(m.symbol);
            const incomingMs = m.dataTimestamp || m.updatedAtMs || (m.updatedAt ? new Date(m.updatedAt).getTime() : (table.dataTimestamp || table.updatedAtMs || new Date(table.updatedAt || 0).getTime()));
            const existingMs = (existing as any)?.updatedAtMs || 0;

            if (existing && existingMs > 0 && incomingMs <= existingMs) {
              return existing;
            }

            const spreadPips = m.symbol.includes('INR') ? 2.5 : 1.0;
            const halfSpread = (spreadPips * (m.symbol.includes('JPY') ? 0.01 : 0.0001)) / 2;
            const validPrice = resolveLivePrice({ ...m, dataTimestamp: incomingMs, updatedAtMs: incomingMs }, existing ? existing.bid + halfSpread : undefined);
            if (validPrice > 0) {
              updateRememberedPrice(m.symbol, validPrice, incomingMs, { change1d: m.change1d });
            }
            return {
              id: m.id.toLowerCase(),
              pair: m.symbol,
              yahooSymbol: `${m.symbol.replace('/', '')}=X`,
              category: (m.category as any) || 'Major',
              bid: Number((validPrice - halfSpread).toFixed(4)),
              ask: Number((validPrice + halfSpread).toFixed(4)),
              spreadPips,
              change1d: m.change1d,
              high24h: m.high24h || validPrice,
              low24h: m.low24h || validPrice,
              currency: m.symbol.split('/')[1] || 'USD',
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
        });
        const sourceTime = table.dataTimestamp || table.updatedAtMs || (table.updatedAt ? new Date(table.updatedAt).getTime() : Date.now());
        setLastRefreshed(formatIndianTime(sourceTime));
      }
    });

    return () => unsub();
  }, []);

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
              change1d: live.changePct !== undefined ? live.changePct : p.change1d,
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
    const interval = setInterval(loadRealForexQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePairClick = (p: ForexPair) => {
    setSelectedItemForDetail({
      id: p.id,
      name: `${p.pair} Currency Pair`,
      symbol: p.pair,
      yahooSymbol: p.yahooSymbol,
      category: `${p.category} Forex Pair`,
      region: 'Global Currency Markets',
      price: (p.bid + p.ask) / 2,
      change1d: p.change1d,
      change1dPts: Number((((p.bid + p.ask) / 2) * (p.change1d / 100)).toFixed(4)),
      high24h: p.high24h,
      low24h: p.low24h,
      status: 'OPEN',
      currency: p.currency || 'USD',
      isRealLive: p.isRealLive,
    });
    setIsDetailModalOpen(true);
  };

  const filteredPairs = pairs.filter((item) => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.pair.toLowerCase().includes(searchQuery.toLowerCase());
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
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold tracking-wide">
                  Forex Currency Exchange Markets & Cross Rates
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                  style={{
                    backgroundColor: 'var(--theme-accent-light)',
                    borderColor: 'var(--theme-accent-border)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  Institutional Spreads (Pips)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Click any Forex pair for Trend Chart & AI Insights</span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Real-time Bid/Ask rates, Pip value calculator, Central bank policy rates, and currency strength
              </p>
            </div>
          </div>

          {/* Central Bank Rates Summary Bar */}
          <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
            <span className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border)' }}>FED: <strong>4.75%</strong></span>
            <span className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border)' }}>ECB: <strong>3.25%</strong></span>
            <span className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border)' }}>BOE: <strong>4.75%</strong></span>
            <span className="px-2 py-1 rounded border bg-amber-50 text-amber-800 border-amber-300">RBI: <strong>6.50%</strong></span>
            <span className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border)' }}>BOJ: <strong>0.25%</strong></span>

            <button
              onClick={loadRealForexQuotes}
              disabled={isLoadingLive}
              className="px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer hover:bg-slate-100"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
              title="Refresh Forex Live Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isLoadingLive ? 'Syncing...' : 'Live Quotes'}</span>
            </button>
          </div>
        </div>

        {/* FILTER & PIP CALCULATOR BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forex pair (e.g. EUR/USD, USD/INR, GBP/JPY)..."
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
              {['ALL', 'Major', 'Minor Cross', 'Emerging'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    categoryFilter === c
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: categoryFilter === c ? '#059669' : 'transparent',
                    color: categoryFilter === c ? '#ffffff' : 'inherit',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-1.5 p-1.5 rounded-xl border text-[11px]"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span style={{ color: 'var(--theme-text-secondary)' }}>Lot Size:</span>
              <input
                type="number"
                step="0.1"
                value={lotSizeInput}
                onChange={(e) => setLotSizeInput(parseFloat(e.target.value) || 1.0)}
                className="w-14 border text-center rounded px-1 font-bold focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
              <span className="opacity-70 text-[10px]">100k Units</span>
            </div>
          </div>
        </div>

        {/* FOREX PAIRS TABLE */}
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto pr-1">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr
                className="sticky top-0 z-10 text-[10px] uppercase font-bold tracking-wider border-b"
                style={{
                  backgroundColor: 'var(--theme-bg-card-subtle)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-secondary)',
                }}
              >
                <th className="py-2.5 px-3">Currency Pair</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Bid (Sell)</th>
                <th className="py-2.5 px-3 text-right text-rose-600">Ask (Buy)</th>
                <th className="py-2.5 px-3 text-right text-amber-600">Spread (Pips)</th>
                <th className="py-2.5 px-3 text-right">Pip Value ($ / 10 Pips)</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-center">Action / Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--theme-border-subtle)' }}>
              {filteredPairs.map((p) => {
                const isUp = p.change1d >= 0;
                const pipValueStdLot = p.pair.includes('JPY') ? (100000 / p.bid) * 0.01 * lotSizeInput : 10 * lotSizeInput;

                return (
                  <tr
                    key={p.id}
                    onClick={() => handlePairClick(p)}
                    className="transition-colors hover:bg-emerald-500/5 cursor-pointer group"
                    title="Click to view historical trend chart & Gemini AI insights"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm font-sans group-hover:text-emerald-600 transition-colors">
                          {p.pair}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] border"
                          style={{
                            backgroundColor: 'var(--theme-bg-card-subtle)',
                            borderColor: 'var(--theme-border-subtle)',
                            color: 'var(--theme-text-secondary)',
                          }}
                        >
                          {p.category}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-emerald-600 text-sm">
                      {p.bid.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 4)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-rose-600 text-sm">
                      {p.ask.toFixed(p.pair.includes('JPY') || p.pair.includes('INR') ? 2 : 4)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                      {p.spreadPips.toFixed(1)} pips
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                      ${(pipValueStdLot * 10).toFixed(2)} USD
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{p.change1d.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] font-bold text-emerald-600 underline opacity-80 group-hover:opacity-100">
                        View Chart & AI →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOREX DETAIL MODAL */}
      <GlobalIndexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemForDetail}
      />
    </>
  );
};
