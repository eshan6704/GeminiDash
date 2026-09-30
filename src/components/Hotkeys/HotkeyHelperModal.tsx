import React from 'react';
import { Keyboard, X, Sparkles, Zap, Command, CornerDownLeft } from 'lucide-react';

interface HotkeyHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HOTKEY_ITEMS = [
  { key: 'B', action: 'Quick Open Buy Order panel / Buy mode', category: 'Trading' },
  { key: 'S', action: 'Quick Open Sell Order panel / Sell mode', category: 'Trading' },
  { key: '1', action: 'Switch Chart to 1m Timeframe', category: 'Chart' },
  { key: '5', action: 'Switch Chart to 5m Timeframe', category: 'Chart' },
  { key: '0', action: 'Switch Chart to 15m Timeframe', category: 'Chart' },
  { key: 'D', action: 'Switch Chart to 1D Timeframe', category: 'Chart' },
  { key: '/', action: 'Focus Top 250 Coins Search Bar', category: 'Navigation' },
  { key: 'A', action: 'Trigger Gemini AI Quantitative Coin Analysis', category: 'AI Intelligence' },
  { key: 'W', action: 'Toggle Watchlist & Pinned filter', category: 'Watchlist' },
  { key: 'O', action: 'Open Price & Whale Audio Alerts Modal', category: 'Alerts' },
  { key: '?', action: 'Show / Hide Keyboard Shortcuts Modal', category: 'Help' },
  { key: 'Esc', action: 'Close any active modal / overlay', category: 'Navigation' },
];

export const HotkeyHelperModal: React.FC<HotkeyHelperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                Pro Terminal Hotkeys
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Execute lightning-fast actions with keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 gap-2">
            {HOTKEY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {item.category}
                  </span>
                  <span className="text-[var(--theme-text-primary)] font-medium">
                    {item.action}
                  </span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono font-bold shadow-sm text-center min-w-[28px]">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--theme-text-secondary)]">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200">Esc</kbd> anytime to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
