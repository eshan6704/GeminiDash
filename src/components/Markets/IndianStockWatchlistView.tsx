import React, { useState, useMemo } from 'react';
import { useIndianStocks, IndianStock } from '../../hooks/useIndianStocks';
import { useTheme } from '../../context/ThemeContext';
import {
  Star,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
  TrendingUpIcon,
  Plus,
  Minus,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';
import { GlobalIndexDetailModal, GlobalIndexDetailItem } from '../Modals/GlobalIndexDetailModal';

export const IndianStockWatchlistView: React.FC = () => {
  const { colors, isLight } = useTheme();
  const {
    stocks,
    watchlist,
    toggleWatchlist,
    isUpdating,
    getAnalysis,
    fetchLivePrices,
  } = useIndianStocks();

  const [filterMode, setFilterMode] = useState<'WATCHLIST' | 'ALL'>('WATCHLIST');
  const [capFilter, setCapFilter] = useState<'ALL' | 'LARGECAP' | 'MIDCAP' | 'SMALLCAP' | 'MICROCAP'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedStock, setSelectedStock] = useState<IndianStock | null>(null);

  // Detail Modal State
  const [detailItem, setDetailItem] = useState<GlobalIndexDetailItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // List of all sectors for filters
  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector));
    return ['ALL', ...Array.from(set)];
  }, [stocks]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // 1. Watchlist mode filter
      if (filterMode === 'WATCHLIST' && !watchlist.includes(stock.symbol)) {
        return false;
      }
      // 2. Cap Category Filter
      if (capFilter !== 'ALL' && stock.marketCapCategory !== capFilter) {
        return false;
      }
      // 3. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = stock.name.toLowerCase().includes(query);
        const matchesSymbol = stock.symbol.toLowerCase().includes(query);
        if (!matchesName && !matchesSymbol) return false;
      }
      // 4. Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) {
        return false;
      }
      return true;
    });
  }, [stocks, watchlist, filterMode, capFilter, searchQuery, selectedSector]);

  // Set default selected stock if null
  React.useEffect(() => {
    if (!selectedStock && filteredStocks.length > 0) {
      setSelectedStock(filteredStocks[0]);
    }
  }, [filteredStocks, selectedStock]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* WATCHLIST HEADER AND CONTROL BAR */}
      <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Indian Stock Watchlist & Market Monitor</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add NSE heavyweight constituents to your personal list and view live technical metrics with buy/sell holding targets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLivePrices}
              disabled={isUpdating}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              } disabled:opacity-50`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live Yahoo</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticker or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
              }`}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('WATCHLIST')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                filterMode === 'WATCHLIST'
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                  : isLight
                  ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  : 'bg-neutral-950 text-slate-300 hover:bg-neutral-900 border-neutral-800'
              }`}
            >
              ★ Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                filterMode === 'ALL'
                  ? 'bg-orange-500 text-neutral-950 border-orange-400 shadow-md font-black'
                  : isLight
                  ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  : 'bg-neutral-950 text-slate-300 hover:bg-neutral-900 border-neutral-800'
              }`}
            >
              🌐 Browse All ({stocks.length})
            </button>
          </div>

          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
              }`}
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === 'ALL' ? '📂 All Sectors' : `📂 ${sector}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NIFTY CAP SPECTRUM FILTERS (LARGE / MID / SMALL / MICRO) */}
        <div className="flex items-center gap-1.5 pt-3 border-t overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Market Cap:
          </span>
          {[
            { id: 'ALL', label: 'All Spectrum' },
            { id: 'LARGECAP', label: 'LargeCap (Nifty 100)' },
            { id: 'MIDCAP', label: 'MidCap (Midcap 150)' },
            { id: 'SMALLCAP', label: 'SmallCap (Smallcap 250)' },
            { id: 'MICROCAP', label: 'MicroCap (Microcap 250)' },
          ].map((cap) => (
            <button
              key={cap.id}
              onClick={() => setCapFilter(cap.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                capFilter === cap.id
                  ? 'bg-orange-500 text-white font-black shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300'
              }`}
            >
              {cap.label}
            </button>
          ))}
        </div>
      </div>

      {/* WATCHLIST MONITORS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* LIST TABLE SECTION (LEFT 2 COLUMNS) */}
        <div className={`lg:col-span-2 p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg space-y-2`}>
          {filteredStocks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No matching Indian Stocks found. Try resetting filters or adding symbols to your Watchlist.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800/40 pb-2 text-[10px] uppercase text-slate-400">
                    <th className="py-2">Fav</th>
                    <th className="py-2">Ticker & Name</th>
                    <th className="py-2">Sector</th>
                    <th className="py-2 text-right">Price (INR)</th>
                    <th className="py-2 text-right">1D Change</th>
                    <th className="py-2 text-center hidden md:table-cell">52W Range Position</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/30">
                  {filteredStocks.map((stock) => {
                    const isStarred = watchlist.includes(stock.symbol);
                    const isSelected = selectedStock?.symbol === stock.symbol;

                    // Calculate range position percentage
                    const rangeTotal = stock.high52w - stock.low52w;
                    const positionInRange = ((stock.price - stock.low52w) / rangeTotal) * 100;
                    const clampedPosition = Math.min(100, Math.max(0, positionInRange));

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => setSelectedStock(stock)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-500/10 hover:bg-orange-500/15'
                            : 'hover:bg-neutral-800/10'
                        }`}
                      >
                        <td className="py-3 pl-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(stock.symbol);
                            }}
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </td>

                        <td className="py-3">
                          <div className="font-bold">{stock.symbol}</div>
                          <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                            {stock.name}
                          </div>
                        </td>

                        <td className="py-3 text-[10px] text-slate-400 font-mono">
                          {stock.sector}
                        </td>

                        <td className="py-3 text-right font-mono font-black text-amber-500">
                          ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>

                        <td className={`py-3 text-right font-mono font-bold ${
                          stock.change1d >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {stock.change1d >= 0 ? '+' : ''}{stock.change1d.toFixed(2)}%
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell text-center">
                          <div className="flex items-center gap-1 text-[9px] font-mono justify-center">
                            <span>L: {stock.low52w}</span>
                            <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden relative border border-neutral-700/50">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                                style={{ width: `${clampedPosition}%` }}
                              />
                            </div>
                            <span>H: {stock.high52w}</span>
                          </div>
                        </td>

                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStock(stock);
                              setDetailItem({
                                id: stock.symbol.toLowerCase(),
                                name: stock.name,
                                symbol: stock.symbol,
                                yahooSymbol: `${stock.symbol}.NS`,
                                category: `${stock.sector} Stock`,
                                region: 'India (NSE)',
                                price: stock.price,
                                change1d: stock.change1d,
                                change1dPts: Number((stock.price * (stock.change1d / 100)).toFixed(2)),
                                high24h: stock.high52w,
                                low24h: stock.low52w,
                                status: 'OPEN',
                                currency: 'INR',
                                peRatio: stock.peRatio,
                                isRealLive: true,
                              });
                              setIsDetailOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-200 transition-all text-[10px] font-mono font-bold flex items-center gap-1 ml-auto cursor-pointer"
                            title="Open Trend Chart & AI Insights"
                          >
                            <BarChart2 className="w-3 h-3" />
                            <span>Trend & AI</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TARGET & ADVISORY REPORT DRAWER (RIGHT 1 COLUMN) */}
        <div className="space-y-4">
          {selectedStock ? (
            (() => {
              const analysis = getAnalysis(selectedStock);
              return (
                <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg space-y-4 bg-gradient-to-b from-neutral-900 to-neutral-950/40`}>
                  <div className="border-b border-neutral-800/40 pb-2 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                        Stock Technical Report
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        {selectedStock.name}
                      </h4>
                      <div className="text-xs font-mono font-black text-orange-500">
                        {selectedStock.symbol} • NSE
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-xs font-black ${
                      analysis.rating === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : analysis.rating === 'SELL'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                    }`}>
                      {analysis.rating}
                    </span>
                  </div>

                  {/* ANALYSIS SCORES */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/40">
                      <span className="text-[10px] text-slate-400 font-bold block">Consensus Rating</span>
                      <span className={`text-xs font-black block mt-0.5 uppercase ${
                        analysis.rating === 'BUY' ? 'text-emerald-400' : analysis.rating === 'SELL' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {analysis.rating} recomendation
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/40">
                      <span className="text-[10px] text-slate-400 font-bold block">Advisory Score</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="font-extrabold text-white">{analysis.score}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* ADVISORY REASONING */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Investment Rationale
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-neutral-950/30 p-3 rounded-lg border border-neutral-800/30 italic">
                      "{analysis.reasoning}"
                    </p>
                  </div>

                  {/* TARGET PRICES GRID */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Calculated Price Levels
                    </span>

                    <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-red-950/10 border border-red-500/20 flex items-center justify-between">
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <Minus className="w-3 h-3" /> Stop Loss
                        </span>
                        <span className="font-extrabold text-slate-200">₹{analysis.stopLoss}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-950/50 border border-neutral-800/30 flex items-center justify-between">
                        <span className="text-slate-300">Live Price</span>
                        <span className="font-extrabold text-amber-400">₹{selectedStock.price.toFixed(1)}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/10 border border-emerald-500/20 flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Target Price 1
                        </span>
                        <span className="font-extrabold text-slate-200">₹{analysis.target1}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                        <span className="text-teal-400 font-bold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Target Price 2
                        </span>
                        <span className="font-extrabold text-slate-200">₹{analysis.target2}</span>
                      </div>
                    </div>
                  </div>

                  {/* LAUNCH FULL HISTORICAL TREND MODAL BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setDetailItem({
                        id: selectedStock.symbol.toLowerCase(),
                        name: selectedStock.name,
                        symbol: selectedStock.symbol,
                        yahooSymbol: `${selectedStock.symbol}.NS`,
                        category: `${selectedStock.sector} Stock`,
                        region: 'India (NSE)',
                        price: selectedStock.price,
                        change1d: selectedStock.change1d,
                        change1dPts: Number((selectedStock.price * (selectedStock.change1d / 100)).toFixed(2)),
                        high24h: selectedStock.high52w,
                        low24h: selectedStock.low52w,
                        status: 'OPEN',
                        currency: 'INR',
                        peRatio: selectedStock.peRatio,
                        isRealLive: true,
                      });
                      setIsDetailOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:from-orange-400 hover:to-amber-400 transition-all cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Open Historical Trend & Gemini AI</span>
                  </button>

                  {/* CONSTITUENT VALUATION HIGHLIGHTS */}
                  <div className="space-y-1.5 text-xs border-t border-neutral-800/30 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Valuation Indicators
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="flex justify-between p-1.5 border border-neutral-800/20 bg-neutral-950/20 rounded">
                        <span className="text-slate-400">Sector P/E:</span>
                        <span className="font-bold text-slate-200">{selectedStock.peRatio}</span>
                      </div>
                      <div className="flex justify-between p-1.5 border border-neutral-800/20 bg-neutral-950/20 rounded">
                        <span className="text-slate-400">Cap Type:</span>
                        <span className="font-bold text-orange-400">Largecap</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Select any Indian stock constituent from the list to view its real-time Technical Advisory Report.
            </div>
          )}
        </div>
      </div>

      {/* WATCHLIST ASSET DETAIL MODAL */}
      <GlobalIndexDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
      />
    </div>
  );
};
