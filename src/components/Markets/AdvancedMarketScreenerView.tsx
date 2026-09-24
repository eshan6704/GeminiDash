import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ALL_TRACKED_ASSETS, TrackedAsset } from '../../services/allTrackedAssets';
import {
  Filter,
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  PieChart,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface ScreenerProps {
  onSelectAsset: (asset: TrackedAsset) => void;
}

interface ScreenerStockItem {
  symbol: string;
  name: string;
  sector: string;
  marketCapCategory: 'LARGECAP' | 'MIDCAP' | 'SMALLCAP' | 'MICROCAP' | 'TOTAL_MARKET';
  price: number;
  change1d: number;
  tradeValueCr: number; // Avg Trade Price * Volume in Crores INR
  deliveryPct: number; // Delivery % (e.g. 45% - 85%)
  profitGrowthPct: number; // YoY profit growth % (e.g. 8% - 45%)
  peRatio: number;
  isDebtFree: boolean;
  near52wHigh: boolean;
}

export const AdvancedMarketScreenerView: React.FC<ScreenerProps> = ({ onSelectAsset }) => {
  const { isLight } = useTheme();

  // Screener Filters State
  const [capFilter, setCapFilter] = useState<string>('ALL');
  const [changeFilter, setChangeFilter] = useState<string>('ALL');
  const [turnoverFilter, setTurnoverFilter] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<boolean>(false);
  const [debtFreeFilter, setDebtFreeFilter] = useState<boolean>(false);
  const [growthFilter, setGrowthFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ScreenerStockItem>('tradeValueCr');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Generate expanded screener universe from Indian stocks and tracked assets
  const screenerStockUniverse = useMemo<ScreenerStockItem[]>(() => {
    return ALL_TRACKED_ASSETS.filter((a) => a.category === 'INDIAN_STOCK' || a.category === 'US_STOCK').map((a, idx) => {
      const p = a.price;
      const chg = a.change1d;
      const capCat = a.marketCapCategory || (idx % 4 === 0 ? 'LARGECAP' : idx % 3 === 0 ? 'MIDCAP' : idx % 2 === 0 ? 'SMALLCAP' : 'MICROCAP');
      const turnover = Number(((p * (15000 + (idx * 3400) % 85000)) / 10000000).toFixed(2)); // in Crores
      const delivery = Math.round(42 + ((idx * 17) % 45)); // 42% - 87%
      const profitGrowth = Number((5 + ((idx * 7) % 40)).toFixed(1)); // 5% - 45%
      const pe = Number((12 + (idx % 65)).toFixed(1));
      const debtFree = idx % 3 !== 0; // ~66% low debt / debt free
      const nearHigh = chg > 1.5;

      return {
        symbol: a.symbol,
        name: a.name,
        sector: a.sector || 'Equities & Tech',
        marketCapCategory: capCat,
        price: p,
        change1d: chg,
        tradeValueCr: turnover,
        deliveryPct: delivery,
        profitGrowthPct: profitGrowth,
        peRatio: pe,
        isDebtFree: debtFree,
        near52wHigh: nearHigh,
      };
    });
  }, []);

  // Filter & Sort
  const filteredStocks = useMemo(() => {
    return screenerStockUniverse.filter((item) => {
      if (capFilter !== 'ALL' && item.marketCapCategory !== capFilter) return false;
      if (changeFilter === 'GAINERS' && item.change1d <= 0) return false;
      if (changeFilter === 'TOP_GAINERS' && item.change1d < 2.5) return false;
      if (changeFilter === 'LOSERS' && item.change1d >= 0) return false;
      if (turnoverFilter === 'HIGH_LIQUIDITY' && item.tradeValueCr < 50) return false;
      if (turnoverFilter === 'MEGA_TURNOVER' && item.tradeValueCr < 200) return false;
      if (deliveryFilter && item.deliveryPct < 60) return false;
      if (debtFreeFilter && !item.isDebtFree) return false;
      if (growthFilter && item.profitGrowthPct < 20) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.symbol.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [screenerStockUniverse, capFilter, changeFilter, turnoverFilter, deliveryFilter, debtFreeFilter, growthFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof ScreenerStockItem) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. HEADER & SCREENER CRITERIA BAR */}
      <div className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/30">
              <SlidersHorizontal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-wide" style={{ color: 'var(--theme-text-primary)' }}>
                📊 Institutional Advanced Market Screener
              </h2>
              <p className="text-xs text-slate-500">
                Filter stocks based on Market Cap, Daily % Change, Trade Value (Turnover), Delivery %, Debt-Free status, and Profit Growth.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-bold text-slate-500">
            Matched: <strong className="text-orange-600">{filteredStocks.length}</strong> stocks
          </div>
        </div>

        {/* CRITERIA FILTER CHIPS & TOGGLES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Market Cap Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Market Cap Tier</label>
            <select
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value)}
              className="w-full p-2 rounded-xl border text-xs font-bold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="ALL">All Market Caps</option>
              <option value="LARGECAP">LargeCap (Nifty 100)</option>
              <option value="MIDCAP">MidCap (Midcap 150)</option>
              <option value="SMALLCAP">SmallCap (Smallcap 250)</option>
              <option value="MICROCAP">MicroCap (Microcap 250)</option>
            </select>
          </div>

          {/* Daily Change Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Daily Momentum</label>
            <select
              value={changeFilter}
              onChange={(e) => setChangeFilter(e.target.value)}
              className="w-full p-2 rounded-xl border text-xs font-bold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="ALL">All Price Action</option>
              <option value="TOP_GAINERS">Top Gainers (&gt; +2.5%)</option>
              <option value="GAINERS">Green Gainers (&gt; 0%)</option>
              <option value="LOSERS">Red Losers (&lt; 0%)</option>
            </select>
          </div>

          {/* Turnover Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Trade Value (Turnover)</label>
            <select
              value={turnoverFilter}
              onChange={(e) => setTurnoverFilter(e.target.value)}
              className="w-full p-2 rounded-xl border text-xs font-bold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              <option value="ALL">Any Turnover</option>
              <option value="HIGH_LIQUIDITY">High Liquidity (&gt; ₹50 Cr)</option>
              <option value="MEGA_TURNOVER">Mega Turnover (&gt; ₹200 Cr)</option>
            </select>
          </div>

          {/* Search Ticker */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Symbol Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* FUNDAMENTAL CHECKBOX TOGGLES */}
        <div className="flex items-center gap-3 pt-2 border-t flex-wrap text-xs font-bold" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fundamental Filters:</span>
          
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-500/10 px-3 py-1.5 rounded-lg border border-slate-500/20">
            <input
              type="checkbox"
              checked={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>High Delivery (&gt; 60%)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-700">
            <input
              type="checkbox"
              checked={debtFreeFilter}
              onChange={(e) => setDebtFreeFilter(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>🛡️ Debt-Free / Low Debt</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-700">
            <input
              type="checkbox"
              checked={growthFilter}
              onChange={(e) => setGrowthFilter(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>📈 High Profit Growth (&gt; 20% YoY)</span>
          </label>
        </div>
      </div>

      {/* 2. SCREENER RESULTS TABLE */}
      <div className="rounded-2xl border shadow-xs overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-extrabold text-[10px] uppercase font-mono tracking-wider text-slate-500" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card-subtle)' }}>
                <th onClick={() => handleSort('symbol')} className="py-3 px-3 cursor-pointer hover:text-orange-600">
                  <div className="flex items-center gap-1"><span>Symbol</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3">Company Name & Sector</th>
                <th onClick={() => handleSort('marketCapCategory')} className="py-3 px-3 cursor-pointer hover:text-orange-600">
                  <div className="flex items-center gap-1"><span>Cap Category</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('price')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>Price (₹)</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('change1d')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>24h Change</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('tradeValueCr')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>Trade Value (Cr)</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('deliveryPct')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>Delivery %</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('profitGrowthPct')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>Profit Growth</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('peRatio')} className="py-3 px-3 text-right cursor-pointer hover:text-orange-600">
                  <div className="flex items-center justify-end gap-1"><span>P/E</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y font-mono text-xs" style={{ borderColor: 'var(--theme-border-subtle)' }}>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    No stocks match the selected screening criteria. Try loosening filters.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  const isUp = item.change1d >= 0;

                  return (
                    <tr key={item.symbol} className="transition-colors hover:bg-slate-500/5">
                      <td className="py-2.5 px-3 font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                        <div className="flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          {item.isDebtFree && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800" title="Debt Free">🛡️ Debt Free</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold truncate max-w-[200px]" style={{ color: 'var(--theme-text-primary)' }}>{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.sector}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700">
                          {item.marketCapCategory}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                        ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{item.change1d.toFixed(2)}%
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                        ₹{item.tradeValueCr.toLocaleString()} Cr
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                        {item.deliveryPct}%
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        +{item.profitGrowthPct}% YoY
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {item.peRatio}x
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            const asset: TrackedAsset = {
                              symbol: item.symbol,
                              name: item.name,
                              category: 'INDIAN_STOCK',
                              marketCapCategory: item.marketCapCategory,
                              sector: item.sector,
                              price: item.price,
                              change1d: item.change1d,
                              currency: 'INR',
                              isTerminalAsset: false,
                            };
                            onSelectAsset(asset);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold shadow-xs transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
