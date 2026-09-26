import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  HardDrive,
  CloudOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { subscribeSyncStatus, SyncStatusInfo } from '../services/simulatorSyncService';

interface Props {
  totalPnL: number;
  winRate: number;
  totalTrades?: number;
}

export const AccountPulseWidget: React.FC<Props> = ({ totalPnL, winRate, totalTrades = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo | null>(null);

  // Subscribe to B2 Sync status
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncInfo);
    return () => unsubscribe();
  }, []);

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

  const renderSyncIndicator = () => {
    if (!syncInfo) return null;

    const { status, lastSyncedAt } = syncInfo;
    
    let colorClass = 'text-neutral-400';
    let label = 'B2 Idle';
    let Icon = HardDrive;
    let isSpinning = false;

    if (status === 'syncing') {
      colorClass = 'text-amber-500';
      label = 'Syncing...';
      Icon = RefreshCw;
      isSpinning = true;
    } else if (status === 'success') {
      colorClass = 'text-emerald-500';
      label = lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'B2 Active';
      Icon = CheckCircle2;
    } else if (status === 'error') {
      colorClass = 'text-rose-500';
      label = 'B2 Error';
      Icon = CloudOff;
    }

    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold border transition-all bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]"
        title={`B2 Institutional Sync Status: ${status.toUpperCase()}${syncInfo.error ? ` - ${syncInfo.error}` : ''}`}
      >
        <Icon className={`w-3 h-3 ${colorClass} ${isSpinning ? 'animate-spin' : ''}`} />
        <span className={colorClass}>{label}</span>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-end -mt-1 -mb-1">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all shadow-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
          title="Expand Account Pulse Status"
        >
          <Activity className="w-3 h-3 text-emerald-500" />
          <span>Account Pulse</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 rounded-md border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] flex items-center justify-between gap-3 text-xs transition-colors">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1 rounded-sm bg-emerald-500/10 text-emerald-500 shrink-0">
          {isProfit ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : isDrawdown ? (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Activity className="w-3.5 h-3.5" />
          )}
        </div>
        <p className="font-medium text-[11px] sm:text-xs truncate leading-snug tracking-tight">
          {summary}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* B2 Sync Indicator */}
        {renderSyncIndicator()}

        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)]"
        >
          <span>PNL:</span>
          <span className={totalPnL > 0 ? 'text-emerald-500' : totalPnL < 0 ? 'text-rose-400' : ''}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </span>
          <span className="opacity-10">/</span>
          <span>WIN: {winRate.toFixed(1)}%</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-sm transition-colors hover:bg-[var(--theme-border)] text-[var(--theme-text-muted)]"
          title="Minimize"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

