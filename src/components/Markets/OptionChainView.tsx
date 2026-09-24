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
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sliders,
  PieChart,
  HelpCircle,
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

export interface OptionChainPayload {
  symbol: string;
  underlierName: string;
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

export const OptionChainView: React.FC = () => {
  const { isLight, theme } = useTheme();

  const [selectedSymbol, setSelectedSymbol] = useState<'NIFTY' | 'BANKNIFTY' | 'FINNIFTY'>('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CLASSIC' | 'GREEKS' | 'OI_CHART'>('CLASSIC');
  const [strikesFilter, setStrikesFilter] = useState<number>(10); // Number of strikes above/below ATM (10, 15, 20, ALL)
  const [searchStrike, setSearchStrike] = useState<string>('');
  
  const [chainData, setChainData] = useState<OptionChainPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(15);

  const fetchOptionChain = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/market/option-chain?symbol=${selectedSymbol}`);
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
      console.warn('Failed to load option chain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptionChain();
  }, [selectedSymbol]);

  // Auto-refresh interval
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOptionChain();
    }, autoRefreshSec * 1000);
    return () => clearInterval(timer);
  }, [selectedSymbol, autoRefreshSec]);

  if (!chainData) {
    return (
      <div className="p-12 text-center space-y-4 rounded-2xl border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <div className="font-extrabold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
          Connecting to NSE Real-Time Option Chain Matrix...
        </div>
      </div>
    );
  }

  // Filter strikes around ATM
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

  // Max OI for bar calculations
  const maxCeOi = Math.max(...chainData.strikes.map((s) => s.ce.oi), 1);
  const maxPeOi = Math.max(...chainData.strikes.map((s) => s.pe.oi), 1);
  const maxCombinedOi = Math.max(maxCeOi, maxPeOi);

  return (
    <div className="space-y-4 font-sans">
      {/* 1. TOP HEADER & METRIC COMMAND TILES */}
      <div className="p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors space-y-4" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          {/* Symbol & Underlier Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)' }}>
              <button
                onClick={() => setSelectedSymbol('NIFTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  selectedSymbol === 'NIFTY'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NIFTY 50
              </button>
              <button
                onClick={() => setSelectedSymbol('BANKNIFTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  selectedSymbol === 'BANKNIFTY'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BANK NIFTY
              </button>
              <button
                onClick={() => setSelectedSymbol('FINNIFTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  selectedSymbol === 'FINNIFTY'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FIN NIFTY
              </button>
            </div>

            {/* Expiry Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Expiry:</span>
              <select
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              >
                {chainData.expiries.map((exp, idx) => (
                  <option key={exp} value={exp}>
                    {exp} {idx === 0 ? '(Current Weekly)' : idx === 1 ? '(Next Weekly)' : '(Monthly)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Controls: Auto-refresh & View Modes */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Buttons */}
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

            {/* Manual Refresh & Live Indicator */}
            <button
              onClick={fetchOptionChain}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}
              title="Refresh Option Chain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
              <span className="hidden sm:inline font-mono">{lastRefreshed}</span>
            </button>
          </div>
        </div>

        {/* 2. LIVE METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Tile 1: Spot Price */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{chainData.symbol} Spot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-slate-900" style={{ color: 'var(--theme-text-primary)' }}>
              ₹{chainData.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Futures: ₹{chainData.futuresPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </div>
          </div>

          {/* Tile 2: ATM Strike & Straddle */}
          <div className="p-2.5 rounded-xl border bg-amber-500/5" style={{ borderColor: 'var(--theme-accent-border)' }}>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-600" />
              <span>ATM Strike</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-amber-600">
              {chainData.atmStrike}
            </div>
            <div className="text-[10px] font-mono text-amber-800/80 mt-0.5">
              ATM Straddle: ₹{chainData.atmStraddlePrice}
            </div>
          </div>

          {/* Tile 3: PCR (Put Call Ratio) */}
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
              Vol PCR: {chainData.pcrVol}
            </div>
          </div>

          {/* Tile 4: Max Pain */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-purple-600" />
              <span>Max Pain Level</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-purple-700">
              {chainData.maxPainStrike}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Expiry Magnet Strike
            </div>
          </div>

          {/* Tile 5: Resistance & Support Walls */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Key Strike Walls
            </div>
            <div className="text-xs font-mono mt-1 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-rose-600 font-bold">Call Wall (Res):</span>
                <span className="font-extrabold">{chainData.majorCallWall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-bold">Put Wall (Sup):</span>
                <span className="font-extrabold">{chainData.majorPutWall}</span>
              </div>
            </div>
          </div>

          {/* Tile 6: Total Open Interest */}
          <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--theme-bg-card-subtle)', borderColor: 'var(--theme-border-subtle)' }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total F&O OI
            </div>
            <div className="text-xs font-mono mt-1 space-y-0.5">
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Calls:</span>
                <span>{(chainData.totalCeOi / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Puts:</span>
                <span>{(chainData.totalPeOi / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Institutional Commentary Bar */}
        <div className="p-3 rounded-xl border bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-purple-500/5 flex items-start gap-2.5 text-xs" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-orange-600 block">
              Gemini Institutional F&O Reading: {chainData.pcrVerdict}
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Max Pain anchored at <strong>{chainData.maxPainStrike}</strong> with heavy Put writing at <strong>{chainData.majorPutWall}</strong> providing a fortified floor. Major call writing resistance stationed at <strong>{chainData.majorCallWall}</strong>. Spot is currently {chainData.spotPrice > chainData.atmStrike ? 'trading above' : 'trading near'} ATM strike {chainData.atmStrike}.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MULTI-STRIKE OI HISTOGRAM (VISUAL VIEW) */}
      {viewMode === 'OI_CHART' && (
        <div className="p-4 rounded-2xl border shadow-xs space-y-3" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--theme-border-subtle)' }}>
            <h4 className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span>Multi-Strike Open Interest Histogram (Calls vs Puts)</span>
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

              return (
                <div key={s.strike} className={`flex items-center gap-2 py-1 px-2 rounded-lg text-xs font-mono transition-colors ${isAtm ? 'bg-amber-500/10 ring-1 ring-amber-400 font-black' : 'hover:bg-slate-500/5'}`}>
                  {/* Left: Call OI Bar (Growing right-to-left towards strike) */}
                  <div className="flex-1 flex items-center justify-end gap-1.5">
                    <span className="text-[10px] text-slate-500">{s.ce.oi.toLocaleString()}</span>
                    <div className="w-full max-w-[200px] h-4 bg-slate-200 rounded overflow-hidden flex justify-end">
                      <div className="h-full bg-gradient-to-l from-rose-500 to-rose-400 rounded transition-all" style={{ width: `${ceWidth}%` }} />
                    </div>
                  </div>

                  {/* Center: Strike Price */}
                  <div className={`w-20 text-center py-0.5 rounded font-black text-xs ${isAtm ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-800'}`}>
                    {s.strike}
                  </div>

                  {/* Right: Put OI Bar (Growing left-to-right from strike) */}
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

      {/* 4. INSTITUTIONAL OPTION CHAIN MATRIX TABLE */}
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
                placeholder="Search strike..."
                className="w-full pl-8 pr-3 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{ backgroundColor: 'var(--theme-bg-page)', borderColor: 'var(--theme-border)' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Master Headers: CALLS | STRIKE | PUTS */}
                <tr className="border-b font-extrabold text-[11px] uppercase tracking-wider" style={{ borderColor: 'var(--theme-border)' }}>
                  <th colSpan={viewMode === 'GREEKS' ? 7 : 6} className="py-2.5 px-3 text-center bg-rose-500/10 text-rose-700 border-r" style={{ borderColor: 'var(--theme-border)' }}>
                    CALL OPTIONS (CE)
                  </th>
                  <th className="py-2.5 px-3 text-center bg-amber-500/20 text-amber-800 font-black">
                    STRIKE
                  </th>
                  <th colSpan={viewMode === 'GREEKS' ? 7 : 6} className="py-2.5 px-3 text-center bg-emerald-500/10 text-emerald-700 border-l" style={{ borderColor: 'var(--theme-border)' }}>
                    PUT OPTIONS (PE)
                  </th>
                </tr>

                {/* Column Sub-headers */}
                <tr className="border-b text-[10px] font-bold text-slate-500 uppercase font-mono" style={{ borderColor: 'var(--theme-border-subtle)', backgroundColor: 'var(--theme-bg-card-subtle)' }}>
                  {/* CE Columns */}
                  <th className="py-2 px-2 text-right">OI</th>
                  <th className="py-2 px-2 text-right">Chg OI</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Volume</th>
                  <th className="py-2 px-2 text-right">IV%</th>
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-right text-purple-600">Delta (Δ)</th>}
                  {viewMode === 'GREEKS' && <th className="py-2 px-2 text-right text-purple-600">Theta (θ)</th>}
                  <th className="py-2 px-2 text-right font-black text-slate-900 border-r" style={{ borderColor: 'var(--theme-border)' }}>LTP (₹)</th>

                  {/* Strike Column */}
                  <th className="py-2 px-3 text-center font-black text-amber-700">Strike</th>

                  {/* PE Columns */}
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
                  const ceItm = row.isCeItm; // Strike < Spot Price (ITM for Call)
                  const peItm = row.isPeItm; // Strike > Spot Price (ITM for Put)

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
                            <span>{row.strike}</span>
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
