import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Globe,
  Activity,
  BarChart2,
  Calendar,
  Layers,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
} from 'lucide-react';

export interface GlobalIndexDetailItem {
  id: string;
  name: string;
  symbol: string;
  yahooSymbol?: string;
  category?: string;
  region?: string;
  price: number;
  change1d: number;
  change1dPts?: number;
  high24h?: number;
  low24h?: number;
  status?: string;
  currency?: string;
  peRatio?: number;
  isRealLive?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: GlobalIndexDetailItem | null;
}

interface HistoricalCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndexAiInsights {
  executiveSummary: string;
  macroRegime: string;
  technicalOutlook: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
    momentumScore: number;
    rsiVerdict: string;
  };
  catalysts: string[];
  institutionalStrategy: string;
}

export const GlobalIndexDetailModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const { theme, colors } = useTheme();

  const [timeframe, setTimeframe] = useState<'1d' | '5d' | '1mo' | '6mo' | '1y' | '5y'>('1mo');
  const [chartView, setChartView] = useState<'area' | 'candles'>('area');
  const [candles, setCandles] = useState<HistoricalCandle[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<HistoricalCandle | null>(null);

  const [aiInsights, setAiInsights] = useState<IndexAiInsights | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>('');

  // Fetch historical trend candles
  const fetchHistoricalData = async (targetSymbol: string, tf: string) => {
    setIsLoadingChart(true);
    try {
      const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(targetSymbol)}&range=${tf}`);
      if (res.ok) {
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          setCandles(data.candles);
        }
      }
    } catch (err) {
      console.warn('Failed to load historical candles:', err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Fetch AI Macro & Technical Insights
  const fetchAiInsights = async (targetItem: GlobalIndexDetailItem) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/index-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: targetItem.symbol,
          name: targetItem.name,
          price: targetItem.price,
          changePct: targetItem.change1d,
          high24h: targetItem.high24h || targetItem.price * 1.01,
          low24h: targetItem.low24h || targetItem.price * 0.99,
          region: targetItem.region || 'Global',
          category: targetItem.category || 'Index',
          currency: targetItem.currency || 'USD',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.insights) {
          setAiInsights(json.insights);
          setAiSource(json.source || 'Gemini 3.8 Flash Institutional AI');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch AI insights:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      const sym = item.yahooSymbol || item.symbol;
      fetchHistoricalData(sym, timeframe);
      fetchAiInsights(item);
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (isOpen && item) {
      const sym = item.yahooSymbol || item.symbol;
      fetchHistoricalData(sym, timeframe);
    }
  }, [timeframe]);

  if (!isOpen || !item) return null;

  const isUp = (item.change1d || 0) >= 0;
  const currencySymbol = item.currency === 'INR' ? '₹' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : item.currency === 'JPY' ? '¥' : '$';

  // Compute stats from candle series
  const prices = candles.map((c) => c.close);
  const minPrice = prices.length > 0 ? Math.min(...prices) : item.price * 0.95;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : item.price * 1.05;
  const priceRange = maxPrice - minPrice || 1;

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1] || { close: item.price };
  const periodReturnPct = firstCandle && lastCandle ? (((lastCandle.close - firstCandle.open) / firstCandle.open) * 100) : item.change1d;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Daylight Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden z-10 my-8 transition-all flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-primary)',
        }}
      >
        {/* HEADER BAR */}
        <div
          className="p-4 sm:p-6 border-b flex items-start justify-between gap-4 sticky top-0 z-20 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--theme-bg-header)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="p-3 rounded-2xl shrink-0 flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--theme-accent-light)',
                borderColor: 'var(--theme-accent-border)',
                color: 'var(--theme-accent)',
              }}
            >
              <Globe className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                  {item.name}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black border"
                  style={{
                    backgroundColor: 'var(--theme-bg-card-subtle)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {item.symbol}
                </span>
                {item.category && (
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold border"
                    style={{
                      backgroundColor: 'var(--theme-accent-light)',
                      borderColor: 'var(--theme-accent-border)',
                      color: 'var(--theme-accent)',
                    }}
                  >
                    {item.category}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE BENCHMARK
                </span>
              </div>

              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                {item.region || 'Global'} Benchmark Index • Currency: {item.currency || 'USD'} • 24h High: {currencySymbol}{item.high24h?.toLocaleString() || item.price.toLocaleString()} | 24h Low: {currencySymbol}{item.low24h?.toLocaleString() || item.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-black font-mono tracking-tight">
                {currencySymbol}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                className={`inline-flex items-center gap-1 font-bold text-xs font-mono px-2 py-0.5 rounded-md ${
                  isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{isUp ? '+' : ''}{item.change1d?.toFixed(2)}%</span>
                {item.change1dPts !== undefined && (
                  <span className="opacity-80">({isUp ? '+' : ''}{item.change1dPts.toFixed(2)} pts)</span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all cursor-pointer border"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. INTERACTIVE HISTORICAL CHART SECTION */}
          <div
            className="p-4 sm:p-5 rounded-2xl border space-y-3.5"
            style={{
              backgroundColor: 'var(--theme-bg-card-subtle)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                <span className="text-sm font-extrabold tracking-wide uppercase">Historical Performance & Trend</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${periodReturnPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {periodReturnPct >= 0 ? '+' : ''}{periodReturnPct.toFixed(2)}% in {timeframe.toUpperCase()}
                </span>
              </div>

              {/* TIMEFRAME SELECTORS */}
              <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                {(['1d', '5d', '1mo', '6mo', '1y', '5y'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    style={{
                      backgroundColor: timeframe === tf ? 'var(--theme-accent)' : 'transparent',
                      color: timeframe === tf ? '#ffffff' : 'inherit',
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* CHART CANVAS */}
            <div className="relative h-60 w-full bg-white rounded-xl p-3 border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between">
              {isLoadingChart ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                    <span>Loading historical candles...</span>
                  </div>
                </div>
              ) : null}

              {/* Hover Details readout */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 pb-1 border-b border-slate-100">
                <div>
                  {hoveredCandle ? (
                    <span>
                      Date: <strong className="text-slate-900">{new Date(hoveredCandle.time).toLocaleDateString()} {new Date(hoveredCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  ) : (
                    <span>Range: <strong>{timeframe.toUpperCase()}</strong> • {candles.length} Data Points</span>
                  )}
                </div>
                <div>
                  {hoveredCandle ? (
                    <span>
                      Price: <strong className="text-blue-600 font-extrabold">{currencySymbol}{hoveredCandle.close.toLocaleString()}</strong> | High: {currencySymbol}{hoveredCandle.high.toLocaleString()} | Low: {currencySymbol}{hoveredCandle.low.toLocaleString()}
                    </span>
                  ) : (
                    <span>
                      Low: <strong className="text-rose-600">{currencySymbol}{minPrice.toFixed(2)}</strong> — High: <strong className="text-emerald-600">{currencySymbol}{maxPrice.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive SVG Trend Line Chart */}
              <div className="flex-1 relative w-full mt-2">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 800 180"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp ? '#10b981' : '#3b82f6'} stopOpacity="0.28" />
                      <stop offset="100%" stopColor={isUp ? '#10b981' : '#3b82f6'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={180 * ratio}
                      x2="800"
                      y2={180 * ratio}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* SVG Area polygon and Line */}
                  {candles.length > 1 && (
                    <>
                      {/* Area Fill */}
                      <polygon
                        points={`0,180 ${candles
                          .map((c, i) => {
                            const x = (i / (candles.length - 1)) * 800;
                            const y = 180 - ((c.close - minPrice) / priceRange) * 160 - 10;
                            return `${x},${y}`;
                          })
                          .join(' ')} 800,180`}
                        fill="url(#indexGradient)"
                      />

                      {/* Line Stroke */}
                      <polyline
                        points={candles
                          .map((c, i) => {
                            const x = (i / (candles.length - 1)) * 800;
                            const y = 180 - ((c.close - minPrice) / priceRange) * 160 - 10;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={periodReturnPct >= 0 ? '#10b981' : '#2563eb'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}
                </svg>

                {/* Invisible hover overlay slots for interactive cursor */}
                <div className="absolute inset-0 flex">
                  {candles.map((c, idx) => (
                    <div
                      key={c.time}
                      onMouseEnter={() => setHoveredCandle(c)}
                      onMouseLeave={() => setHoveredCandle(null)}
                      className="flex-1 h-full cursor-crosshair hover:bg-blue-500/10 transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* Volume & Timestamp Axis labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>{candles[0] ? new Date(candles[0].time).toLocaleDateString() : ''}</span>
                <span>{candles[Math.floor(candles.length / 2)] ? new Date(candles[Math.floor(candles.length / 2)].time).toLocaleDateString() : ''}</span>
                <span>{candles[candles.length - 1] ? new Date(candles[candles.length - 1].time).toLocaleDateString() : ''}</span>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Current Price</div>
                <div className="text-sm font-extrabold font-mono text-slate-900">
                  {currencySymbol}{item.price.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Period Low</div>
                <div className="text-sm font-extrabold font-mono text-slate-900">
                  {currencySymbol}{minPrice.toFixed(2)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Period High</div>
                <div className="text-sm font-extrabold font-mono text-slate-900">
                  {currencySymbol}{maxPrice.toFixed(2)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Benchmark PE</div>
                <div className="text-sm font-extrabold font-mono text-slate-900">
                  {item.peRatio ? `${item.peRatio}x` : '21.4x'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. GEMINI AI INSIGHTS & MACRO CATALYST DEEP DIVE */}
          <div
            className="p-4 sm:p-5 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--theme-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">
                      Institutional AI Insights & Quantitative Breakdown
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    Real-time macro regime synthesis, support/resistance pivots, and actionable catalysts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchAiInsights(item)}
                disabled={isLoadingAi}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:bg-slate-100"
                style={{
                  backgroundColor: 'var(--theme-bg-card-subtle)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin text-purple-600' : ''}`} />
                <span>{isLoadingAi ? 'Synthesizing...' : 'Refresh Insights'}</span>
              </button>
            </div>

            {isLoadingAi ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-xs font-bold text-slate-500 font-mono">
                  Executing quantitative macro model on {item.name}...
                </p>
              </div>
            ) : aiInsights ? (
              <div className="space-y-4">
                {/* Executive Summary Card */}
                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-900 uppercase">
                    <Zap className="w-3.5 h-3.5 text-purple-700" />
                    <span>Executive Macro Verdict</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
                    {aiInsights.executiveSummary}
                  </p>
                </div>

                {/* Macro Regime & Technical Levels 2-column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Macro Drivers */}
                  <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Macroeconomic Regime</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700">
                      {aiInsights.macroRegime}
                    </p>
                  </div>

                  {/* Technical Levels & Pivots */}
                  <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                        <Target className="w-3.5 h-3.5 text-amber-600" />
                        <span>Key Pivots & Levels</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                        aiInsights.technicalOutlook.bias === 'BULLISH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : aiInsights.technicalOutlook.bias === 'BEARISH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {aiInsights.technicalOutlook.bias} STANCE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-rose-600 font-bold block">Support 1 / 2</span>
                        <strong>{currencySymbol}{aiInsights.technicalOutlook.support1}</strong>
                        <span className="text-[10px] text-slate-400 block">{currencySymbol}{aiInsights.technicalOutlook.support2}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-emerald-600 font-bold block">Resistance 1 / 2</span>
                        <strong>{currencySymbol}{aiInsights.technicalOutlook.resistance1}</strong>
                        <span className="text-[10px] text-slate-400 block">{currencySymbol}{aiInsights.technicalOutlook.resistance2}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium italic">
                      {aiInsights.technicalOutlook.rsiVerdict}
                    </p>
                  </div>
                </div>

                {/* Key Catalysts Array */}
                {aiInsights.catalysts && aiInsights.catalysts.length > 0 && (
                  <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200 space-y-2">
                    <div className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Key Upcoming Catalysts & Triggers</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {aiInsights.catalysts.map((cat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{cat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Institutional Strategy Box */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1 text-slate-800">
                  <div className="text-xs font-extrabold uppercase text-blue-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
                    <span>Actionable Institutional Playbook</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-blue-950">
                    {aiInsights.institutionalStrategy}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
