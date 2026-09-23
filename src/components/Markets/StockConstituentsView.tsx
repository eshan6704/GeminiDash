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
  const [sortField, setSortField] = useState<keyof StockConstituentItem>('weightagePct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStockForAnalysis, setSelectedStockForAnalysis] = useState<StockConstituentItem | null>(null);
  const [activeAnalystStock, setActiveAnalystStock] = useState<StockConstituentItem | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const itemsPerPage = 25;

  const [stocks, setStocks] = useState<StockConstituentItem[]>([
    // NIFTY 50 HEAVYWEIGHTS
    { rank: 1, id: 'hdfcbank', name: 'HDFC Bank Ltd', symbol: 'HDFCBANK', yahooSymbol: 'HDFCBANK.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Banking & Finance', price: 1785.40, currency: 'INR', weightagePct: 11.45, change1d: 1.12, high52w: 1810, low52w: 1365, peRatio: 19.8, marketCap: '₹13.6 Lakh Cr' },
    { rank: 2, id: 'reliance', name: 'Reliance Industries', symbol: 'RELIANCE', yahooSymbol: 'RELIANCE.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Energy & Power', price: 2980.50, currency: 'INR', weightagePct: 9.85, change1d: 0.85, high52w: 3215, low52w: 2220, peRatio: 26.4, marketCap: '₹20.2 Lakh Cr' },
    { rank: 3, id: 'icicibank', name: 'ICICI Bank Ltd', symbol: 'ICICIBANK', yahooSymbol: 'ICICIBANK.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Banking & Finance', price: 1265.80, currency: 'INR', weightagePct: 7.92, change1d: 0.94, high52w: 1310, low52w: 920, peRatio: 18.2, marketCap: '₹8.9 Lakh Cr' },
    { rank: 4, id: 'infosys', name: 'Infosys Ltd', symbol: 'INFY', yahooSymbol: 'INFY.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'IT & Tech', price: 1920.30, currency: 'INR', weightagePct: 5.84, change1d: 1.85, high52w: 1990, low52w: 1350, peRatio: 27.5, marketCap: '₹7.9 Lakh Cr' },
    { rank: 5, id: 'tcs', name: 'Tata Consultancy Services', symbol: 'TCS', yahooSymbol: 'TCS.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'IT & Tech', price: 4280.00, currency: 'INR', weightagePct: 4.12, change1d: 1.35, high52w: 4580, low52w: 3400, peRatio: 31.0, marketCap: '₹15.5 Lakh Cr' },
    { rank: 6, id: 'itc', name: 'ITC Ltd', symbol: 'ITC', yahooSymbol: 'ITC.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'FMCG & Consumer', price: 495.20, currency: 'INR', weightagePct: 3.95, change1d: -0.25, high52w: 528, low52w: 399, peRatio: 28.1, marketCap: '₹6.2 Lakh Cr' },
    { rank: 7, id: 'lnt', name: 'Larsen & Toubro', symbol: 'LT', yahooSymbol: 'LT.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Infrastructure', price: 3640.10, currency: 'INR', weightagePct: 3.65, change1d: 0.62, high52w: 3920, low52w: 2980, peRatio: 33.2, marketCap: '₹5.0 Lakh Cr' },
    { rank: 8, id: 'bhartiairtel', name: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', yahooSymbol: 'BHARTIARTL.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'IT & Tech', price: 1680.50, currency: 'INR', weightagePct: 3.42, change1d: 0.45, high52w: 1750, low52w: 910, peRatio: 48.0, marketCap: '₹9.8 Lakh Cr' },
    { rank: 9, id: 'tatamotors', name: 'Tata Motors Ltd', symbol: 'TATAMOTORS', yahooSymbol: 'TATAMOTORS.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Auto & EV', price: 985.60, currency: 'INR', weightagePct: 2.85, change1d: 1.95, high52w: 1175, low52w: 610, peRatio: 11.2, marketCap: '₹3.6 Lakh Cr' },
    { rank: 10, id: 'sbi', name: 'State Bank of India', symbol: 'SBIN', yahooSymbol: 'SBIN.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Banking & Finance', price: 842.10, currency: 'INR', weightagePct: 2.75, change1d: 0.72, high52w: 912, low52w: 560, peRatio: 10.8, marketCap: '₹7.5 Lakh Cr' },
    { rank: 11, id: 'axisbank', name: 'Axis Bank Ltd', symbol: 'AXISBANK', yahooSymbol: 'AXISBANK.NS', exchange: 'NSE', tier: 'Nifty 50', sector: 'Banking & Finance', price: 1195.40, currency: 'INR', weightagePct: 2.52, change1d: 0.58, high52w: 1340, low52w: 930, peRatio: 13.5, marketCap: '₹3.7 Lakh Cr' },

    // NIFTY NEXT 50 & DEFENSE / PSU STARS
    { rank: 12, id: 'hal', name: 'Hindustan Aeronautics', symbol: 'HAL', yahooSymbol: 'HAL.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'Defense & Aerospace', price: 4520.00, currency: 'INR', weightagePct: 1.85, change1d: 2.85, high52w: 5670, low52w: 1950, peRatio: 38.5, marketCap: '₹3.0 Lakh Cr' },
    { rank: 13, id: 'bel', name: 'Bharat Electronics', symbol: 'BEL', yahooSymbol: 'BEL.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'Defense & Aerospace', price: 285.40, currency: 'INR', weightagePct: 1.62, change1d: 3.12, high52w: 340, low52w: 128, peRatio: 45.0, marketCap: '₹2.1 Lakh Cr' },
    { rank: 14, id: 'irfc', name: 'Indian Railway Finance', symbol: 'IRFC', yahooSymbol: 'IRFC.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'PSU & Railways', price: 162.80, currency: 'INR', weightagePct: 1.42, change1d: 1.85, high52w: 229, low52w: 72, peRatio: 31.0, marketCap: '₹2.1 Lakh Cr' },
    { rank: 15, id: 'zomato', name: 'Zomato Ltd', symbol: 'ZOMATO', yahooSymbol: 'ZOMATO.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'IT & Tech', price: 275.40, currency: 'INR', weightagePct: 1.55, change1d: 4.25, high52w: 298, low52w: 98, peRatio: 120.0, marketCap: '₹2.4 Lakh Cr' },
    { rank: 16, id: 'jiofin', name: 'Jio Financial Services', symbol: 'JIOFIN', yahooSymbol: 'JIOFIN.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'Banking & Finance', price: 342.00, currency: 'INR', weightagePct: 1.38, change1d: 0.95, high52w: 394, low52w: 205, peRatio: 85.0, marketCap: '₹2.2 Lakh Cr' },
    { rank: 17, id: 'trent', name: 'Trent Ltd (Westside)', symbol: 'TRENT', yahooSymbol: 'TRENT.NS', exchange: 'NSE', tier: 'Nifty Next 50', sector: 'FMCG & Consumer', price: 7850.00, currency: 'INR', weightagePct: 1.95, change1d: 2.45, high52w: 8340, low52w: 2010, peRatio: 140.0, marketCap: '₹2.8 Lakh Cr' },

    // MIDCAP 150 & SMALLCAP 250 MULTIBAGGERS
    { rank: 18, id: 'suzlon', name: 'Suzlon Energy', symbol: 'SUZLON', yahooSymbol: 'SUZLON.NS', exchange: 'NSE', tier: 'Nifty Midcap 150', sector: 'Energy & Power', price: 74.50, currency: 'INR', weightagePct: 0.85, change1d: 4.85, high52w: 86, low52w: 24, peRatio: 82.0, marketCap: '₹1.0 Lakh Cr' },
    { rank: 19, id: 'cdsl', name: 'Central Depository Services', symbol: 'CDSL', yahooSymbol: 'CDSL.NS', exchange: 'NSE', tier: 'Nifty Midcap 150', sector: 'Banking & Finance', price: 1540.00, currency: 'INR', weightagePct: 0.72, change1d: 3.15, high52w: 1680, low52w: 780, peRatio: 65.0, marketCap: '₹32,000 Cr' },
    { rank: 20, id: 'polycab', name: 'Polycab India', symbol: 'POLYCAB', yahooSymbol: 'POLYCAB.NS', exchange: 'NSE', tier: 'Nifty Midcap 150', sector: 'Capital Goods', price: 6850.00, currency: 'INR', weightagePct: 0.92, change1d: 1.65, high52w: 7400, low52w: 4500, peRatio: 52.0, marketCap: '₹1.0 Lakh Cr' },
    { rank: 21, id: 'persistent', name: 'Persistent Systems', symbol: 'PERSISTENT', yahooSymbol: 'PERSISTENT.NS', exchange: 'NSE', tier: 'Nifty Midcap 150', sector: 'IT & Tech', price: 5480.00, currency: 'INR', weightagePct: 0.88, change1d: 2.15, high52w: 5900, low52w: 3200, peRatio: 55.0, marketCap: '₹85,000 Cr' },
    { rank: 22, id: 'dixon', name: 'Dixon Technologies', symbol: 'DIXON', yahooSymbol: 'DIXON.NS', exchange: 'NSE', tier: 'Nifty Midcap 150', sector: 'IT & Tech', price: 14200.00, currency: 'INR', weightagePct: 0.95, change1d: 3.85, high52w: 15800, low52w: 4800, peRatio: 115.0, marketCap: '₹85,000 Cr' },
    { rank: 23, id: 'mazdock', name: 'Mazagon Dock Shipbuilders', symbol: 'MAZDOCK', yahooSymbol: 'MAZDOCK.NS', exchange: 'NSE', tier: 'Nifty Smallcap 250', sector: 'Defense & Aerospace', price: 4250.00, currency: 'INR', weightagePct: 0.65, change1d: 5.25, high52w: 5860, low52w: 1850, peRatio: 42.0, marketCap: '₹85,000 Cr' },
    { rank: 24, id: 'kpi', name: 'KPI Green Energy', symbol: 'KPIGREEN', yahooSymbol: 'KPIGREEN.NS', exchange: 'NSE', tier: 'Nifty Smallcap 250', sector: 'Energy & Power', price: 820.00, currency: 'INR', weightagePct: 0.45, change1d: 4.95, high52w: 1120, low52w: 340, peRatio: 48.0, marketCap: '₹18,000 Cr' },

    // GLOBAL MEGA CAPS (NASDAQ & NYSE)
    { rank: 25, id: 'nvidia', name: 'NVIDIA Corporation', symbol: 'NVDA', yahooSymbol: 'NVDA', exchange: 'NASDAQ', tier: 'Global Tech', sector: 'IT & Tech', price: 142.50, currency: 'USD', weightagePct: 7.20, change1d: 3.45, high52w: 148, low52w: 45, peRatio: 62.0, marketCap: '$3.5 Trillion' },
    { rank: 26, id: 'apple', name: 'Apple Inc', symbol: 'AAPL', yahooSymbol: 'AAPL', exchange: 'NASDAQ', tier: 'Global Tech', sector: 'IT & Tech', price: 232.10, currency: 'USD', weightagePct: 6.85, change1d: 0.85, high52w: 237, low52w: 164, peRatio: 34.0, marketCap: '$3.4 Trillion' },
    { rank: 27, id: 'microsoft', name: 'Microsoft Corporation', symbol: 'MSFT', yahooSymbol: 'MSFT', exchange: 'NASDAQ', tier: 'Global Tech', sector: 'IT & Tech', price: 428.40, currency: 'USD', weightagePct: 6.15, change1d: 1.12, high52w: 468, low52w: 309, peRatio: 35.5, marketCap: '$3.1 Trillion' },
  ]);

  const loadRealStockQuotes = async () => {
    setIsLoadingLive(true);
    const symbolsToFetch = stocks.map((s) => s.yahooSymbol);
    const liveMap = await fetchBatchLiveQuotes(symbolsToFetch);

    if (Object.keys(liveMap).length > 0) {
      setStocks((prev) =>
        prev.map((st) => {
          const live = liveMap[st.yahooSymbol];
          if (live && live.price > 0) {
            return {
              ...st,
              price: live.price,
              change1d: live.changePct,
              high52w: live.high ? Math.max(st.high52w, live.high) : st.high52w,
              low52w: live.low ? Math.min(st.low52w, live.low) : st.low52w,
              isRealLive: true,
            };
          }
          return st;
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString('en-IN'));
    }
    setIsLoadingLive(false);
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
            <option value="ALL">🇮🇳 All Nifty 500 Tiers</option>
            <option value="Nifty 50">Nifty 50 (LargeCap)</option>
            <option value="Nifty Next 50">Nifty Next 50</option>
            <option value="Nifty Midcap 150">Nifty Midcap 150</option>
            <option value="Nifty Smallcap 250">Nifty Smallcap 250</option>
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
