import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles } from 'lucide-react';

interface Asset {
  symbol: string;
  price: number;
  change15m: number;
}

export const PerformanceHeatmap: React.FC = () => {
  const { isLight } = useTheme();

  // Mock data - in a real app, this would come from a market service hook
  const assets: Asset[] = [
    { symbol: 'BTC', price: 96500, change15m: 1.2 },
    { symbol: 'ETH', price: 3400, change15m: -0.5 },
    { symbol: 'SOL', price: 210, change15m: 3.5 },
    { symbol: 'XAUT', price: 2750, change15m: 0.1 },
    { symbol: 'ADA', price: 0.8, change15m: -1.2 },
  ];

  const getColor = (change: number) => {
    if (change > 2) return 'bg-emerald-600/60 text-white';
    if (change > 0) return 'bg-emerald-500/30 text-emerald-100';
    if (change > -1) return 'bg-rose-500/30 text-rose-100';
    return 'bg-rose-600/60 text-white';
  };

  return (
    <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="font-black text-sm">15m Performance Heatmap</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {assets.map((asset) => (
          <div key={asset.symbol} className={`p-2 rounded-md ${getColor(asset.change15m)}`}>
            <div className="font-bold">{asset.symbol}</div>
            <div className="text-xs font-mono">{asset.change15m.toFixed(2)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};
