import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Building,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  BarChart2,
  Sparkles,
  PieChart,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { NiftyStockAnalysisModal } from './NiftyStockAnalysisModal';
import { AiFundamentalAnalystPanel } from './AiFundamentalAnalystPanel';
import { fetchBatchLiveQuotes, fetchLiveQuote } from '../../services/liveMarketService';
import { subscribeMarketTable, fetchMarketTable, MASTER_NIFTY_500, MarketTableRow } from '../../services/marketDataTables';
import { updateRememberedPrice, getHydratedPrice, resolveLivePrice } from '../../services/priceMemoryStore';
import { formatIndianTime } from '../../utils/indianTime';

export interface StockConstituentItem {
  rank: number;
  id: string;
  name: string;
  symbol: string;
  yahooSymbol: string;
  exchange: 'NSE' | 'NASDAQ' | 'NYSE';
  sector: 'IT & Tech' | 'Banking & Finance' | 'Auto & EV' | 'Energy & Power' | 'FMCG & Consumer' | 'Pharma & Healthcare' | 'Metals & Mining' | 'Infrastructure' | 'Defense & Aerospace' | 'Capital Goods' | 'Chemicals & Fertilisers' | 'Realty & Construction' | 'PSU & Railways';
  tier: 'Nifty 50' | 'Nifty Next 50' | 'Nifty Midcap 150' | 'Nifty Smallcap 250' | 'Global Tech';
  price: number;
  currency: 'INR' | 'USD';
  weightagePct: number; // Weight in Nifty 50 or S&P 500
  change1d: number;
  high52w: number;
  low52w: number;
  peRatio: number;
  marketCap: string;
  isRealLive?: boolean;
}

export const StockConstituentsView: React.FC = () => {
  const { isLight } = useTheme();
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'NSE' | 'NASDAQ/NYSE'>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof StockConstituentItem>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStockForAnalysis, setSelectedStockForAnalysis] = useState<StockConstituentItem | null>(null);
  const [activeAnalystStock, setActiveAnalystStock] = useState<StockConstituentItem | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const itemsPerPage = 25;

  const [stocks, setStocks] = useState<StockConstituentItem[]>(() =>
    MASTER_NIFTY_500.map((m) => {
      const hydrated = getHydratedPrice({ ...m, price: m.price });
      return {
        rank: m.rank || 1,
        id: m.id,
        name: m.name,
        symbol: m.symbol,
        yahooSymbol: `${m.symbol}.NS`,
        exchange: (m.exchange as any) || 'NSE',
        sector: (m.sector as any) || 'Banking & Finance',
        tier: (m.tier as any) || 'Nifty 50',
        price: hydrated.price,
        currency: (m.currency as any) || 'INR',
        weightagePct: Number((100 / (m.rank || 1)).toFixed(2)),
        change1d: hydrated.change1d ?? m.change1d,
        high52w: m.high24h || Math.round(hydrated.price * 1.1),
        low52w: m.low24h || Math.round(hydrated.price * 0.9),
        peRatio: m.peRatio || 25,
        marketCap: String(m.marketCap || '₹10,000 Cr'),
      };
    })
  );

  // Subscribe to grouped Nifty 500 table in Firestore (single document batch read)
  useEffect(() => {
    const unsubscribe = subscribeMarketTable('nifty_500', (table: any) => {
      if (table && Array.isArray(table.data) && table.data.length > 0) {
        setStocks((prev) => {
          const existingMap = new Map(prev.map((s) => [s.symbol, s]));
          return table.data.map((m: any) => {
            const existing = existingMap.get(m.symbol);
            const incomingMs = m.dataTimestamp || m.updatedAtMs || (m.updatedAt ? new Date(m.updatedAt).getTime() : (table.dataTimestamp || table.updatedAtMs || new Date(table.updatedAt || 0).getTime()));
            const existingMs = (existing as any)?.updatedAtMs || 0;

            if (existing && existingMs > 0 && incomingMs <= existingMs) {
              return existing;
            }

            // Always resolve live price using memory store to ensure no bounce to hardcoded prices
            const validPrice = resolveLivePrice({ ...m, dataTimestamp: incomingMs, updatedAtMs: incomingMs }, existing?.price);
            if (validPrice > 0) {
              updateRememberedPrice(m.symbol, validPrice, incomingMs, { change1d: m.change1d });
            }
            return {
              rank: m.rank || 1,
              id: m.id,
              name: m.name,
              symbol: m.symbol,
              yahooSymbol: `${m.symbol}.NS`,
              exchange: (m.exchange as any) || 'NSE',
              sector: (m.sector as any) || 'Banking & Finance',
              tier: (m.tier as any) || 'Nifty 50',
              price: validPrice,
              currency: (m.currency as any) || 'INR',
              weightagePct: Number((100 / (m.rank || 1)).toFixed(2)),
              change1d: m.change1d,
              high52w: m.high24h || Math.round(validPrice * 1.1),
              low52w: m.low24h || Math.round(validPrice * 0.9),
              peRatio: m.peRatio || 25,
              marketCap: String(m.marketCap || '₹10,000 Cr'),
              isRealLive: true,
              updatedAtMs: incomingMs,
            } as any;
          });
        });
        const sourceTime = table.dataTimestamp || table.updatedAtMs || (table.updatedAt ? new Date(table.updatedAt).getTime() : Date.now());
        setLastRefreshed(formatIndianTime(sourceTime));
      }
    });

    return () => unsubscribe();
  }, []);

  const loadRealStockQuotes = async () => {
    setIsLoadingLive(true);
    try {
      const table = await fetchMarketTable('nifty_500');
      if (table && table.data) {
        setStocks((prev) => {
          const existingMap = new Map(prev.map((s) => [s.symbol, s]));
          return table.data.map((m: any) => {
            const existing = existingMap.get(m.symbol);
            const incomingMs = m.dataTimestamp || m.updatedAtMs || (table.dataTimestamp || table.updatedAtMs || Date.now());
            const price = resolveLivePrice({ ...m, dataTimestamp: incomingMs }, existing?.price);
            if (price > 0) {
              updateRememberedPrice(m.symbol, price, incomingMs, { change1d: m.change1d });
            }
            return {
              rank: m.rank || 1,
              id: m.id,
              name: m.name,
              symbol: m.symbol,
              yahooSymbol: `${m.symbol}.NS`,
              exchange: (m.exchange as any) || 'NSE',
              sector: (m.sector as any) || 'Banking & Finance',
              tier: (m.tier as any) || 'Nifty 50',
              price,
              currency: (m.currency as any) || 'INR',
              weightagePct: Number((100 / (m.rank || 1)).toFixed(2)),
              change1d: m.change1d,
              high52w: m.high24h || Math.round(price * 1.1),
              low52w: m.low24h || Math.round(price * 0.9),
              peRatio: m.peRatio || 25,
              marketCap: String(m.marketCap || '₹10,000 Cr'),
              isRealLive: true,
            };
          });
        });
        const sourceTime = table.dataTimestamp || table.updatedAtMs || (table.updatedAt ? new Date(table.updatedAt).getTime() : Date.now());
        setLastRefreshed(formatIndianTime(sourceTime));
      }
    } catch {
      // Keep state
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    loadRealStockQuotes();
    const timer = setInterval(loadRealStockQuotes, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredStocks = useMemo(() => {
    let list = stocks.filter((st) => {
      const matchesExchange =
        exchangeFilter === 'ALL' ||
        (exchangeFilter === 'NSE' && st.exchange === 'NSE') ||
        (exchangeFilter === 'NASDAQ/NYSE' && st.exchange !== 'NSE');
      const matchesTier = tierFilter === 'ALL' || st.tier === tierFilter;
      const matchesSector = sectorFilter === 'ALL' || st.sector === sectorFilter;
      const matchesSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesExchange && matchesTier && matchesSector && matchesSearch;
    });

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

    return list;
  }, [stocks, exchangeFilter, tierFilter, sectorFilter, searchQuery, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage) || 1;
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStocks.slice(start, start + itemsPerPage);
  }, [filteredStocks, currentPage]);

  const handleSort = (field: keyof StockConstituentItem) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCustomSearchAnalysis = async () => {
    if (!searchQuery.trim()) return;
    const sym = searchQuery.trim().toUpperCase();
    const existing = stocks.find((s) => s.symbol.toUpperCase() === sym);
    if (existing) {
      setSelectedStockForAnalysis(existing);
    } else {
      setIsLoadingLive(true);
      const yahooSym = sym.includes('.') ? sym : `${sym}.NS`;
      const live = await fetchLiveQuote(yahooSym);
      
      const dynamicStock: StockConstituentItem = {
        rank: 99,
        id: sym.toLowerCase(),
        name: `${sym} India`,
        symbol: sym,
        yahooSymbol: yahooSym,
        exchange: 'NSE',
        tier: 'Nifty Midcap 150',
        sector: 'Banking & Finance',
        price: live?.price || 845.50,
        currency: 'INR',
        weightagePct: 0.65,
        change1d: live?.changePct || 2.15,
        high52w: live?.high || 1020,
        low52w: live?.low || 520,
        peRatio: 32.5,
        marketCap: 'NSE Listed',
        isRealLive: Boolean(live?.price),
      };
      setSelectedStockForAnalysis(dynamicStock);
      setIsLoadingLive(false);
    }
  };

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
            <Building className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                🇮🇳 Nifty 500 & Global Stock Constituents Workstation
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold">
                NSE Nifty 500 • Nifty Midcap • Smallcap
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Search any Nifty stock symbol for instant technical indicators (RSI, Moving Averages), P/E valuations, shareholding pattern, and F&O derivatives analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <a
            href="https://eshan6704-marketapi2.hf.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 transition-all text-[11px]"
            title="Direct NSE Market API powered by HuggingFace"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>HF NSE Market API</span>
          </a>

          <a
            href="https://crypto.eshanpatel.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1.5 transition-all text-[11px]"
            title="Deployed Crypto Terminal & Web App"
          >
            <span>Crypto Terminal</span>
          </a>

          <button
            onClick={loadRealStockQuotes}
            disabled={isLoadingLive}
            className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span>{isLoadingLive ? 'Syncing Real NSE...' : 'Refresh Quotes'}</span>
            {lastRefreshed && <span className="text-[10px] text-orange-200/70">({lastRefreshed})</span>}
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="relative flex-1 min-w-[240px] flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearchAnalysis()}
              placeholder="Search or enter Nifty stock symbol (e.g., RELIANCE, HAL, CDSL, SUZLON, ZOMATO)..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-100'
              }`}
            />
          </div>
          <button
            onClick={handleCustomSearchAnalysis}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-neutral-950 font-black flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>Analyze Stock</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nifty Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border font-sans text-xs font-bold focus:outline-none focus:border-amber-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-orange-400'
            }`}
          >
            <option value="ALL">🇮🇳 Nifty Total Market (All Tiers)</option>
            <option value="Nifty 50">Nifty 50 (LargeCap)</option>
            <option value="Nifty Next 50">Nifty Next 50 (LargeCap)</option>
            <option value="Nifty Midcap 150">Nifty Midcap 150 (MidCap)</option>
            <option value="Nifty Smallcap 250">Nifty Smallcap 250 (SmallCap)</option>
            <option value="Nifty Microcap 250">Nifty Microcap 250 (MicroCap)</option>
            <option value="Global Tech">Global Tech MegaCaps</option>
          </select>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border font-sans text-xs font-bold focus:outline-none focus:border-amber-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-amber-300'
            }`}
          >
            <option value="ALL">All Sectors</option>
            <option value="IT & Tech">IT & Tech</option>
            <option value="Banking & Finance">Banking & Finance</option>
            <option value="Defense & Aerospace">Defense & Aerospace</option>
            <option value="Auto & EV">Auto & EV</option>
            <option value="Energy & Power">Energy & Power</option>
            <option value="FMCG & Consumer">FMCG & Consumer</option>
            <option value="Pharma & Healthcare">Pharma & Healthcare</option>
            <option value="Capital Goods">Capital Goods</option>
            <option value="PSU & Railways">PSU & Railways</option>
          </select>
        </div>
      </div>

      {/* AI FUNDAMENTAL ANALYST PANEL */}
      <AiFundamentalAnalystPanel
        stock={activeAnalystStock || stocks[0]}
        stocksList={stocks}
        onSelectStock={setActiveAnalystStock}
        onOpenFullModal={setSelectedStockForAnalysis}
      />

      {/* CONSTITUENTS TABLE */}
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className={`sticky top-0 z-10 text-[10px] uppercase font-bold tracking-wider border-b ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}>
              <th onClick={() => handleSort('rank')} className="py-2.5 px-3 cursor-pointer hover:text-amber-400">
                # <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
              </th>
              <th onClick={() => handleSort('name')} className="py-2.5 px-3 cursor-pointer hover:text-amber-400">
                Company & Symbol
              </th>
              <th onClick={() => handleSort('sector')} className="py-2.5 px-3 cursor-pointer hover:text-amber-400">
                Sector & Index Tier
              </th>
              <th onClick={() => handleSort('price')} className="py-2.5 px-3 text-right cursor-pointer hover:text-amber-400">
                Live Price
              </th>
              <th onClick={() => handleSort('change1d')} className="py-2.5 px-3 text-right cursor-pointer hover:text-amber-400">
                1D Change
              </th>
              <th className="py-2.5 px-3 text-right">P/E Ratio</th>
              <th className="py-2.5 px-3 text-right">Market Cap</th>
              <th className="py-2.5 px-3 text-center">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40">
            {paginatedStocks.map((st) => {
              const isUp = st.change1d >= 0;
              const isSelectedForAnalyst = activeAnalystStock?.symbol === st.symbol;

              return (
                <tr
                  key={st.id}
                  onClick={() => setActiveAnalystStock(st)}
                  className={`transition-colors cursor-pointer ${
                    isSelectedForAnalyst
                      ? 'bg-amber-500/15 border-l-4 border-l-amber-500 font-bold'
                      : 'hover:bg-neutral-800/30'
                  }`}
                >
                  <td className="py-2.5 px-3 text-neutral-400 font-bold">{st.rank}</td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold font-sans text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {st.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">
                        {st.symbol}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-sans text-neutral-300">{st.sector}</div>
                    <span className="text-[10px] text-amber-400/80 font-mono font-bold">{st.tier}</span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-black text-white text-sm">
                    {st.currency === 'INR' ? '₹' : '$'}{st.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 font-extrabold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{st.change1d.toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right text-purple-300 font-bold">
                    {st.peRatio}x
                  </td>

                  <td className="py-2.5 px-3 text-right text-neutral-300 font-bold">
                    {st.marketCap}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAnalystStock(st);
                        setSelectedStockForAnalysis(st);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/40 font-bold text-[11px] flex items-center gap-1 mx-auto transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* STOCK ANALYSIS MODAL */}
      <NiftyStockAnalysisModal
        isOpen={Boolean(selectedStockForAnalysis)}
        stock={selectedStockForAnalysis}
        onClose={() => setSelectedStockForAnalysis(null)}
      />
    </div>
  );
};
