import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Flame,
  Target,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export interface StrikeOptionData {
  oi: number;
  chgOi: number;
  volume: number;
  iv: number;
  ltp: number;
  netChg: number;
  bid: number;
  ask: number;
  delta: number;
  theta: number;
  gamma?: number;
  vega?: number;
}

export interface StrikeRow {
  strike: number;
  isAtm: boolean;
  isCeItm: boolean;
  isPeItm: boolean;
  isMajorSupport?: boolean;
  isMajorResistance?: boolean;
  isSecondarySupport?: boolean;
  isSecondaryResistance?: boolean;
  ce: StrikeOptionData;
  pe: StrikeOptionData;
}

export interface StockOptionChainPayload {
  symbol: string;
  underlierName: string;
  isIndex: boolean;
  spotPrice: number;
  futuresPrice: number;
  atmStrike: number;
  lotSize: number;
  activeExpiry: string;
  expiries: string[];
  totalCeOi: number;
  totalPeOi: number;
  totalCeVol: number;
  totalPeVol: number;
  pcrOi: number;
  pcrVol: number;
  pcrVerdict: string;
  maxPainStrike: number;
  majorCallWall: number;
  secondaryCallWall?: number;
  majorPutWall: number;
  secondaryPutWall?: number;
  atmStraddlePrice: number;
  strikes: StrikeRow[];
  updatedAt: string;
}

const POPULAR_FNO_STOCKS = [
  // --- NIFTY 50 LARGE-CAPS ---
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Power' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking & Finance' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking & Finance' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT & Software' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT & Software' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG & Consumer' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecommunications' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto & EV' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking & PSU' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG & Consumer' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Banking & Finance' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', sector: 'Healthcare & Pharma' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking & Finance' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking & Finance' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer & Jewelry' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power Generation' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Oil & Gas Exploration' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals & Mining' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power Transmission' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile & Tractors' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerate' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Ports & Logistics' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining & Coal' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement & Materials' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paints & Chemicals' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG Foods' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Cement & Chemicals' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT Services' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals & Mining' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals & Mining' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Oil & Gas' },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', sector: 'Pharma & Healthcare' },
  { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories', sector: 'Pharma & Healthcare' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma & Healthcare' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', sector: 'Healthcare' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd (Royal Enfield)', sector: 'Automobile' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobile' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG Foods' },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'NBFC & Finance' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co', sector: 'Insurance' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co', sector: 'Insurance' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services' },

  // --- NIFTY NEXT 50 & HIGH GROWTH MIDCAP F&O ---
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defense & Aerospace' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defense Electronics' },
  { symbol: 'IRFC', name: 'Indian Railway Finance Corp', sector: 'Railways & PSU' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd (Blinkit)', sector: 'Quick Commerce & Tech' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', sector: 'Fintech & NBFC' },
  { symbol: 'TRENT', name: 'Trent Ltd (Tata Retail)', sector: 'Retail & Fashion' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', sector: 'Renewable Wind Energy' },
  { symbol: 'CDSL', name: 'Central Depository Services', sector: 'Capital Markets' },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Wires & Cables' },
  { symbol: 'DIXON', name: 'Dixon Technologies Ltd', sector: 'Electronics Manufacturing' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', sector: 'Defense Shipbuilding' },
  { symbol: 'KPIGREEN', name: 'KPI Green Energy Ltd', sector: 'Solar Energy' },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals', sector: 'Heavy Engineering' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'IT Services & AI' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'IT & Cloud' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Private Banking' },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma & Generics' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Commercial Vehicles' },
  { symbol: 'VOLTAS', name: 'Voltas Ltd (Tata AC)', sector: 'Consumer Durables' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', sector: 'Real Estate' },
  { symbol: 'TATACOMM', name: 'Tata Communications Ltd', sector: 'Telecom & Cloud' },
  { symbol: 'SIEMENS', name: 'Siemens Ltd', sector: 'Capital Goods' },
  { symbol: 'ABB', name: 'ABB India Ltd', sector: 'Power & Automation' },
  { symbol: 'DLF', name: 'DLF Ltd', sector: 'Real Estate' },
  { symbol: 'VEDL', name: 'Vedanta Ltd', sector: 'Metals & Mining' },
  { symbol: 'GAIL', name: 'GAIL India Ltd', sector: 'Oil & Gas' },
  { symbol: 'RECLTD', name: 'REC Ltd', sector: 'Power Finance' },
  { symbol: 'PFC', name: 'Power Finance Corp', sector: 'Power Finance' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking & Finance' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'PSU Banking' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'PSU Banking' },
  { symbol: 'CANBK', name: 'Canara Bank', sector: 'PSU Banking' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', sector: 'Banking & Finance' },

  // --- SMALLCAP & HIGH MOMENTUM F&O ---
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', sector: 'Rail Infrastructure' },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev', sector: 'Green Energy Financing' },
  { symbol: 'KAYNES', name: 'Kaynes Technology India', sector: 'Semiconductor / EMS' },
  { symbol: 'MOTILALOFS', name: 'Motilal Oswal Financial', sector: 'Broking & Wealth' },
  { symbol: 'NBCC', name: 'NBCC India Ltd', sector: 'Civil Construction' },
  { symbol: 'BSOFT', name: 'Birlasoft Ltd', sector: 'IT Services' },
  { symbol: 'JBMA', name: 'JBM Auto Ltd', sector: 'EV Buses & Auto' },
  { symbol: 'CYIENT', name: 'Cyient Ltd', sector: 'Engineering & AI' },
  { symbol: 'ANGELONE', name: 'Angel One Ltd', sector: 'Fintech Broking' },
  { symbol: 'HBLPOWER', name: 'HBL Power Systems Ltd', sector: 'Kavach & Defense Batteries' },
  { symbol: 'CEATLTD', name: 'CEAT Ltd (Tyres)', sector: 'Auto Ancillary' },
  { symbol: 'RITES', name: 'RITES Ltd', sector: 'Rail Transport Consultancy' },
  { symbol: 'GRSE', name: 'Garden Reach Shipbuilders', sector: 'Warship Building' },
  { symbol: 'HUDCO', name: 'Housing & Urban Dev Corp', sector: 'Housing Finance PSU' },
  { symbol: 'CAMS', name: 'Computer Age Management', sector: 'Mutual Fund Infrastructure' },
  { symbol: 'OLECTRA', name: 'Olectra Greentech Ltd', sector: 'Electric Buses' },
  { symbol: 'TEJASNET', name: 'Tejas Networks Ltd (Tata)', sector: '5G & Telecom Hardware' },
  { symbol: 'E2E', name: 'E2E Networks Ltd (AI Cloud)', sector: 'AI GPU Cloud Infra' },
  { symbol: 'SANGHVIMOV', name: 'Sanghvi Movers Ltd', sector: 'Heavy Crane Infrastructure' },
  { symbol: 'WOCKPHARMA', name: 'Wockhardt Ltd', sector: 'Pharma / Antibiotics' },
  { symbol: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT Services' },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT Services' },
  { symbol: 'NAUKRI', name: 'Info Edge India Ltd (Naukri)', sector: 'Internet & Tech' },
  { symbol: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Fintech' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', sector: 'Consumer Tech' },
  { symbol: 'POLICYBABA', name: 'PB Fintech (Policybazaar)', sector: 'Insurtech' },
];

export const StockOptionChainView: React.FC = () => {
  const { isLight, theme } = useTheme();

  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CLASSIC' | 'GREEKS' | 'OI_CHART'>('CLASSIC');
  const [strikesFilter, setStrikesFilter] = useState<number>(10);
  const [searchStrike, setSearchStrike] = useState<string>('');
  
  const [chainData, setChainData] = useState<StockOptionChainPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStockOptionChain = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/market/option-chain?symbol=${selectedStock}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setChainData(json.data);
          if (!selectedExpiry && json.data.expiries && json.data.expiries.length > 0) {
            setSelectedExpiry(json.data.expiries[0]);
          }
          setLastRefreshed(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }
      }
    } catch (err) {
      console.warn('Failed to load stock option chain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockOptionChain();
  }, [selectedStock]);

  const filteredStockList = POPULAR_FNO_STOCKS.filter((s) =>
    s.symbol.toLowerCase().includes(stockSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  if (!chainData) {
    return (
      <div className="p-12 text-center space-y-4 rounded-2xl border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <div className="font-extrabold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
          Computing Single-Stock F&O Option Chain for {selectedStock}...
        </div>
      </div>
    );
  }

  const atmIdx = chainData.strikes.findIndex((s) => s.strike === chainData.atmStrike);
  let visibleStrikes = chainData.strikes;
  if (atmIdx !== -1 && strikesFilter > 0) {
    const start = Math.max(0, atmIdx - strikesFilter);
    const end = Math.min(chainData.strikes.length, atmIdx + strikesFilter + 1);
    visibleStrikes = chainData.strikes.slice(start, end);
  }

  if (searchStrike.trim()) {
    visibleStrikes = visibleStrikes.filter((s) => s.strike.toString().includes(searchStrike.trim()));
  }

  const maxCeOi = Math.max(...chainData.strikes.map((s) => s.ce.oi), 1);
  const maxPeOi = Math.max(...chainData.strikes.map((s) => s.pe.oi), 1);
  const maxCombinedOi = Math.max(maxCeOi, maxPeOi);

  return (
    <div className="space-y-4 font-sans">
      {/* 1. STOCK F&O SELECTOR BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors space-y-4" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          {/* Stock Symbol Selector & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-black" style={{ color: 'var(--theme-text-primary)' }}>
              <Briefcase className="w-4 h-4 text-orange-500" />
              <span>Stock F&O Underlier:</span>
            </div>

            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="px-3 py-1.5 rounded-xl border text-xs font-black focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
            >
              {POPULAR_FNO_STOCKS.map((stk) => (
                <option key={stk.symbol} value={stk.symbol}>
                  {stk.symbol} — {stk.name}
                </option>
              ))}
            </select>

            {/* Expiry Selector */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] font-bold text-slate-500">Expiry:</span>
              <select
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                {chainData.expiries.map((exp, idx) => (
                  <option key={exp} value={exp}>
                    {exp} {idx === 0 ? '(Current Month)' : idx === 1 ? '(Next Month)' : '(Far Month)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode & Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setViewMode('CLASSIC')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'CLASSIC' ? 'bg-amber-500/20 text-amber-700 font-extrabold border border-amber-300' : 'text-slate-500'
                }`}
              >
                Classic OI
              </button>
              <button
                onClick={() => setViewMode('GREEKS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'GREEKS' ? 'bg-purple-500/20 text-purple-700 font-extrabold border border-purple-300' : 'text-slate-500'
                }`}
              >
                Greeks (Δ, θ, IV)
              </button>
              <button
                onClick={() => setViewMode('OI_CHART')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'OI_CHART' ? 'bg-blue-500/20 text-blue-700 font-extrabold border border-blue-300' : 'text-slate-500'
                }`}
              >
                OI Histogram
              </button>
            </div>

            <button
              onClick={fetchStockOptionChain}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              title="Refresh Stock Option Chain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
              <span className="hidden sm:inline font-mono">{lastRefreshed}</span>
            </button>
          </div>
        </div>

        {/* Quick Stock F&O Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 mr-1 font-mono">
            Popular F&O:
          </span>
          {POPULAR_FNO_STOCKS.slice(0, 10).map((stk) => (
            <button
              key={stk.symbol}
              onClick={() => setSelectedStock(stk.symbol)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedStock === stk.symbol
                  ? 'bg-orange-600 text-white font-black shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {stk.symbol}
            </button>
          ))}
        </div>

        {/* 2. LIVE METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Tile 1: Spot Price */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{chainData.symbol} Spot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5" style={{ color: 'var(--theme-text-primary)' }}>
              ₹{chainData.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Lot Size: {chainData.lotSize} shares
            </div>
          </div>

          {/* Tile 2: ATM Strike */}
          <div className="p-2.5 rounded-xl border bg-amber-500/5" style={{ borderColor: 'var(--theme-accent-border)' }}>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-600" />
              <span>ATM Strike</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-amber-600">
              ₹{chainData.atmStrike}
            </div>
            <div className="text-[10px] font-mono text-amber-800/80 mt-0.5">
              ATM Straddle: ₹{chainData.atmStraddlePrice}
            </div>
          </div>

          {/* Tile 3: PCR */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>PCR (OI)</span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${chainData.pcrOi >= 1.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {chainData.pcrOi >= 1.0 ? 'BULLISH' : 'BEARISH'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5" style={{ color: chainData.pcrOi >= 1.0 ? '#059669' : '#e11d48' }}>
              {chainData.pcrOi}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Futures: ₹{chainData.futuresPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </div>
          </div>

          {/* Tile 4: Max Pain */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-purple-600" />
              <span>Max Pain Strike</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-purple-700">
              ₹{chainData.maxPainStrike}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Stock Expiry Anchor
            </div>
          </div>

          {/* Tile 5: Support & Resistance Walls */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Key Walls (OI)
            </div>
            <div className="text-xs font-mono mt-1 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-rose-600 font-bold">Call Wall:</span>
                <span className="font-extrabold">₹{chainData.majorCallWall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-bold">Put Wall:</span>
                <span className="font-extrabold">₹{chainData.majorPutWall}</span>
              </div>
            </div>
          </div>

          {/* Tile 6: Total Open Interest */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Stock F&O Open Interest
            </div>
            <div className="text-xs font-mono mt-1 space-y-0.5">
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Calls OI:</span>
                <span>{(chainData.totalCeOi / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Puts OI:</span>
                <span>{(chainData.totalPeOi / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Banner for Support & Resistance Walls */}
        <div className="p-3 rounded-xl border bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-rose-500/10 flex items-center justify-between flex-wrap gap-2 text-xs" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <ShieldAlert className="w-3 h-3" /> Major Support: ₹{chainData.majorPutWall}
            </span>
            <span className="text-slate-600 text-[11px] font-medium hidden md:inline">
              (Highest Put Open Interest • Institutional Buying Base)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Flame className="w-3 h-3" /> Major Resistance: ₹{chainData.majorCallWall}
            </span>
            <span className="text-slate-600 text-[11px] font-medium hidden md:inline">
              (Highest Call Open Interest • Institutional Supply Zone)
            </span>
          </div>
        </div>
      </div>

      {/* 3. MULTI-STRIKE OI HISTOGRAM */}
      {viewMode === 'OI_CHART' && (
        <div className="p-4 rounded-2xl border shadow-xs space-y-3" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--theme-border-subtle)' }}>
            <h4 className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span>{chainData.symbol} Strike OI Histogram (Calls Resistance vs Puts Support)</span>
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="text-rose-600">Call (CE) OI Resistance</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-emerald-600">Put (PE) OI Support</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            {visibleStrikes.map((s) => {
              const ceWidth = (s.ce.oi / maxCombinedOi) * 100;
              const peWidth = (s.pe.oi / maxCombinedOi) * 100;
              const isAtm = s.strike === chainData.atmStrike;
              const isMajorSup = s.isMajorSupport || s.strike === chainData.majorPutWall;
              const isMajorRes = s.isMajorResistance || s.strike === chainData.majorCallWall;

              return (
                <div key={s.strike} className={`flex items-center gap-2 py-1 px-2 rounded-lg text-xs font-mono transition-colors ${
                  isAtm ? 'bg-amber-500/10 ring-1 ring-amber-400 font-black' : isMajorSup ? 'bg-emerald-500/10 ring-1 ring-emerald-400' : isMajorRes ? 'bg-rose-500/10 ring-1 ring-rose-400' : 'hover:bg-slate-500/5'
                }`}>
                  {/* Left: Call OI Bar */}
                  <div className="flex-1 flex items-center justify-end gap-1.5">
                    <span className="text-[10px] text-slate-500">{s.ce.oi.toLocaleString()}</span>
                    <div className="w-full max-w-[200px] h-4 bg-slate-200 rounded overflow-hidden flex justify-end">
                      <div className="h-full bg-gradient-to-l from-rose-500 to-rose-400 rounded transition-all" style={{ width: `${ceWidth}%` }} />
                    </div>
                  </div>

                  {/* Center: Strike Price with Badges */}
                  <div className={`w-28 text-center py-0.5 rounded font-black text-xs ${
                    isAtm ? 'bg-amber-500 text-slate-950 shadow-xs' : isMajorSup ? 'bg-emerald-600 text-white shadow-xs' : isMajorRes ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-800'
                  }`}>
                    ₹{s.strike}
                  </div>

                  {/* Right: Put OI Bar */}
                  <div className="flex-1 flex items-center justify-start gap-1.5">
                    <div className="w-full max-w-[200px] h-4 bg-slate-200 rounded overflow-hidden flex justify-start">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded transition-all" style={{ width: `${peWidth}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{s.pe.oi.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STOCK F&O MATRIX TABLE WITH HIGHLIGHTED SUPPORT & RESISTANCE */}
      {viewMode !== 'OI_CHART' && (
        <div className="rounded-2xl border shadow-xs overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          {/* Table Filters & Strike Range Bar */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 text-xs" style={{ borderColor: 'var(--theme-border-subtle)', backgroundColor: 'var(--theme-bg-card-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Strikes:</span>
              <div className="flex items-center gap-1">
                {[10, 15, 20, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => setStrikesFilter(num)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      strikesFilter === num ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {num === 0 ? 'All' : `±${num}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchStrike}
                onChange={(e) => setSearchStrike(e.target.value)}
                placeholder="Filter strike..."
                className="w-full pl-8 pr-3 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)' }}
              />
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-extrabold text-[11px] uppercase tracking-wider" style={{ borderColor: 'var(--theme-border)' }}>
                  <th colSpan={viewMode === 'GREEKS' ? 7 : 6} className="py-2.5 px-3 text-center bg-rose-500/10 text-rose-700 border-r" style={{ borderColor: 'var(--theme-border)' }}>
                    CALL OPTIONS (CE)
                  </th>
                  <th className="py-2.5 px-3 text-center bg-amber-500/20 text-amber-800 font-black">
                    STRIKE PRICE
                  </th>
                  <th colSpan={viewMode === 'GREEKS' ? 7 : 6} className="py-2.5 px-3 text-center bg-emerald-500/10 text-emerald-700 border-l" style={{ borderColor: 'var(--theme-border)' }}>
                    PUT OPTIONS (PE)
                  </th>
                </tr>

                <tr className="border-b text-[10px] font-bold text-slate-500 uppercase font-mono" style={{ borderColor: 'var(--theme-border-subtle)', backgroundColor: 'var(--theme-bg-card-subtle)' }}>
                  <th className="py-2 px-2 text-right">OI</th>
                  <th className="py-2 px-2 text-right">Chg OI</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Volume</th>
                  <th className="py-2 px-2 text-right">IV%</th>
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-right text-purple-600">Delta (Δ)</th>}
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-right text-purple-600">Theta (θ)</th>}
                  <th className="py-2 px-2 text-right font-black text-slate-900 border-r" style={{ borderColor: 'var(--theme-border)' }}>LTP (₹)</th>

                  <th className="py-2 px-3 text-center font-black text-amber-700">Strike</th>

                  <th className="py-2 px-2 text-left font-black text-slate-900 border-l" style={{ borderColor: 'var(--theme-border)' }}>LTP (₹)</th>
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-left text-purple-600">Delta (Δ)</th>}
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-left text-purple-600">Theta (θ)</th>}
                  <th className="py-2 px-2 text-left">IV%</th>
                  <th className="py-2 px-2 text-left hidden sm:table-cell">Volume</th>
                  <th className="py-2 px-2 text-left">Chg OI</th>
                  <th className="py-2 px-2 text-left">OI</th>
                </tr>
              </thead>

              <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--theme-border-subtle)' }}>
                {visibleStrikes.map((row) => {
                  const isAtm = row.strike === chainData.atmStrike;
                  const ceItm = row.isCeItm;
                  const peItm = row.isPeItm;

                  const isMajorSup = row.isMajorSupport || row.strike === chainData.majorPutWall;
                  const isMajorRes = row.isMajorResistance || row.strike === chainData.majorCallWall;
                  const isSecSup = row.isSecondarySupport || row.strike === chainData.secondaryPutWall;
                  const isSecRes = row.isSecondaryResistance || row.strike === chainData.secondaryCallWall;

                  return (
                    <tr
                      key={row.strike}
                      className={`transition-colors ${
                        isAtm
                          ? 'bg-amber-500/15 ring-2 ring-amber-400 font-extrabold z-10'
                          : isMajorSup
                          ? 'bg-emerald-500/10 ring-2 ring-emerald-500/60 font-bold'
                          : isMajorRes
                          ? 'bg-rose-500/10 ring-2 ring-rose-500/60 font-bold'
                          : isSecSup
                          ? 'bg-emerald-500/5 ring-1 ring-emerald-400/40'
                          : isSecRes
                          ? 'bg-rose-500/5 ring-1 ring-rose-400/40'
                          : 'hover:bg-slate-500/5'
                      }`}
                    >
                      {/* CE: OI */}
                      <td className={`py-2 px-2 text-right font-mono ${isMajorRes ? 'font-black text-rose-700 bg-rose-100/60 ring-1 ring-rose-400' : 'font-medium'} ${ceItm ? 'bg-amber-50/40' : ''}`}>
                        {row.ce.oi.toLocaleString()}
                      </td>

                      {/* CE: Chg OI */}
                      <td className={`py-2 px-2 text-right font-bold ${row.ce.chgOi >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${ceItm ? 'bg-amber-50/40' : ''}`}>
                        {row.ce.chgOi >= 0 ? '+' : ''}{row.ce.chgOi.toLocaleString()}
                      </td>

                      {/* CE: Volume */}
                      <td className={`py-2 px-2 text-right text-slate-500 hidden sm:table-cell ${ceItm ? 'bg-amber-50/40' : ''}`}>
                        {row.ce.volume.toLocaleString()}
                      </td>

                      {/* CE: IV */}
                      <td className={`py-2 px-2 text-right text-slate-500 ${ceItm ? 'bg-amber-50/40' : ''}`}>
                        {row.ce.iv}%
                      </td>

                      {/* CE: Greeks */}
                      {viewMode === 'GREEKS' && (
                        <td className={`py-2 px-2 text-right font-bold text-purple-700 ${ceItm ? 'bg-amber-50/40' : ''}`}>
                          {row.ce.delta}
                        </td>
                      )}
                      {viewMode === 'GREEKS' && (
                        <td className={`py-2 px-2 text-right text-slate-500 ${ceItm ? 'bg-amber-50/40' : ''}`}>
                          {row.ce.theta}
                        </td>
                      )}

                      {/* CE: LTP */}
                      <td className={`py-2 px-2 text-right font-black text-rose-700 border-r ${ceItm ? 'bg-amber-100/50' : ''}`} style={{ borderColor: 'var(--theme-border)' }}>
                        ₹{row.ce.ltp.toFixed(2)}
                      </td>

                      {/* CENTER: STRIKE WITH SUPPORT / RESISTANCE / ATM HIGHLIGHTS */}
                      <td className={`py-2 px-3 text-center ${
                        isAtm
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : isMajorSup
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : isMajorRes
                          ? 'bg-rose-600 text-white font-black shadow-xs'
                          : isSecSup
                          ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                          : isSecRes
                          ? 'bg-rose-100 text-rose-900 font-extrabold'
                          : 'bg-slate-100 text-slate-900 font-bold'
                      }`}>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="flex items-center gap-1 font-black">
                            {isAtm && <Target className="w-3.5 h-3.5 text-slate-950" />}
                            {isMajorSup && <ShieldAlert className="w-3.5 h-3.5 text-white" />}
                            {isMajorRes && <Flame className="w-3.5 h-3.5 text-white" />}
                            <span>₹{row.strike}</span>
                          </div>
                          {isAtm && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-slate-950 text-amber-400">
                              ATM SPOT
                            </span>
                          )}
                          {isMajorSup && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-white text-emerald-800">
                              MAJOR SUPPORT
                            </span>
                          )}
                          {isMajorRes && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-white text-rose-800">
                              MAJOR RESISTANCE
                            </span>
                          )}
                          {isSecSup && !isMajorSup && (
                            <span className="text-[8px] font-bold text-emerald-700">
                              S2 Support
                            </span>
                          )}
                          {isSecRes && !isMajorRes && (
                            <span className="text-[8px] font-bold text-rose-700">
                              R2 Resistance
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PE: LTP */}
                      <td className={`py-2 px-2 text-left font-black text-emerald-700 border-l ${peItm ? 'bg-amber-100/50' : ''}`} style={{ borderColor: 'var(--theme-border)' }}>
                        ₹{row.pe.ltp.toFixed(2)}
                      </td>

                      {/* PE: Greeks */}
                      {viewMode === 'GREEKS' && (
                        <td className={`py-2 px-2 text-left font-bold text-purple-700 ${peItm ? 'bg-amber-50/40' : ''}`}>
                          {row.pe.delta}
                        </td>
                      )}
                      {viewMode === 'GREEKS' && (
                        <td className={`py-2 px-2 text-left text-slate-500 ${peItm ? 'bg-amber-50/40' : ''}`}>
                          {row.pe.theta}
                        </td>
                      )}

                      {/* PE: IV */}
                      <td className={`py-2 px-2 text-left text-slate-500 ${peItm ? 'bg-amber-50/40' : ''}`}>
                        {row.pe.iv}%
                      </td>

                      {/* PE: Volume */}
                      <td className={`py-2 px-2 text-left text-slate-500 hidden sm:table-cell ${peItm ? 'bg-amber-50/40' : ''}`}>
                        {row.pe.volume.toLocaleString()}
                      </td>

                      {/* PE: Chg OI */}
                      <td className={`py-2 px-2 text-left font-bold ${row.pe.chgOi >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${peItm ? 'bg-amber-50/40' : ''}`}>
                        {row.pe.chgOi >= 0 ? '+' : ''}{row.pe.chgOi.toLocaleString()}
                      </td>

                      {/* PE: OI */}
                      <td className={`py-2 px-2 text-left font-mono ${isMajorSup ? 'font-black text-emerald-700 bg-emerald-100/60 ring-1 ring-emerald-400' : 'font-medium'} ${peItm ? 'bg-amber-50/40' : ''}`}>
                        {row.pe.oi.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
