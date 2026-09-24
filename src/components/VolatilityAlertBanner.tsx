import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ShieldAlert,
  Sliders,
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { Asset } from '../types';

interface Props {
  activeAsset: Asset;
}

export const VolatilityAlertBanner: React.FC<Props> = ({ activeAsset }) => {
  const { isLight, theme } = useTheme();

  const [threshold, setThreshold] = useState<number>(2.5); // Default alert trigger threshold: 2.5%
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [lastDismissedSymbol, setLastDismissedSymbol] = useState<string>('');

  // Calculate 24h price change and high/low amplitude
  const changePct = activeAsset.change24h || 0;
  const absChange = Math.abs(changePct);
  const high24h = activeAsset.high24h || activeAsset.price * 1.02;
  const low24h = activeAsset.low24h || activeAsset.price * 0.98;
  const amplitudePct = low24h > 0 ? Number((((high24h - low24h) / low24h) * 100).toFixed(2)) : 0;

  // Check if volatility exceeds threshold
  const isTriggered = (absChange >= threshold || amplitudePct >= threshold * 1.5);

  // If user switched asset, reset dismiss state
  if (isDismissed && lastDismissedSymbol !== activeAsset.symbol) {
    setIsDismissed(false);
  }

  if (!isTriggered || isDismissed) {
    return null;
  }

  const isBullishSurge = changePct >= 0;
  const isExtreme = absChange >= 5.0 || amplitudePct >= 8.0;

  return (
    <div
      className={`p-3 sm:px-4 sm:py-3 rounded-2xl border shadow-md transition-all animate-in fade-in slide-in-from-top-3 duration-200 relative overflow-hidden ${
        isExtreme
          ? 'bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-purple-500/15 border-rose-500/50 ring-1 ring-rose-400'
          : isBullishSurge
          ? 'bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 border-emerald-500/40 ring-1 ring-emerald-400/50'
          : 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border-rose-500/40 ring-1 ring-rose-400/50'
      }`}
      style={{
        backgroundColor: 'var(--theme-bg-card)',
      }}
    >
      {/* Background Animated Pulse Glow */}
      <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none ${isBullishSurge ? 'bg-emerald-400' : 'bg-rose-500'}`} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
        {/* Left: Indicator & Symbol Status */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
            isExtreme ? 'bg-rose-600 text-white animate-bounce' : isBullishSurge ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide" style={{ color: 'var(--theme-text-primary)' }}>
                ⚡ Real-Time Volatility Alert: {activeAsset.name} ({activeAsset.symbol})
              </span>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                isExtreme
                  ? 'bg-rose-600 text-white animate-pulse'
                  : isBullishSurge
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {isExtreme ? '🔥 Extreme Volatility Surge' : isBullishSurge ? '📈 High Momentum Expansion' : '📉 Sharp Pullback Pressure'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5 text-xs font-mono flex-wrap">
              <span className="font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                Live Price: ${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>

              <span className={`font-black inline-flex items-center gap-0.5 ${isBullishSurge ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isBullishSurge ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>24h Change: {isBullishSurge ? '+' : ''}{changePct.toFixed(2)}%</span>
              </span>

              <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">
                • 24h Range Spread: {amplitudePct}% (${low24h.toFixed(1)} - ${high24h.toFixed(1)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Threshold Adjuster & Dismiss */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0" style={{ borderColor: 'var(--theme-border-subtle)' }}>
          {/* Quick Threshold Sensitivity Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mr-0.5">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Sensitivity:</span>
            </span>
            {[1.5, 2.5, 4.0, 6.0].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setThreshold(t)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  threshold === t
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={`Trigger alerts when price fluctuation exceeds ${t}%`}
              >
                ±{t}%
              </button>
            ))}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              setLastDismissedSymbol(activeAsset.symbol);
            }}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Dismiss Volatility Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quantitative Risk Advisory Sub-bar */}
      <div className="mt-2 pt-2 border-t flex items-center justify-between gap-2 text-[11px] text-slate-600" style={{ borderColor: 'var(--theme-border-subtle)' }}>
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>Desk Risk Advice:</strong> Fluctuations exceed normal ATR bands. Consider trailing stops at 1.5% distance and checking derivative option IV skew.
          </span>
        </span>

        <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden lg:inline">
          Active Filter: &gt;{threshold}% Fluctuation
        </span>
      </div>
    </div>
  );
};
