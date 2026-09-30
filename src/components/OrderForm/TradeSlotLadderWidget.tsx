import React from 'react';
import {
  Position,
  MarketAsset,
  OrderSide,
} from '../../types/trading';
import {
  MAX_RUNNING_TRADES,
} from '../../utils/tradeEntryConditions';
import {
  Layers,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TradeSlotLadderWidgetProps {
  positions: Position[];
  asset?: MarketAsset;
  side?: OrderSide;
  cashBalance?: number;
  totalEquity?: number;
  requiredMargin?: number;
  compact?: boolean;
}

export const TradeSlotLadderWidget: React.FC<TradeSlotLadderWidgetProps> = ({
  positions,
}) => {
  const { isLight } = useTheme();

  const manualPositions = positions.filter((p) => p.accountSource !== 'AUTO_GRID');
  const runningCount = manualPositions.length;
  const isFull = runningCount >= MAX_RUNNING_TRADES;

  return (
    <div
      className={`rounded-sm border p-3 space-y-2 text-xs transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-primary)]'
      }`}
    >
      {/* Header & Manual Live Trades Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-secondary)]">
            Running Live Trades (Manual)
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold border ${
            isFull
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {runningCount} / {MAX_RUNNING_TRADES} Active
        </span>
      </div>

      {isFull && (
        <div
          className={`p-2 rounded-sm border text-[10px] flex items-start gap-2 ${
            isLight
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Max 10 Running Trades Reached</strong>
            <span className="leading-tight block text-[9px] opacity-90">
              Close an active position before opening a new manual trade.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
