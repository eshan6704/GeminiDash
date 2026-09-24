import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Flame, AlertTriangle, X, TrendingUp, TrendingDown, Sliders } from 'lucide-react';

interface VolatilityAlertBannerProps {
  symbol: string;
  name: string;
  change24h: number;
  price: number;
  high24h: number;
  low24h: number;
}

export const VolatilityAlertBanner: React.FC<VolatilityAlertBannerProps> = ({
  symbol,
  name,
  change24h,
  price,
  high24h,
  low24h,
}) => {
  const { isLight } = useTheme();
  const [threshold, setThreshold] = useState<number>(2.5); // 2.5% default threshold
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const absChange = Math.abs(change24h);
  const isTriggered = absChange >= threshold;

  if (isDismissed || !isTriggered) {
    return null;
  }

  const isUp = change24h >= 0;

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-sans z-35 animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur animate-bounce shrink-0">
          <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-[11px] font-mono shrink-0">
            ⚡ Volatility Alert ({change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%)
          </span>
          <span className="font-extrabold truncate">
            {name} ({symbol}) is experiencing high volatility. Price: ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2 })} (24h Range: ₹{low24h} - ₹{high24h}).
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showSettings ? (
          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg text-xs">
            <span>Threshold:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-black/50 text-white rounded px-1.5 py-0.5 text-xs font-bold outline-none"
            >
              <option value={1.5}>1.5%</option>
              <option value={2.0}>2.0%</option>
              <option value={2.5}>2.5%</option>
              <option value={3.5}>3.5%</option>
              <option value={5.0}>5.0%</option>
            </select>
            <button onClick={() => setShowSettings(false)} className="text-white/80 hover:text-white font-bold px-1">Done</button>
          </div>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded hover:bg-white/20 transition-all cursor-pointer"
            title="Configure Volatility Threshold"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded hover:bg-white/20 transition-all cursor-pointer"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
