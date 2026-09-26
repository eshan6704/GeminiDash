import React from 'react';
import {
  Coins,
  Radio,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CryptoHeaderBarProps {
  cashBalance: number;
  totalEquity: number;
  isLiveConnected: boolean;
  goldHedgeRatio: number;
  cloudSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastCloudSync: number | null;
  onManualCloudSync: () => void;
  onOpenFirestoreModal: () => void; // Using generic name to keep it compatible with App.tsx for now
  onOpenWhatIf: () => void;
  onOpenAiReview: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onAddFunds: () => void;
}

export const CryptoHeaderBar: React.FC<CryptoHeaderBarProps> = ({
  cashBalance,
  totalEquity,
  isLiveConnected,
  goldHedgeRatio,
  cloudSyncStatus,
  lastCloudSync,
  onManualCloudSync,
  onOpenFirestoreModal,
  onOpenWhatIf,
  onOpenAiReview,
  onOpenSettings,
  onReset,
  onAddFunds,
}) => {
  return (
    <div
      className="p-3 sm:p-4 rounded-md border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-bold tracking-tight text-lg uppercase">
              AurumX
            </span>
          </div>

          {/* Connection status badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-sm border text-[9px] font-bold bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)] uppercase tracking-widest"
          >
            <Radio className={`w-3 h-3 ${isLiveConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
            <span>Live Feed Connected</span>
          </div>
        </div>

        {/* Quick Balance & Equity Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
          <div
            className="px-4 py-1.5 rounded-sm border flex items-center gap-4 bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]"
          >
            <div>
              <span className="text-[8px] block uppercase font-sans font-bold text-[var(--theme-text-muted)] tracking-widest">
                Total Equity
              </span>
              <span className="font-bold text-sm">
                ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-px h-6 bg-[var(--theme-border)]" />
            <div>
              <span className="text-[8px] block uppercase font-sans font-bold text-[var(--theme-text-muted)] tracking-widest">
                Free USDT
              </span>
              <span className="font-bold text-sm text-emerald-500">
                ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={onAddFunds}
              title="Add virtual USDT test funds"
              className="p-1 rounded-sm transition-colors text-[var(--theme-text-muted)] hover:text-emerald-400 hover:bg-[var(--theme-border)]"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Gold Hedge badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[9px] font-bold bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)] uppercase tracking-widest"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Gold Hedge: </span>
            <span className="text-emerald-500 font-bold">{goldHedgeRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-bold transition-all border bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] uppercase tracking-widest"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Scenario</span>
            <span className="sm:hidden">Sim</span>
          </button>

          <button
            onClick={onOpenAiReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-bold transition-all border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/40 uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">AI Review</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-sm text-xs transition-colors border bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)]"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-sm text-xs transition-colors border bg-[var(--theme-bg-card-subtle)] hover:bg-rose-950/60 hover:text-rose-400 text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)] hover:border-rose-800"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
