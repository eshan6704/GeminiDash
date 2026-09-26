import React from 'react';
import { MarketAsset } from '../types/trading';
import { ShieldCheck, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TickerBarProps {
  assets: Record<string, MarketAsset>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const assetList = Object.values(assets);
  
  // Track last valid non-zero prices per symbol to ensure no flickering to null or hardcoded values
  const lastValidPricesRef = React.useRef<Record<string, number>>({});
  assetList.forEach((asset) => {
    if (asset.price && typeof asset.price === 'number' && asset.price > 0) {
      lastValidPricesRef.current[asset.symbol] = asset.price;
    }
  });

  return (
    <div
      className="border-b px-4 py-2 overflow-x-auto no-scrollbar transition-colors bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)]"
    >
      <div className="flex items-center gap-2.5 min-w-max">
        {assetList.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isPositive = asset.change24h >= 0;
          const isGold = asset.category === 'gold';

          // Use local stablePrice variable that defaults to the previous valid price if no update has arrived
          const stablePrice = asset.price && asset.price > 0 
            ? asset.price 
            : (lastValidPricesRef.current[asset.symbol] || asset.price || 0);

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-left transition-all border ${
                isSelected
                  ? 'bg-[var(--theme-bg-card)] border-[var(--theme-accent)]'
                  : 'bg-[var(--theme-bg-card)] border-[var(--theme-border-subtle)] hover:border-[var(--theme-border)]'
              }`}
            >
              {/* Asset Badge / Icon */}
              <div
                className={`w-6 h-6 rounded-sm flex items-center justify-center font-bold text-[9px] shrink-0 ${
                  isGold
                    ? 'bg-amber-500 text-black'
                    : asset.symbol === 'BTC'
                    ? 'bg-orange-500 text-white'
                    : asset.symbol === 'ETH'
                    ? 'bg-indigo-500 text-white'
                    : asset.symbol === 'SOL'
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border-subtle)]'
                }`}
              >
                {asset.symbol.slice(0, 3)}
              </div>

              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-[10px] text-[var(--theme-text-primary)]">
                    {asset.symbol}
                  </span>
                  {isGold && (
                    <span
                      className="text-[8px] px-1 py-0.2 rounded-sm font-bold border flex items-center gap-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20"
                    >
                      <ShieldCheck className="w-2 h-2" />
                      PHYSICAL
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] font-bold text-[var(--theme-text-secondary)]">
                    ${stablePrice.toLocaleString('en-US', {
                      minimumFractionDigits: stablePrice < 10 ? 4 : 2,
                      maximumFractionDigits: stablePrice < 10 ? 4 : 2,
                    })}
                  </span>
                  <span
                    className={`flex items-center text-[9px] font-mono font-bold ${
                      isPositive
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
