import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Network } from 'lucide-react';

// Mock correlation matrix data
const assets = ['BTC', 'ETH', 'SOL', 'XAUT', 'ADA'];
const matrix = [
  [1.0, 0.85, 0.75, -0.1, 0.6],
  [0.85, 1.0, 0.8, -0.05, 0.55],
  [0.75, 0.8, 1.0, -0.15, 0.65],
  [-0.1, -0.05, -0.15, 1.0, -0.02],
  [0.6, 0.55, 0.65, -0.02, 1.0],
];

export const CorrelationMatrix: React.FC = () => {
  const { isLight } = useTheme();

  const getCellColor = (value: number) => {
    if (value > 0.7) return 'bg-emerald-600/60';
    if (value > 0.4) return 'bg-emerald-500/30';
    if (value > 0) return 'bg-slate-500/20';
    if (value > -0.4) return 'bg-rose-500/20';
    return 'bg-rose-600/50';
  };

  return (
    <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-emerald-400" />
        <h3 className="font-black text-sm">Trade Correlation Matrix</h3>
      </div>
      <div className="grid grid-cols-6 gap-1 text-[10px] font-mono">
        <div />
        {assets.map(a => <div key={a} className="font-bold text-center">{a}</div>)}
        {matrix.map((row, i) => (
          <React.Fragment key={assets[i]}>
            <div className="font-bold text-right pr-2">{assets[i]}</div>
            {row.map((val, j) => (
              <div key={`${i}-${j}`} className={`p-2 text-center rounded ${getCellColor(val)}`}>
                {val.toFixed(2)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
