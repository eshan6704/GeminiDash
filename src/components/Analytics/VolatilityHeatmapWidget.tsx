import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Flame,
  Zap,
  Activity,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface VolatilityAsset {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'EQUITY' | 'COMMODITY';
  price: number;
  change24h: number;
  stdDev24h: number; // 24h Standard Deviation in %
  priceRange1Sigma: [number, number]; // [Lower 1σ, Upper 1σ]
  regime: 'EXPLOSIVE' | 'ELEVATED' | 'MODERATE' | 'COMPRESSED';
  riskTag: string;
  tradingOpportunity: string;
}

export const VolatilityHeatmapWidget: React.FC = () => {
  const { isLight } = useTheme();
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CRYPTO' | 'EQUITY_COMMODITY'>('ALL');
  const [sortOrder, setSortOrder] = useState<'VOL_DESC' | 'VOL_ASC' | 'CHANGE_DESC'>('VOL_DESC');
  const [selectedAsset, setSelectedAsset] = useState<VolatilityAsset | null>(null);

  // Asset Dataset with 24h Standard Deviation & Risk Profiles
  const assets: VolatilityAsset[] = [
    {
      symbol: 'PEPE',
      name: 'Pepe Coin',
      category: 'CRYPTO',
      price: 0.0000098,
      change24h: 14.25,
      stdDev24h: 9.85,
      priceRange1Sigma: [0.0000088, 0.0000108],
      regime: 'EXPLOSIVE',
      riskTag: 'Extreme Volatility',
      tradingOpportunity: 'High-Risk Momentum Breakout • Grid Scalp Zone',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      category: 'CRYPTO',
      price: 188.50,
      change24h: 6.82,
      stdDev24h: 7.42,
      priceRange1Sigma: [174.50, 202.50],
      regime: 'EXPLOSIVE',
      riskTag: 'High Risk / High Beta',
      tradingOpportunity: 'Volatile Expansion • Stop Loss tight @ $174',
    },
    {
      symbol: 'HAL',
      name: 'Hindustan Aeronautics',
      category: 'EQUITY',
      price: 4520.00,
      change24h: 3.85,
      stdDev24h: 5.85,
      priceRange1Sigma: [4255.00, 4785.00],
      regime: 'ELEVATED',
      riskTag: 'Defense Momentum',
      tradingOpportunity: 'Breakout above ₹4,550 • Target ₹4,780',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp',
      category: 'EQUITY',
      price: 142.50,
      change24h: 3.45,
      stdDev24h: 5.20,
      priceRange1Sigma: [135.00, 150.00],
      regime: 'ELEVATED',
      riskTag: 'AI Tech Volatility',
      tradingOpportunity: 'Options Volatility Spike • Straddle Strategy',
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      category: 'CRYPTO',
      price: 0.142,
      change24h: -4.15,
      stdDev24h: 6.12,
      priceRange1Sigma: [0.133, 0.151],
      regime: 'ELEVATED',
      riskTag: 'Speculative Vol',
      tradingOpportunity: 'Mean Reversion Dip Buy Zone',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      category: 'CRYPTO',
      price: 96500.00,
      change24h: 2.15,
      stdDev24h: 3.45,
      priceRange1Sigma: [93170.00, 99830.00],
      regime: 'MODERATE',
      riskTag: 'Institutional Anchor',
      tradingOpportunity: '1σ Expected Range $93.1k - $99.8k',
    },
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      category: 'EQUITY',
      price: 2980.50,
      change24h: 0.85,
      stdDev24h: 2.15,
      priceRange1Sigma: [2916.00, 3045.00],
      regime: 'COMPRESSED',
      riskTag: 'Low Vol Squeeze',
      tradingOpportunity: 'Volatility Compression Squeeze • Breakout Pending',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      category: 'CRYPTO',
      price: 3480.00,
      change24h: 1.85,
      stdDev24h: 3.82,
      priceRange1Sigma: [3346.00, 3614.00],
      regime: 'MODERATE',
      riskTag: 'Steady Momentum',
      tradingOpportunity: 'Accumulation in $3,350 support band',
    },
    {
      symbol: 'PAXG',
      name: 'Physical Gold Spot',
      category: 'COMMODITY',
      price: 2750.00,
      change24h: 0.25,
      stdDev24h: 1.12,
      priceRange1Sigma: [2719.00, 2781.00],
      regime: 'COMPRESSED',
      riskTag: 'Ultra Stable Safe Haven',
      tradingOpportunity: 'Portfolio Hedge • Minimum Volatility Drag',
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd',
      category: 'EQUITY',
      price: 1785.40,
      change24h: 1.12,
      stdDev24h: 1.85,
      priceRange1Sigma: [1752.00, 1818.00],
      regime: 'COMPRESSED',
      riskTag: 'LargeCap Stability',
      tradingOpportunity: 'Low Risk Swing Entry @ ₹1,760',
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      category: 'CRYPTO',
      price: 32.40,
      change24h: 5.12,
      stdDev24h: 6.95,
      priceRange1Sigma: [30.15, 34.65],
      regime: 'EXPLOSIVE',
      riskTag: 'High Vol Beta',
      tradingOpportunity: 'High-Frequency Grid Trading Opportunity',
    },
    {
      symbol: 'SUZLON',
      name: 'Suzlon Energy',
      category: 'EQUITY',
      price: 74.50,
      change24h: 4.85,
      stdDev24h: 8.20,
      priceRange1Sigma: [68.30, 80.70],
      regime: 'EXPLOSIVE',
      riskTag: 'High Retail Volatility',
      tradingOpportunity: 'Retail Volatility Spike • High Risk/Reward',
    },
  ];

  // Filtering
  const filteredAssets = assets.filter((ast) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CRYPTO') return ast.category === 'CRYPTO';
    if (categoryFilter === 'EQUITY_COMMODITY') return ast.category === 'EQUITY' || ast.category === 'COMMODITY';
    return true;
  });

  // Sorting
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortOrder === 'VOL_DESC') return b.stdDev24h - a.stdDev24h;
    if (sortOrder === 'VOL_ASC') return a.stdDev24h - b.stdDev24h;
    if (sortOrder === 'CHANGE_DESC') return Math.abs(b.change24h) - Math.abs(a.change24h);
    return 0;
  });

  // Color Intensity helper based on Standard Deviation (stdDev24h)
  const getVolatilityStyle = (stdDev: number) => {
    if (stdDev >= 7.0) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-950/80 via-rose-900/40 to-neutral-950 border-rose-500/60 shadow-lg shadow-rose-950/40',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        label: 'EXPLOSIVE VOLATILITY',
      };
    } else if (stdDev >= 4.5) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-950/70 via-amber-900/30 to-neutral-950 border-amber-500/50 shadow-md shadow-amber-950/30',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-amber-400',
        textColor: 'text-amber-400',
        label: 'ELEVATED VOLATILITY',
      };
    } else if (stdDev >= 2.5) {
      return {
        cardBg: 'bg-gradient-to-br from-purple-950/60 via-neutral-900 to-neutral-950 border-purple-500/40',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        barColor: 'bg-purple-400',
        textColor: 'text-purple-300',
        label: 'MODERATE VOLATILITY',
      };
    } else {
      return {
        cardBg: 'bg-gradient-to-br from-cyan-950/50 via-neutral-900 to-neutral-950 border-cyan-500/40',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        barColor: 'bg-cyan-400',
        textColor: 'text-cyan-300',
        label: 'COMPRESSED / STABLE',
      };
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border shadow-xl space-y-4 transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/50'
      }`}
    >
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                🔥 Volatility Heatmap Widget (24h Standard Deviation σ)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                HIGH-RISK TRADING OPPORTUNITY ENGINE
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Color-coded asset grid calibrated by 24h Standard Deviation ($\sigma$) to pinpoint volatility breakouts, squeezes, and high-beta momentum opportunities.
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {/* CATEGORY FILTER */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
            {[
              { id: 'ALL', label: 'All Assets' },
              { id: 'CRYPTO', label: '⚡ Crypto' },
              { id: 'EQUITY_COMMODITY', label: '🏛️ Stocks & Gold' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-rose-500 text-neutral-950 font-black shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* SORT ORDER */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-xs focus:outline-none focus:border-rose-500 ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-rose-300'
            }`}
          >
            <option value="VOL_DESC">⚡ Highest Volatility (Std Dev ↓)</option>
            <option value="VOL_ASC">🛡️ Lowest Volatility (Std Dev ↑)</option>
            <option value="CHANGE_DESC">📈 Highest Absolute 24h Move</option>
          </select>
        </div>
      </div>

      {/* HEATMAP GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedAssets.map((ast) => {
          const style = getVolatilityStyle(ast.stdDev24h);
          const isUp = ast.change24h >= 0;
          const isSelected = selectedAsset?.symbol === ast.symbol;

          return (
            <div
              key={ast.symbol}
              onClick={() => setSelectedAsset(isSelected ? null : ast)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer transform hover:scale-[1.03] flex flex-col justify-between space-y-2.5 font-mono ${style.cardBg} ${
                isSelected ? 'ring-2 ring-rose-400 scale-[1.03]' : ''
              }`}
            >
              {/* TOP HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-sm">{ast.symbol}</span>
                  <span className="text-[9px] text-neutral-400 bg-neutral-950/80 px-1.5 py-0.5 rounded border border-neutral-800">
                    {ast.category}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${style.badgeBg}`}>
                  {ast.stdDev24h.toFixed(1)}% σ
                </span>
              </div>

              {/* PRICE & CHANGE */}
              <div>
                <div className="text-sm font-extrabold text-white">
                  {ast.price < 1 ? `$${ast.price}` : ast.category === 'EQUITY' && ast.symbol !== 'NVDA' ? `₹${ast.price.toLocaleString('en-IN')}` : `$${ast.price.toLocaleString('en-IN')}`}
                </div>
                <div className={`text-[11px] font-bold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{ast.change24h.toFixed(2)}%</span>
                </div>
              </div>

              {/* VOLATILITY INTENSITY BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-neutral-400">
                  <span>24h Std Dev</span>
                  <span className={style.textColor}>{ast.regime}</span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden p-0.5 border border-neutral-800">
                  <div
                    className={`${style.barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, (ast.stdDev24h / 12) * 100)}%` }}
                  />
                </div>
              </div>

              {/* OPPORTUNITY TAG */}
              <div className="text-[9px] text-neutral-300 font-sans truncate bg-neutral-950/60 p-1.5 rounded-lg border border-neutral-800/80">
                {ast.riskTag}
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED ASSET RISK & STRATEGY PANEL */}
      {selectedAsset && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-neutral-950/90 space-y-3 animate-fadeIn font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="font-extrabold text-white text-sm">
                Volatility Analysis & Opportunity Breakdown: <strong className="text-rose-400">{selectedAsset.name} ({selectedAsset.symbol})</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
            >
              Close Panel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 block uppercase">24h Standard Deviation ($\sigma$)</span>
              <span className="text-base font-black text-rose-400">{selectedAsset.stdDev24h.toFixed(2)}%</span>
              <span className="text-[10px] text-neutral-400 block font-sans">Statistical Volatility Dispersion</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 block uppercase">Expected 1$\sigma$ Price Band (68% Confidence)</span>
              <span className="text-xs font-bold text-amber-300 block">
                {selectedAsset.price < 1 ? `$${selectedAsset.priceRange1Sigma[0]} - $${selectedAsset.priceRange1Sigma[1]}` : `$${selectedAsset.priceRange1Sigma[0].toLocaleString()} - $${selectedAsset.priceRange1Sigma[1].toLocaleString()}`}
              </span>
              <span className="text-[10px] text-emerald-400 block font-sans">Lower & Upper 1-Sigma Boundaries</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 block uppercase">Volatility Regime</span>
              <span className="text-xs font-bold text-cyan-300 block">{selectedAsset.regime} REGIME</span>
              <span className="text-[10px] text-cyan-400 block font-sans">{selectedAsset.riskTag}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-sans">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <strong>Recommended High-Risk Trading Setup:</strong> {selectedAsset.tradingOpportunity}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
