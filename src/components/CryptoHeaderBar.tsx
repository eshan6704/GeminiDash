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
  onOpenWhatIf,
  onOpenAiReview,
  onOpenSettings,
  onReset,
  onAddFunds,
}) => {
  const { isLight } = useTheme();

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border shadow-lg transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-neutral-900 border-neutral-800 text-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Coins className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  AurumX
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  Binance Live Feed
                </span>
              </div>
            </div>
          </div>

          {/* Connection status badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
            title="100% Genuine Binance & Bitfinex real-time WebSocket ticks (No simulation)"
          >
            <Radio className={`w-3 h-3 ${isLiveConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
            <span className="text-[11px] font-medium flex items-center gap-1">
              <span className="text-amber-500 font-bold">Binance</span> & <span className="text-emerald-500 font-bold">Bitfinex</span>
              <span className={isLight ? 'text-slate-500 text-[10px]' : 'text-neutral-400 text-[10px]'}>WS</span>
            </span>
          </div>

          {/* Shark Exchange Broker Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono ${
              isLight
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
            }`}
            title="Shark Exchange: 0.016% Maker / 0.064% Taker (4x Maker)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-semibold font-sans">Shark Exchange</span>
            <span className="opacity-40">•</span>
            <span>0.016% M / 0.064% T</span>
          </div>
        </div>

        {/* Quick Balance & Equity Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950/80 border-neutral-800 text-white'
            }`}
          >
            <div>
              <span className={`text-[10px] block uppercase font-sans font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                Total Equity
              </span>
              <span className={`font-bold text-sm font-mono ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`w-px h-6 ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`} />
            <div>
              <span className={`text-[10px] block uppercase font-sans font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                Free USDT
              </span>
              <span className="font-bold text-sm text-emerald-500 font-mono">
                ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={onAddFunds}
              title="Add virtual USDT test funds"
              className={`p-1 rounded-lg transition-colors ${
                isLight ? 'text-slate-400 hover:text-emerald-600 hover:bg-slate-200' : 'text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Gold Hedge badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-amber-950/30 border-amber-600/30 text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Gold Hedge: </span>
            <span className="font-bold font-mono">{goldHedgeRatio.toFixed(1)}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWhatIf}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">What If?</span>
            <span className="sm:hidden">Sim</span>
          </button>

          <button
            onClick={onOpenAiReview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isLight
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border-amber-400/60'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border-amber-500/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">AI Risk Review</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl text-xs transition-colors border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Slippage & Fee Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className={`p-2 rounded-xl text-xs transition-colors border ${
              isLight
                ? 'bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 border-slate-300 hover:border-rose-300'
                : 'bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-400 border-neutral-700 hover:border-rose-800'
            }`}
            title="Reset simulation to initial balance"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
