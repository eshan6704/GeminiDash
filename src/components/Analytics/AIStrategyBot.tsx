import React, { useEffect, useState } from 'react';
import { Bot, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchCandles, INITIAL_ASSETS } from '../../services/marketData';
import { calculateRSI } from '../../utils/indicators';

interface StrategySuggestion {
  symbol: string;
  rsi: number;
  condition: 'Overbought' | 'Oversold' | 'Neutral';
  action: string;
  reason: string;
}

export const AIStrategyBot: React.FC = () => {
  const { isLight } = useTheme();
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeMarket = async () => {
    setIsLoading(true);
    try {
      const symbols = Object.keys(INITIAL_ASSETS);
      const rsiData: Record<string, number> = {};

      for (const symbol of symbols) {
        const candles = await fetchCandles(symbol, '1h');
        const prices = candles.map(c => c.close);
        const rsi = calculateRSI(prices);
        if (rsi !== null) {
          rsiData[symbol] = rsi;
        }
      }

      const response = await fetch('/api/gemini/strategy-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsiData }),
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('AI Strategy Bot error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeMarket();
  }, []);

  return (
    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          <h3 className="font-black text-sm uppercase tracking-wider text-indigo-400">AI Strategy Bot (v1.0)</h3>
        </div>
        <button 
          onClick={analyzeMarket}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.length === 0 && !isLoading && (
          <div className="text-center py-4 text-neutral-500 text-xs italic">
            Scanning market for high-probability setups...
          </div>
        )}
        
        {suggestions.map((s, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
              s.condition === 'Oversold' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : s.condition === 'Overbought'
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-neutral-800/30 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{s.symbol} <span className="text-neutral-500 ml-1">RSI: {s.rsi.toFixed(1)}</span></span>
              <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                s.condition === 'Oversold' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {s.condition}
              </span>
            </div>
            <div className="flex items-start gap-2">
              {s.condition === 'Oversold' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold text-neutral-200">{s.action}</p>
                <p className="text-[10px] text-neutral-400 leading-tight mt-1">{s.reason}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-3">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400 font-mono">Neural Market Scan in Progress...</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-[10px] text-neutral-500 uppercase font-mono">Strategy Engine: Gemini-3.5-Flash</span>
        <span className="text-[10px] text-neutral-600 font-mono">Scan Freq: 15m</span>
      </div>
    </div>
  );
};
