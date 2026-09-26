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
import { MarketAsset } from '../types/trading';

interface Props {
  activeAsset: MarketAsset;
}

export const VolatilityAlertBanner: React.FC<Props> = ({ activeAsset }) => {
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
      className={`p-3 rounded-md border transition-all animate-in fade-in slide-in-from-top-3 duration-200 relative overflow-hidden bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] ${
        isExtreme ? 'ring-1 ring-rose-500/30' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
        {/* Left: Indicator & Symbol Status */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-sm shrink-0 flex items-center justify-center ${
            isExtreme ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[11px] uppercase tracking-wide">
                VOLATILITY ALERT: {activeAsset.symbol}
              </span>

              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isExtreme
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {isExtreme ? 'EXTREME SURGE' : isBullishSurge ? 'MOMENTUM EXPANSION' : 'PULLBACK PRESSURE'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono flex-wrap text-[var(--theme-text-muted)]">
              <span className="font-bold text-[var(--theme-text-secondary)]">
                PRICE: ${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>

              <span className={`font-bold inline-flex items-center gap-0.5 ${isBullishSurge ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isBullishSurge ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{isBullishSurge ? '+' : ''}{changePct.toFixed(2)}%</span>
              </span>

              <span className="opacity-60 text-[9px]">
                RANGE: {amplitudePct}% (${low24h.toFixed(1)} - ${high24h.toFixed(1)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Threshold Adjuster & Dismiss */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[var(--theme-border-subtle)]">
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase flex items-center gap-1 mr-1">
              <Sliders className="w-2.5 h-2.5" />
              <span>LIMIT:</span>
            </span>
            {[1.5, 2.5, 4.0, 6.0].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setThreshold(t)}
                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all cursor-pointer border ${
                  threshold === t
                    ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-black'
                    : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                ±{t}%
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              setLastDismissedSymbol(activeAsset.symbol);
            }}
            className="p-1 rounded-sm hover:bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quantitative Risk Advisory Sub-bar */}
      <div className="mt-2 pt-2 border-t flex items-center justify-between gap-2 text-[10px] border-[var(--theme-border-subtle)]">
        <span className="flex items-center gap-1.5 font-medium text-[var(--theme-text-muted)]">
          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
          <span>
            <strong className="text-[var(--theme-text-secondary)]">RISK ADVICE:</strong> Fluctuations exceed normal ATR bands. Consider trailing stops and checking derivative option IV skew.
          </span>
        </span>
      </div>
    </div>
  );
};
