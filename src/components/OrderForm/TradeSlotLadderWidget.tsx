import React, { useState } from 'react';
import {
  Position,
  MarketAsset,
  OrderSide,
  Candle,
  CandleTrendInfo,
} from '../../types/trading';
import {
  TRADE_TIER_CONFIGS,
  evaluateTradeEntryConditions,
  MAX_RUNNING_TRADES,
  TradeSlotEvaluation,
} from '../../utils/tradeEntryConditions';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Flame,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TradeSlotLadderWidgetProps {
  positions: Position[];
  asset: MarketAsset;
  side: OrderSide;
  cashBalance: number;
  totalEquity?: number;
  requiredMargin?: number;
  trend15m?: CandleTrendInfo;
  trend1h?: CandleTrendInfo;
  candles15m?: Candle[];
  candles1h?: Candle[];
  takeProfitPrice?: number;
  stopLossPrice?: number;
  compact?: boolean;
}

export const TradeSlotLadderWidget: React.FC<TradeSlotLadderWidgetProps> = ({
  positions,
  asset,
  side,
  cashBalance,
  totalEquity = 0,
  requiredMargin = 0,
  trend15m,
  trend1h,
  candles15m = [],
  candles1h = [],
  takeProfitPrice,
  stopLossPrice,
  compact = false,
}) => {
  const { isLight } = useTheme();
  const [showFullLadder, setShowFullLadder] = useState(false);
  const [showChecksList, setShowChecksList] = useState(false);

  const evaluation: TradeSlotEvaluation = evaluateTradeEntryConditions({
    runningPositions: positions,
    asset,
    side,
    cashBalance,
    totalEquity,
    requiredMargin,
    trend15m,
    trend1h,
    candles15m,
    candles1h,
    takeProfitPrice,
    stopLossPrice,
  });

  const runningCount = positions.length;
  const isFull = runningCount >= MAX_RUNNING_TRADES;
  const currentSlot = Math.min(10, runningCount + 1);

  // Difficulty badge colors
  const getDifficultyColor = (score: number) => {
    if (score <= 2) return isLight ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (score <= 4) return isLight ? 'text-cyan-800 bg-cyan-100 border-cyan-300' : 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    if (score <= 6) return isLight ? 'text-amber-900 bg-amber-100 border-amber-300' : 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    if (score <= 8) return isLight ? 'text-orange-900 bg-orange-100 border-orange-300' : 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    return isLight ? 'text-rose-900 bg-rose-100 border-rose-300' : 'text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  return (
    <div
      className={`rounded-xl border p-3 space-y-2.5 text-xs transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-neutral-950 border-neutral-800/80 text-neutral-100'
      }`}
    >
      {/* 1. Header & Live Trades Counter (X/10) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
            Running Live Trades
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              isFull
                ? isLight
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : runningCount >= 7
                ? isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isLight
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
          >
            {runningCount} / {MAX_RUNNING_TRADES} Active
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFullLadder(!showFullLadder)}
          className="text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
          title="View all 10 difficulty tiers"
        >
          <span>{showFullLadder ? 'Hide Ladder' : 'View 10-Tier Ladder'}</span>
          {showFullLadder ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* 2. Visual 10-Slot Segmented Track */}
      <div className="space-y-1">
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, i) => {
            const slotNum = i + 1;
            const isOccupied = slotNum <= runningCount;
            const isNext = slotNum === currentSlot && !isFull;
            const isUpcoming = slotNum > currentSlot;

            return (
              <div
                key={slotNum}
                className={`relative group h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${
                  isOccupied
                    ? isLight
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : isNext
                    ? evaluation.canEnter
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 animate-pulse ring-1 ring-emerald-500/40'
                        : 'bg-emerald-500/20 border-emerald-400 text-emerald-200 animate-pulse ring-1 ring-emerald-500/40'
                      : isLight
                      ? 'bg-amber-50 border-amber-500 text-amber-800 animate-pulse ring-1 ring-amber-500/40'
                      : 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse ring-1 ring-amber-500/40'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-400'
                    : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-600'
                }`}
                title={`Trade Slot #${slotNum}: ${TRADE_TIER_CONFIGS[slotNum].name} (Score: ${TRADE_TIER_CONFIGS[slotNum].difficultyScore}/10)`}
              >
                {isOccupied ? (
                  <span>#{slotNum}</span>
                ) : isNext ? (
                  <span className="text-[9px] font-sans font-extrabold uppercase">
                    #{slotNum}
                  </span>
                ) : (
                  <span className={isLight ? 'text-slate-400' : 'text-neutral-600'}>#{slotNum}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className={`flex justify-between text-[9px] font-mono px-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
          <span className="text-emerald-600 font-medium">Slot #1: Min Easy</span>
          <span className="text-amber-600 font-medium">Slot #5: Rigorous</span>
          <span className="text-rose-600 font-medium">Slot #10: Toughest</span>
        </div>
      </div>

      {/* 3. Slot Status & Gating Banner */}
      {isFull ? (
        <div
          className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
            isLight
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Max 10 Running Trades Reached</strong>
            <span className={`leading-tight block text-[10px] ${isLight ? 'text-rose-800' : 'text-rose-300/90'}`}>
              The simulator enforces a maximum limit of 10 concurrent running trades. Close an active position before opening a new one.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Active Slot Header */}
          <div
            className={`flex items-center justify-between p-2 rounded-lg border ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Next Trade:</span>
              <strong className={`font-semibold text-[11px] ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                Slot #{evaluation.slotNumber} ({evaluation.tier.name})
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getDifficultyColor(
                  evaluation.tier.difficultyScore
                )}`}
              >
                {evaluation.tier.difficultyBadge}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  evaluation.canEnter
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isLight
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {evaluation.canEnter ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Eligible</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-amber-600" />
                    <span>{evaluation.unmetReasons.length} Pending</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Expandable Criteria Checklist */}
          {!compact && (
            <div className="space-y-1 pt-0.5">
              <button
                type="button"
                onClick={() => setShowChecksList(!showChecksList)}
                className={`w-full flex items-center justify-between text-[10px] font-medium py-0.5 ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>
                  Slot #{evaluation.slotNumber} Condition Checklist ({evaluation.checks.filter((c) => c.passed).length}/{evaluation.checks.length} Met):
                </span>
                <span className="text-amber-600 font-semibold">{showChecksList ? 'Collapse' : 'Expand'}</span>
              </button>

              {showChecksList && (
                <div
                  className={`space-y-1 p-2 rounded-lg border max-h-48 overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/50 border-neutral-800/60'
                  }`}
                >
                  {evaluation.checks.map((check) => (
                    <div
                      key={check.id}
                      className={`flex items-start justify-between gap-2 text-[10px] py-1 border-b last:border-b-0 ${
                        isLight ? 'border-slate-100' : 'border-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        {check.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="leading-tight">
                          <span className={`font-semibold block ${
                            check.passed
                              ? isLight ? 'text-slate-900' : 'text-neutral-200'
                              : isLight ? 'text-rose-700' : 'text-rose-300'
                          }`}>
                            {check.name}
                          </span>
                          <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                            Req: {check.requirement}
                          </span>
                          <span className={`text-[9px] block ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                            {check.explanation}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                          check.passed
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : isLight
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {check.currentValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Full 10-Tier Ladder Reference (Dropdown) */}
      {showFullLadder && (
        <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-slate-200' : 'border-neutral-800/80'}`}>
          <div className={`flex items-center justify-between text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              10-Tier Progressive Entry Difficulty Hierarchy
            </span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
              Trade 1 (Easy) → Trade 10 (Toughest)
            </span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {Object.values(TRADE_TIER_CONFIGS).map((tier) => {
              const isCurrent = tier.slotNumber === currentSlot;
              const isPassed = tier.slotNumber <= runningCount;

              return (
                <div
                  key={tier.slotNumber}
                  className={`p-2 rounded-lg border text-[10px] transition-colors ${
                    isCurrent
                      ? isLight
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : isPassed
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                        Slot #{tier.slotNumber}
                      </span>
                      <strong className={isLight ? 'text-slate-900' : 'text-neutral-200'}>{tier.name}</strong>
                      {isCurrent && (
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
                          isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          Current Slot
                        </span>
                      )}
                      {isPassed && (
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
                          isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          Active
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${getDifficultyColor(
                        tier.difficultyScore
                      )}`}
                    >
                      Diff {tier.difficultyScore}/10 ({tier.difficulty})
                    </span>
                  </div>

                  <p className={`text-[9px] mb-1 leading-snug ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                    {tier.description}
                  </p>

                  <div className={`space-y-0.5 text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    {tier.rulesOverview.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className={isLight ? 'text-slate-400' : 'text-neutral-500'}>•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
