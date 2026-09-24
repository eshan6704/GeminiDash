import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown, Activity, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  totalPnL: number;
  winRate: number;
  totalTrades?: number;
}

export const AccountPulseWidget: React.FC<Props> = ({ totalPnL, winRate, totalTrades = 0 }) => {
  const { isLight, theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const getInitialStatus = () => {
    if (totalTrades === 0 || (Math.abs(totalPnL) < 0.01 && winRate === 0)) {
      return 'Account baseline active. Ready to deploy orders across Spot & Perpetuals. Key support & liquidity intact.';
    }
    if (totalPnL > 0 && winRate > 0) {
      return `Trading performance: Profitable (+$${totalPnL.toFixed(2)}) with a ${winRate.toFixed(1)}% win rate across ${totalTrades} trade(s).`;
    }
    if (totalPnL > 0 && winRate === 0) {
      return `Trading performance: Floating gain of +$${totalPnL.toFixed(2)}. Trailing stops active; awaiting trade completion.`;
    }
    if (totalPnL < 0 && winRate === 0) {
      return `Trading performance: Drawdown of -$${Math.abs(totalPnL).toFixed(2)} across ${totalTrades} trade(s). Protect capital near key support levels.`;
    }
    if (totalPnL < 0) {
      return `Trading performance: Loss-making (-$${Math.abs(totalPnL).toFixed(2)}) with a ${winRate.toFixed(1)}% win rate. Keep monitoring key support levels.`;
    }
    return `Trading performance: Break-even baseline across ${totalTrades} trade(s). Monitoring key market levels.`;
  };

  const [summary, setSummary] = useState<string>(getInitialStatus());

  useEffect(() => {
    // If no trades yet, immediately set clear baseline status without delay
    if (totalTrades === 0 || (Math.abs(totalPnL) < 0.01 && winRate === 0)) {
      setSummary('Account baseline active. Ready to deploy orders across Spot & Perpetuals. Key support & liquidity intact.');
      return;
    }

    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/gemini/account-pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalPnL, winRate, totalTrades }),
        });
        const data = await response.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (err) {
        setSummary(getInitialStatus());
      }
    };
    fetchSummary();
  }, [totalPnL, winRate, totalTrades]);

  const isProfit = totalPnL > 0;
  const isDrawdown = totalPnL < 0;

  if (isCollapsed) {
    return (
      <div className="flex justify-end -mt-1 -mb-1">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all shadow-xs ${
            isLight
              ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Expand Account Pulse Status"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Account Pulse</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 rounded-xl border bg-amber-50/90 border-amber-200 text-amber-950 flex items-center justify-between gap-3 text-xs transition-colors shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 shrink-0">
          {isProfit ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          ) : isDrawdown ? (
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          )}
        </div>
        <p className="font-medium text-[11px] sm:text-xs truncate leading-snug">
          {summary}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
            isLight
              ? 'bg-white/80 border-amber-200 text-slate-800'
              : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-300'
          }`}
        >
          <span>PnL:</span>
          <span className={totalPnL > 0 ? 'text-emerald-500 font-bold' : totalPnL < 0 ? 'text-rose-400 font-bold' : ''}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </span>
          <span className="opacity-40">|</span>
          <span>Win: {winRate.toFixed(1)}%</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className={`p-1 rounded-md transition-colors ${
            isLight ? 'hover:bg-amber-100 text-amber-800' : 'hover:bg-amber-500/20 text-amber-300'
          }`}
          title="Minimize to maximize trading screen area"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

