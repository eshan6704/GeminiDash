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
  const { isLight } = useTheme();
  const assetList = Object.values(assets);

  return (
    <div
      className={`border-b px-4 py-2 overflow-x-auto no-scrollbar transition-colors ${
        isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-neutral-950 border-neutral-800/80'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-max">
        {assetList.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isPositive = asset.change24h >= 0;
          const isGold = asset.category === 'gold';

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all border ${
                isSelected
                  ? isGold
                    ? isLight
                      ? 'bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : isLight
                    ? 'bg-white border-slate-400 shadow-md ring-1 ring-slate-400/40'
                    : 'bg-neutral-800 border-neutral-600 shadow-md'
                  : isLight
                  ? 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700'
              }`}
            >
              {/* Asset Badge / Icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                  isGold
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-neutral-950 font-black shadow-sm'
                    : asset.symbol === 'BTC'
                    ? 'bg-orange-500 text-white'
                    : asset.symbol === 'ETH'
                    ? 'bg-indigo-500 text-white'
                    : asset.symbol === 'SOL'
                    ? 'bg-purple-500 text-white'
                    : 'bg-neutral-700 text-neutral-200'
                }`}
              >
                {asset.symbol.slice(0, 3)}
              </div>

              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                    {asset.symbol}
                  </span>
                  {isGold && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-semibold border flex items-center gap-0.5 ${
                        isLight
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Physical 1oz
                    </span>
                  )}
                  {asset.symbol === 'BTC' && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                        isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      Major
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className={`font-mono text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                    ${asset.price.toLocaleString('en-US', {
                      minimumFractionDigits: asset.price < 10 ? 4 : 2,
                      maximumFractionDigits: asset.price < 10 ? 4 : 2,
                    })}
                  </span>
                  <span
                    className={`flex items-center text-[10px] font-mono font-medium ${
                      isPositive
                        ? isLight
                          ? 'text-emerald-700 font-semibold'
                          : 'text-emerald-400'
                        : isLight
                        ? 'text-rose-700 font-semibold'
                        : 'text-rose-400'
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
