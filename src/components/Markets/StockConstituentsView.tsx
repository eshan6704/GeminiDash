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

interface StockConstituentsViewProps {
  externalSymbol?: string | null;
}

export const StockConstituentsView: React.FC<StockConstituentsViewProps> = ({
  externalSymbol,
}) => {
  const { isLight } = useTheme();
  const [activeAnalystStock, setActiveAnalystStock] = useState<StockConstituentItem | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
        peRatio: Number(Number(m.peRatio || 25).toFixed(2)),
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
              peRatio: Number(Number(m.peRatio || 25).toFixed(2)),
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
              peRatio: Number(Number(m.peRatio || 25).toFixed(2)),
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

  const handleCustomSearchAnalysis = async (overrideSym?: string) => {
    const rawSym = overrideSym ?? searchQuery;
    if (!rawSym.trim()) return;
    const sym = rawSym.trim().toUpperCase();
    if (overrideSym) {
      setSearchQuery(sym);
    }
    const existing = stocks.find((s) => s.symbol.toUpperCase() === sym);
    if (existing) {
      setActiveAnalystStock(existing);
    } else {
      setIsLoadingLive(true);
      const yahooSym = sym.includes('.') ? sym : `${yahooSymbolPrefix(sym)}`;
      const live = await fetchLiveQuote(yahooSym);
      
      const dynamicStock: StockConstituentItem = {
        rank: 99,
        id: sym.toLowerCase(),
        name: `${sym} India`,
        symbol: sym,
        yahooSymbol: yahooSym,
        exchange: 'NSE',
        tier: 'Nifty 50',
        sector: 'Banking & Finance',
        price: live?.price || 845.50,
        currency: 'INR',
        weightagePct: 0.65,
        change1d: live?.changePct || 0,
        high52w: live?.high || 0,
        low52w: live?.low || 0,
        peRatio: 24.5,
        marketCap: 'NSE Listed',
        isRealLive: Boolean(live?.price),
      };
      setActiveAnalystStock(dynamicStock);
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (externalSymbol && externalSymbol.trim()) {
      handleCustomSearchAnalysis(externalSymbol);
    }
  }, [externalSymbol]);

  const yahooSymbolPrefix = (sym: string) => {
    if (sym.includes('.') || sym.startsWith('^')) return sym;
    return `${sym}.NS`;
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-xl border space-y-6 transition-colors ${
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
                Stocks — 9-Tab Deep Research Workstation
              </h2>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Enter any stock symbol (e.g., SBIN, RELIANCE, TCS) to launch the 9-Tab Deep Research Station.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {activeAnalystStock && (
            <button
              onClick={() => {
                setActiveAnalystStock(null);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-bold transition-all"
            >
              New Stock Search
            </button>
          )}
        </div>
      </div>

      {/* SEARCH LANDING OR ANALYSIS */}
      {!activeAnalystStock ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto text-center">
          <div className="p-6 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Search className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Which stock symbol would you like to analyze?</h1>
            <p className="text-sm text-neutral-400">
              Enter any NSE/BSE or Global stock ticker to instantly generate the 9-Tab Deep Research Station (AI Live Summary, Company Profile, Fundamentals, Corporate Actions, Intraday & Historical, Technicals & Pivots, F&O Option Chain, Peers & Shareholding, and Direct HF API).
            </p>
          </div>

          <div className="w-full relative group">
            <Search className="w-6 h-6 absolute left-4 top-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearchAnalysis()}
              placeholder="Enter symbol (e.g., SBIN, RELIANCE, HAL, TCS, HDFCBANK, ZOMATO)..."
              className={`w-full pl-12 pr-36 py-4 rounded-2xl border-2 focus:outline-none focus:border-orange-500 font-sans text-lg font-bold shadow-2xl transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-100'
              }`}
            />
            <button
              onClick={() => handleCustomSearchAnalysis()}
              disabled={isLoadingLive}
              className="absolute right-3 top-2.5 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              {isLoadingLive ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>Analyze</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[10px] uppercase font-bold text-neutral-500 w-full mb-1">Instant 1-Click Stock Analysis</span>
            {['SBIN', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HAL', 'TATAMOTORS', 'ZOMATO', 'SUZLON'].map((sym) => (
              <button
                key={sym}
                onClick={() => handleCustomSearchAnalysis(sym)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-orange-500 hover:text-neutral-950 text-neutral-300 border border-neutral-700 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* QUICK SEARCH BAR AT TOP OF ACTIVE RESEARCH STATION */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveAnalystStock(null)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSearchAnalysis()}
                placeholder="Enter another stock symbol (e.g., SBIN, RELIANCE, TCS)..."
                className={`w-full pl-9 pr-28 py-2 rounded-xl border focus:outline-none focus:border-amber-500 font-sans text-xs font-bold ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                }`}
              />
              <button
                onClick={() => handleCustomSearchAnalysis()}
                disabled={isLoadingLive}
                className="absolute right-1.5 top-1 px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-xs flex items-center gap-1 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Analyze</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['SBIN', 'RELIANCE', 'TCS', 'HDFCBANK', 'HAL'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleCustomSearchAnalysis(sym)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                    activeAnalystStock.symbol === sym
                      ? 'bg-orange-500 text-neutral-950 border-orange-400'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* INLINE 9-TAB DEEP RESEARCH STATION */}
          <NiftyStockAnalysisModal
            isOpen={true}
            inline={true}
            stock={activeAnalystStock}
            onClose={() => setActiveAnalystStock(null)}
          />
        </div>
      )}
    </div>
  );
};
