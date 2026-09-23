import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Gauge, Info } from 'lucide-react';

interface FearAndGreedIndexProps {
  value: number;
  label: string;
  isLoading?: boolean;
}

export const FearAndGreedIndex: React.FC<FearAndGreedIndexProps> = ({
  value,
  label,
  isLoading = false,
}) => {
  const { isLight } = useTheme();

  // Map value (0-100) to rotation (-90deg to 90deg)
  const rotation = (value / 100) * 180 - 90;

  const getColor = (val: number) => {
    if (val < 25) return '#ef4444'; // Extreme Fear
    if (val < 45) return '#f97316'; // Fear
    if (val < 55) return '#facc15'; // Neutral
    if (val < 75) return '#84cc16'; // Greed
    return '#10b981'; // Extreme Greed
  };

  const currentColor = getColor(value);

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80 shadow-inner'
      }`}
    >
      {/* Background Glow Effect */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10 rounded-full" 
        style={{ backgroundColor: currentColor }}
      />

      <div className="flex items-center justify-between z-10">
        <span className="font-bold flex items-center gap-1.5 text-indigo-400 uppercase tracking-tighter text-[10px]">
          <Gauge className="w-3.5 h-3.5" />
          Global Sentiment Index
        </span>
        <button title="Fear & Greed Index tracks volatility, volume, social media, dominance, and trends.">
          <Info className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-400 transition-colors" />
        </button>
      </div>

      <div className="relative flex flex-col items-center justify-center pt-2">
        {/* Semi-circle Gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Track Arc */}
          <svg className="w-48 h-48 transform -rotate-180">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="transparent"
              stroke="currentColor"
              className={isLight ? 'text-slate-200' : 'text-neutral-800'}
              strokeWidth="12"
              strokeDasharray="251.3" // Semi-circle circumference (pi * 80)
              strokeDashoffset="0"
              strokeLinecap="butt"
            />
            {/* Colored Progress Arc */}
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="transparent"
              stroke={currentColor}
              strokeWidth="12"
              strokeDasharray="251.3 502.6" 
              strokeDashoffset={251.3 - (value / 100) * 251.3}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>

          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 w-1.5 h-20 origin-bottom rounded-full transition-all duration-1000 ease-out shadow-lg z-10"
            style={{ 
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              backgroundColor: isLight ? '#1e293b' : 'white'
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-inherit" />
          </div>
          
          {/* Pivot point */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 z-20 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-900 border-neutral-700'
          }`} />
        </div>

        {/* Value Overlay */}
        <div className="text-center mt-2 space-y-0.5">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-3xl font-black tracking-tighter ${isLoading ? 'animate-pulse opacity-50' : ''}`} style={{ color: currentColor }}>
              {value}
            </span>
            <span className="text-[10px] text-neutral-500 font-bold">/ 100</span>
          </div>
          <div 
            className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-opacity-20 ${isLoading ? 'animate-pulse' : ''}`}
            style={{ 
              color: currentColor, 
              backgroundColor: `${currentColor}10`,
              borderColor: currentColor
            }}
          >
            {label}
          </div>
        </div>
      </div>

      <div className={`text-[10px] text-center font-medium font-sans leading-tight ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
        {value >= 50 
          ? "Bullish conviction is high. Institutional bidding supports upside premium." 
          : "Market is de-risking. High volatility expected as leverage is flushed."
        }
      </div>
    </div>
  );
};
