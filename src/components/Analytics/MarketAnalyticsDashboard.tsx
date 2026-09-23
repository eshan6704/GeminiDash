import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Flame,
  ShieldCheck,
  Activity,
  Gauge,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { VolatilityHeatmapWidget } from './VolatilityHeatmapWidget';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { CorrelationMatrix } from './CorrelationMatrix';
import { FearAndGreedIndex } from './FearAndGreedIndex';
import { AIStrategyBot } from './AIStrategyBot';
import { SentimentTrendWidget } from './SentimentTrendWidget';
import { CryptoScreener } from './CryptoScreener';

interface AnalyticsDashboardProps {
  currentBtcPrice?: number;
  currentPaxgPrice?: number;
}

export const MarketAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  currentBtcPrice = 96500,
  currentPaxgPrice = 2750,
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'pulse' | 'screener'>('pulse');
  const [fearGreedValue, setFearGreedValue] = useState<number>(78);
  const [fearGreedLabel, setFearGreedLabel] = useState<string>('EXTREME GREED');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real Fear & Greed index from Alternative.me API
  const fetchFearAndGreed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.alternative.me/fng/');
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          const val = parseInt(json.data[0].value, 10);
          const label = json.data[0].value_classification.toUpperCase();
          setFearGreedValue(val);
          setFearGreedLabel(label);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // Fallback
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFearAndGreed();
  }, []);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-xl border space-y-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/50'
      }`}
    >
      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/50 w-fit">
        <button
          onClick={() => setActiveTab('pulse')}
          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
            activeTab === 'pulse' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Market Pulse
        </button>
        <button
          onClick={() => setActiveTab('screener')}
          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
            activeTab === 'screener' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Crypto Screener
        </button>
      </div>

      {activeTab === 'pulse' ? (
        <>
          {/* HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Institutional Market Analytics & Macro Indicators
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Global sentiment index, Physical Gold hedge correlation, and Derivatives volatility skew
            </p>
          </div>
        </div>

        <button
          onClick={fetchFearAndGreed}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-amber-400'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Sentiment</span>
        </button>
      </div>

      {/* THREE ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        {/* CARD 1: FEAR & GREED INDEX */}
        <FearAndGreedIndex 
          value={fearGreedValue} 
          label={fearGreedLabel} 
          isLoading={isLoading} 
        />

        {/* CARD 2: GOLD VS BITCOIN HEDGE BETA */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              Gold (PAXG) vs Crypto Correlation
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Beta: -0.12</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">PAXG Fine Gold Spot:</span>
              <span className="font-bold text-amber-300">${currentPaxgPrice.toLocaleString()} / oz</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">BTC/USDT Spot:</span>
              <span className="font-bold text-white">${currentBtcPrice.toLocaleString()}</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full w-[35%]" />
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            PAXG maintains low correlation to crypto drawdowns. Holding 15-30% Gold spot buffers portfolio against liquidation cascades.
          </p>
        </div>

        {/* CARD 3: VOLATILITY SKEW & GAMMA */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-purple-400">
              <BarChart2 className="w-4 h-4" />
              Options Volatility Skew (25D)
            </span>
            <span className="text-[10px] text-purple-300 font-bold">+2.4% Call Premium</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-400">25D Call Skew:</span>
              <span className="font-bold text-emerald-400">+4.2% (Upside demand)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">ATM Implied Vol (IV):</span>
              <span className="font-bold text-cyan-400">54.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Gamma Risk Zone:</span>
              <span className="font-bold text-amber-400">$94,000 - $98,000</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            Positive skew indicates institutions are paying higher premiums for upside Call options vs downside Puts.
          </p>
        </div>
      </div>

      {/* VOLATILITY HEATMAP WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <VolatilityHeatmapWidget />
          <PerformanceHeatmap />
          <CorrelationMatrix />
        </div>
        <div className="space-y-4">
          <AIStrategyBot />
          <SentimentTrendWidget symbol="BTC" />
        </div>
      </div>
    </>
    ) : (
      <CryptoScreener />
    )}
    </div>
  );
};
