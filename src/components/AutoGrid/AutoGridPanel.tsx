import React, { useState } from 'react';
import {
  MarketAsset,
  Position,
  SimulatorConfig,
  AutoGridConfig,
  AutoGridRuntimeState,
  AutoGridLogItem,
  AutoGridDirectionMode,
  AutoGridTimeframeFilter,
  AutoGridSpacingMode,
  GridLadderLevel,
} from '../../types/trading';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ListFilter,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { MAX_RUNNING_TRADES, TRADE_TIER_CONFIGS } from '../../utils/tradeEntryConditions';

interface AutoGridPanelProps {
  asset: MarketAsset;
  cashBalance: number;
  config: SimulatorConfig;
  gridConfig: AutoGridConfig;
  runtime: AutoGridRuntimeState;
  gridLadder?: GridLadderLevel[];
  downsideLadder?: GridLadderLevel[];
  positions?: Position[];
  onOpenWhatIf?: () => void;
  onStartBot: (basePrice?: number) => void;
  onPauseBot: () => void;
  onResumeBot: () => void;
  onStopBot: (closePosition?: boolean) => void;
  onResetBot: () => void;
  onUpdateConfig: (partial: Partial<AutoGridConfig>) => void;
  onApplyGoldPreset: () => void;
  onApplyBtcPreset: () => void;
  onClearLogs: () => void;
  onRefreshTrends?: () => void;
}

export const AutoGridPanel: React.FC<AutoGridPanelProps> = ({
  asset,
  cashBalance,
  config,
  gridConfig,
  runtime,
  gridLadder = [],
  downsideLadder = [],
  positions = [],
  onOpenWhatIf,
  onStartBot,
  onPauseBot,
  onResumeBot,
  onStopBot,
  onResetBot,
  onUpdateConfig,
  onApplyGoldPreset,
  onApplyBtcPreset,
  onClearLogs,
  onRefreshTrends,
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [ladderTab, setLadderTab] = useState<'ALL' | 'UPSIDE' | 'DOWNSIDE'>('ALL');
  const [customAnchorInput, setCustomAnchorInput] = useState<string>(
    gridConfig.basePriceAnchor ? gridConfig.basePriceAnchor.toString() : asset.price.toString()
  );

  const isGold = asset.category === 'gold' || asset.symbol === 'XAUT';
  const isRunning = gridConfig.enabled && (runtime.status === 'WAITING_FOR_ENTRY' || runtime.status === 'IN_POSITION');
  const inPosition = runtime.status === 'IN_POSITION' && runtime.entryPrice !== undefined;

  const activeSide = runtime.activeSide || gridConfig.side || 'BUY';
  const isLong = activeSide === 'BUY';

  // Real-time calculations for HUD (symmetrical for Long & Short)
  const curPrice = asset.price;
  const entryPrice = runtime.entryPrice || (isLong ? runtime.basePrice + gridConfig.entryOffset : runtime.basePrice - gridConfig.entryOffset);
  const pointsGain = inPosition
    ? (isLong ? curPrice - runtime.entryPrice! : runtime.entryPrice! - curPrice)
    : 0;

  const peakGain = inPosition
    ? (isLong
        ? (runtime.highestPriceReached || curPrice) - runtime.entryPrice!
        : runtime.entryPrice! - (runtime.lowestPriceReached || curPrice))
    : 0;

  const currentSL = runtime.currentTrailingSL || (isLong ? entryPrice + gridConfig.initialSlOffset : entryPrice - gridConfig.initialSlOffset);

  // Calculate estimated margin for the configured lot size
  const tradeValue = curPrice * gridConfig.lotSize;
  const requiredMargin = gridConfig.leverage > 0 ? tradeValue / gridConfig.leverage : tradeValue;

  return (
    <div className="flex flex-col space-y-3 text-neutral-200">
      {/* 1. Header & Live Status HUD */}
      <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Auto Grid Trader
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                runtime.status === 'IN_POSITION'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : runtime.status === 'WAITING_FOR_ENTRY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : runtime.status === 'PAUSED'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : runtime.status === 'COMPLETED'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {runtime.status.replace('_', ' ')}
            </span>

            {/* Active Direction Badge (BUY LONG vs SELL SHORT) */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isLong
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
              }`}
            >
              {isLong ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span>BUY (LONG)</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                  <span>SELL (SHORT)</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-neutral-400">
              Cycle <strong className="text-neutral-200">{runtime.currentCycle}</strong>/{gridConfig.maxGridCycles}
            </span>
            <span className="text-neutral-600">•</span>
            <span
              className={`font-semibold ${
                runtime.totalRealizedPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {runtime.totalRealizedPoints >= 0 ? '+' : ''}
              {runtime.totalRealizedPoints.toFixed(1)} pts
            </span>
          </div>
        </div>

        {/* Candle Trend Direction Monitor HUD */}
        <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Trend Direction Signal (1h / 15m Candle):</span>
            </div>
            {onRefreshTrends && (
              <button
                type="button"
                onClick={onRefreshTrends}
                className="text-[10px] text-neutral-400 hover:text-amber-400 flex items-center gap-1"
                title="Refresh 1h & 15m candle trends"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Sync</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {/* 15m Candle status */}
            <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-sans font-medium">15m Candle:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    runtime.trend15m?.direction === 'BULLISH'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : runtime.trend15m?.direction === 'BEARISH'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {runtime.trend15m?.direction || 'ANALYZING...'}
                </span>
              </div>
              <span className={runtime.trend15m && runtime.trend15m.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {runtime.trend15m ? `${runtime.trend15m.changePercent >= 0 ? '+' : ''}${runtime.trend15m.changePercent.toFixed(2)}%` : '--'}
              </span>
            </div>

            {/* 1h Candle status */}
            <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-sans font-medium">1h Hourly:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    runtime.trend1h?.direction === 'BULLISH'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : runtime.trend1h?.direction === 'BEARISH'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {runtime.trend1h?.direction || 'ANALYZING...'}
                </span>
              </div>
              <span className={runtime.trend1h && runtime.trend1h.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {runtime.trend1h ? `${runtime.trend1h.changePercent >= 0 ? '+' : ''}${runtime.trend1h.changePercent.toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Running Trades & Progressive Entry Difficulty HUD */}
        <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Trade Capacity & Entry Difficulty:</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${
                positions.length >= MAX_RUNNING_TRADES
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}
            >
              {positions.length} / {MAX_RUNNING_TRADES} Active
            </span>
          </div>

          {/* 10-slot visual indicators */}
          <div className="grid grid-cols-10 gap-0.5 pt-0.5">
            {Array.from({ length: 10 }, (_, i) => {
              const slotIdx = i + 1;
              const isOccupied = slotIdx <= positions.length;
              const isTargetSlot = slotIdx === Math.min(10, positions.length + 1) && positions.length < MAX_RUNNING_TRADES;
              return (
                <div
                  key={slotIdx}
                  className={`h-3 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                    isOccupied
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : isTargetSlot
                      ? 'bg-amber-400 text-neutral-950 animate-pulse ring-1 ring-amber-300'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                  title={`Slot #${slotIdx}: ${TRADE_TIER_CONFIGS[slotIdx]?.name} (${TRADE_TIER_CONFIGS[slotIdx]?.difficultyBadge})`}
                >
                  {slotIdx}
                </div>
              );
            })}
          </div>

          {/* Entry gating status banner */}
          {positions.length >= MAX_RUNNING_TRADES ? (
            <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Max 10 live trades reached. Auto Grid entry paused until a position closes.</span>
            </div>
          ) : runtime.status === 'WAITING_FOR_ENTRY' ? (
            <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800/80 text-[10px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Next Entry:</span>
                <strong className="text-amber-300 font-semibold">
                  Slot #{runtime.slotNumber || positions.length + 1} ({runtime.slotTierName || TRADE_TIER_CONFIGS[positions.length + 1]?.name || 'Pioneer'})
                </strong>
                <span className="text-neutral-500 font-mono text-[9px]">
                  ({runtime.slotDifficulty || TRADE_TIER_CONFIGS[positions.length + 1]?.difficultyBadge})
                </span>
              </div>
              {runtime.slotUnmetReason ? (
                <span className="text-amber-400 font-mono text-[9px] max-w-[160px] truncate" title={runtime.slotUnmetReason}>
                  Gating: {runtime.slotUnmetReason}
                </span>
              ) : (
                <span className="text-emerald-400 font-mono text-[9px]">Conditions Ready</span>
              )}
            </div>
          ) : null}
        </div>

        {/* Live In-Position HUD */}
        {inPosition ? (
          <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Chasing {isLong ? 'High Peak' : 'Low Trough'}:</span>
                <span className="font-mono text-neutral-100">
                  ${(isLong ? runtime.highestPriceReached : runtime.lowestPriceReached)?.toFixed(2)} (+{peakGain.toFixed(1)} pts gain)
                </span>
              </div>
              <div className="font-mono font-bold text-emerald-400">
                Live: {pointsGain >= 0 ? '+' : ''}
                {pointsGain.toFixed(2)} pts (${(pointsGain * gridConfig.lotSize).toFixed(2)} USDT)
              </div>
            </div>

            {/* Dynamic Step Visualization */}
            <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-mono">
              <div className="p-1 rounded bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block text-[9px]">Entry ({activeSide})</span>
                <span className="text-neutral-200 font-semibold">${runtime.entryPrice?.toFixed(1)}</span>
              </div>
              <div className="p-1 rounded bg-rose-950/30 border border-rose-500/20">
                <span className="text-rose-400 block text-[9px]">Initial SL</span>
                <span className="text-rose-300 font-semibold">{isLong ? gridConfig.initialSlOffset : `+${Math.abs(gridConfig.initialSlOffset)}`} pts</span>
              </div>
              <div className={`p-1 rounded border transition-colors ${
                runtime.isChasingActivated
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/20 border-amber-500/20 text-amber-400'
              }`}>
                <span className="block text-[9px] font-sans">
                  {runtime.isChasingActivated ? 'Triggered' : 'Activate at'}
                </span>
                <span className="font-semibold">&gt;+{gridConfig.profitActivationThreshold ?? 25} pts</span>
              </div>
              <div className={`p-1 rounded border transition-colors ${
                runtime.isChasingActivated
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}>
                <span className="block text-[9px] font-sans">Locked SL</span>
                <span className="font-semibold">{isLong ? '+' : '-'}{gridConfig.lockedProfitSlOffset ?? 15} pts</span>
              </div>
              <div className="p-1 rounded bg-cyan-950/40 border border-cyan-500/30">
                <span className="text-cyan-400 block text-[9px] font-sans">Current SL</span>
                <span className="text-cyan-300 font-semibold">
                  ${currentSL.toFixed(1)} ({isLong ? (currentSL - runtime.entryPrice! >= 0 ? '+' : '') : (runtime.entryPrice! - currentSL >= 0 ? '+' : '')}
                  {(isLong ? currentSL - runtime.entryPrice! : runtime.entryPrice! - currentSL).toFixed(1)} pts)
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Entry (${runtime.entryPrice?.toFixed(1)})</span>
                <span className="text-amber-300 font-semibold">
                  Locked ({isLong ? '+' : '-'}{gridConfig.lockedProfitSlOffset ?? 15} pts)
                </span>
                <span className="text-cyan-300 font-semibold">Extreme (+{peakGain.toFixed(1)} pts)</span>
              </div>
              <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800 relative">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: '30%' }}
                  title={`Activation Threshold: >+${gridConfig.profitActivationThreshold ?? 25} pts`}
                />
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((peakGain > 0 ? (isLong ? currentSL - runtime.entryPrice! : runtime.entryPrice! - currentSL) : 0) / (Math.max(peakGain, 80) || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : runtime.status === 'WAITING_FOR_ENTRY' ? (
          <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                Waiting for {activeSide} Entry Trigger
              </span>
              <p className="text-[11px] text-neutral-400">
                Target Price: <strong className="text-neutral-100 font-mono">${runtime.targetEntryPrice.toFixed(2)}</strong> ({isLong ? '+' : '-'}{gridConfig.entryOffset} pts from base ${runtime.basePrice.toFixed(2)})
              </p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-neutral-500 block">Distance to Entry</span>
              <span className="text-amber-300 font-bold">
                {Math.abs(runtime.targetEntryPrice - curPrice).toFixed(2)} pts
              </span>
            </div>
          </div>
        ) : null}

        {/* Strategy Presets */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
            Strategy Presets:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onApplyGoldPreset}
              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold transition-colors flex items-center gap-1"
              title="Gold XAUT Spec: 1h/15m Auto Direction (Buy/Sell), Spacing 50 pts, Entry ±2.5, SL ±50, Profit Lock @ +25 -> +15, Trail 10, Pullback 5, 0.1 size, 75x"
            >
              <span>Gold (XAUT) Spec</span>
            </button>
            <button
              type="button"
              onClick={onApplyBtcPreset}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold transition-colors"
              title="BTC Scalp Spec: 1h/15m Auto Direction, Spacing 500 pts, Entry ±25, SL ±500, Profit Lock @ +250 -> +150, Trail 100, Pullback 50, 0.002 BTC, 100x"
            >
              <span>BTC Scalp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Control Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={() => onStartBot(parseFloat(customAnchorInput) || asset.price)}
            className="col-span-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Auto Grid ({activeSide})</span>
          </button>
        ) : runtime.status === 'PAUSED' ? (
          <button
            type="button"
            onClick={onResumeBot}
            className="col-span-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Bot</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPauseBot}
            className="col-span-2 py-2 px-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-neutral-950 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause Bot</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onStopBot(inPosition)}
          disabled={runtime.status === 'IDLE'}
          className="py-2 px-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Stop Bot & Close Open Positions"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

        <button
          type="button"
          onClick={onResetBot}
          className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
          title="Reset statistics & cycles"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3. Configurable Parameters Form (All editable) */}
      <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Strategy Parameters & Direction Filters</span>
          </div>
          <button type="button" className="text-neutral-400 hover:text-neutral-200">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-1 text-xs">
            {/* Direction & Candle Timeframe Filter Control */}
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Trade Direction Strategy (BUY / SELL / AUTO)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Active Execution: <strong className={isLong ? 'text-emerald-400' : 'text-rose-400'}>{activeSide}</strong>
                </span>
              </div>

              {/* Quick Direction Selector Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ directionMode: 'AUTO_TREND' })}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    (gridConfig.directionMode || 'AUTO_TREND') === 'AUTO_TREND'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">Auto Trend</span>
                  <span className="block text-[9px] text-neutral-500 font-normal">1h / 15m Signal</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateConfig({ directionMode: 'BUY_ONLY', side: 'BUY' })}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    gridConfig.directionMode === 'BUY_ONLY'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">BUY (Long)</span>
                  <span className="block text-[9px] text-emerald-500/70 font-normal">Pyramid Up / Avg Down</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateConfig({ directionMode: 'SELL_ONLY', side: 'SELL' })}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    gridConfig.directionMode === 'SELL_ONLY'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs">SELL (Short)</span>
                  <span className="block text-[9px] text-rose-500/70 font-normal">Pyramid Down / Avg Up</span>
                </button>
              </div>

              {gridConfig.directionMode === 'AUTO_TREND' && (
                <div className="pt-1 flex items-center justify-between">
                  <label className="text-[10px] text-neutral-400">
                    Candle Confluence Filter:
                  </label>
                  <select
                    value={gridConfig.timeframeFilter || 'CONFLUENCE'}
                    onChange={(e) => onUpdateConfig({ timeframeFilter: e.target.value as AutoGridTimeframeFilter })}
                    className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="CONFLUENCE">Confluence (1h + 15m)</option>
                    <option value="1h">1-Hour (1h Candle)</option>
                    <option value="15m">15-Minute (15m Candle)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 1: Grid Multipliers, Spacing & Entry Offset */}
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Pyramiding (Trend) & Averaging (DCA) Multipliers</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Pyramid: <strong className="text-emerald-300">{((gridConfig.gridSpacing || 50) * (gridConfig.upsideMultiplier ?? 0.5)).toFixed(1)} pts</strong> | Avg: <strong className="text-rose-300">{((gridConfig.gridSpacing || 50) * (gridConfig.downsideMultiplier ?? 1.0)).toFixed(1)} pts</strong>
                </span>
              </div>

              {/* Multipliers row: Pyramiding (Upside) and Averaging (Downside) Multipliers */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span className="text-emerald-400 font-semibold">Pyramiding Multiplier</span>
                    <span className="text-[9px] text-emerald-400/80 font-mono">Def: 0.5x</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={gridConfig.upsideMultiplier ?? 0.5}
                      onChange={(e) => onUpdateConfig({ upsideMultiplier: parseFloat(e.target.value) || 0.5 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">x</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Trend gap = G * {(gridConfig.upsideMultiplier ?? 0.5)} = {((gridConfig.gridSpacing || 50) * (gridConfig.upsideMultiplier ?? 0.5)).toFixed(1)} pts</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span className="text-rose-400 font-semibold">Averaging Multiplier</span>
                    <span className="text-[9px] text-rose-400/80 font-mono">Def: 1.0x</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={gridConfig.downsideMultiplier ?? 1.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1.0;
                        onUpdateConfig({ downsideMultiplier: val, downsideGapMultiplier: val * 2 });
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-rose-300 text-xs focus:outline-none focus:border-rose-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">x</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Pullback gap = G * {(gridConfig.downsideMultiplier ?? 1.0)} = {((gridConfig.gridSpacing || 50) * (gridConfig.downsideMultiplier ?? 1.0)).toFixed(1)} pts</span>
                </div>
              </div>

              {/* Standard Spacing & Offset */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Grid Spacing ({isGold ? 'points / $' : 'USDT'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={gridConfig.gridSpacing}
                      onChange={(e) => onUpdateConfig({ gridSpacing: parseFloat(e.target.value) || 50 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Base grid spacing (e.g. 50)</span>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Entry Trigger Offset (±pts)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={gridConfig.entryOffset}
                      onChange={(e) => onUpdateConfig({ entryOffset: parseFloat(e.target.value) || 2.5 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Buy: Base+2.5 | Sell: Base-2.5</span>
                </div>
              </div>
            </div>

            {/* 10-Level Progressive Dual Grid Price Ladder Preview */}
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-200">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dual-Ladder Price Preview ({activeSide} Strategy)</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {onOpenWhatIf && (
                    <button
                      type="button"
                      onClick={onOpenWhatIf}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>'What If' Preview Chart</span>
                    </button>
                  )}

                  {/* Tab selector */}
                  <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800 text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={() => setLadderTab('ALL')}
                      className={`px-1.5 py-0.5 rounded ${ladderTab === 'ALL' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Dual
                    </button>
                    <button
                      type="button"
                      onClick={() => setLadderTab('UPSIDE')}
                      className={`px-1.5 py-0.5 rounded ${ladderTab === 'UPSIDE' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Up (+25)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLadderTab('DOWNSIDE')}
                      className={`px-1.5 py-0.5 rounded ${ladderTab === 'DOWNSIDE' ? 'bg-rose-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Down (-50)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Formula & Rule Callout */}
              <div className="p-2 rounded bg-neutral-950/80 border border-neutral-800/80 text-[10px] text-neutral-300 leading-relaxed font-mono space-y-1">
                <div>
                  <span className="text-amber-400 font-bold">1st Trade Trigger:</span>{' '}
                  ${((gridConfig.basePriceAnchor || runtime.basePrice || curPrice) + (isLong ? gridConfig.entryOffset : -gridConfig.entryOffset)).toFixed(2)} ({activeSide})
                  <span className="text-[9px] text-neutral-400 ml-2">(Multiple of G: {(gridConfig.gridSpacing || 50)})</span>
                </div>
                <div className="text-emerald-400">
                  <strong>▲ Pyramiding ({isLong ? 'Trend Up' : 'Trend Down'}):</strong> Gap = G * {(gridConfig.upsideMultiplier ?? 0.5)} = {((gridConfig.gridSpacing || 50) * (gridConfig.upsideMultiplier ?? 0.5)).toFixed(1)} pts ({isLong ? '+' : '-'}{((gridConfig.gridSpacing || 50) * (gridConfig.upsideMultiplier ?? 0.5)).toFixed(1)} each level)
                </div>
                <div className="text-rose-400">
                  <strong>▼ Averaging DCA ({isLong ? 'Dip Down' : 'Rally Up'}):</strong> Gap = G * {(gridConfig.downsideMultiplier ?? 1.0)} = {((gridConfig.gridSpacing || 50) * (gridConfig.downsideMultiplier ?? 1.0)).toFixed(1)} pts ({isLong ? '-' : '+'}{((gridConfig.gridSpacing || 50) * (gridConfig.downsideMultiplier ?? 1.0)).toFixed(1)} each level)
                </div>
                <div className="text-neutral-400 text-[9px] pt-0.5 border-t border-neutral-800/60 flex items-center justify-between">
                  <span>⚡ <strong>Auto-Update:</strong> Dynamic on price movement when idle (no open trade)</span>
                  <span>🕒 <strong>In-Trade:</strong> Updates on 1-hour candle close</span>
                </div>
              </div>

              {/* Upside Ladder Rows */}
              {(ladderTab === 'ALL' || ladderTab === 'UPSIDE') && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-between px-1">
                    <span>▲ Upside Pyramiding Ladder (Trend Momentum)</span>
                    <span className="text-[9px] text-neutral-500 font-mono">10 Levels</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-neutral-800/60 border border-neutral-800 rounded-lg bg-neutral-950 font-mono text-[10px]">
                    <div className="grid grid-cols-12 gap-1 p-1.5 bg-neutral-900/90 text-neutral-400 font-semibold text-[9px] uppercase tracking-wider sticky top-0 z-10">
                      <span className="col-span-2">Level</span>
                      <span className="col-span-4">Gap & Multiplier</span>
                      <span className="col-span-3">Milestone</span>
                      <span className="col-span-3 text-right">Entry ({activeSide})</span>
                    </div>
                    {gridLadder.map((lvl) => {
                      const isTarget = lvl.level === (runtime.currentCycle || 1);
                      return (
                        <div
                          key={`up-${lvl.level}`}
                          className={`grid grid-cols-12 gap-1 p-1.5 items-center transition-colors ${
                            isTarget
                              ? 'bg-amber-500/15 text-amber-200 font-semibold'
                              : lvl.isPassed
                              ? 'bg-emerald-950/25 text-emerald-300'
                              : 'text-neutral-400 hover:bg-neutral-900/40'
                          }`}
                        >
                          <div className="col-span-2 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isTarget ? 'bg-amber-400 animate-ping' : lvl.isPassed ? 'bg-emerald-400' : 'bg-neutral-700'
                            }`} />
                            <span>#{lvl.level}</span>
                          </div>
                          <span className="col-span-4 text-neutral-300 truncate" title={lvl.multiplierLabel}>
                            {lvl.multiplierLabel}
                          </span>
                          <span className="col-span-3 text-neutral-300">
                            ${lvl.milestoneTriggerPrice.toFixed(2)}
                          </span>
                          <div className="col-span-3 text-right font-bold flex items-center justify-end gap-1">
                            <span className={isTarget ? 'text-amber-300' : lvl.isPassed ? 'text-emerald-400' : 'text-neutral-200'}>
                              ${lvl.targetEntryPrice.toFixed(2)}
                            </span>
                            {isTarget && (
                              <span className="px-1 py-0.2 rounded text-[8px] bg-amber-400 text-neutral-950 uppercase font-sans">
                                Next
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Downside Ladder Rows */}
              {(ladderTab === 'ALL' || ladderTab === 'DOWNSIDE') && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-rose-400 flex items-center justify-between px-1">
                    <span>▼ Downside DCA Pullback Ladder (Adverse Scaling)</span>
                    <span className="text-[9px] text-neutral-500 font-mono">Double Gap (50 pts)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-neutral-800/60 border border-neutral-800 rounded-lg bg-neutral-950 font-mono text-[10px]">
                    <div className="grid grid-cols-12 gap-1 p-1.5 bg-neutral-900/90 text-neutral-400 font-semibold text-[9px] uppercase tracking-wider sticky top-0 z-10">
                      <span className="col-span-2">Level</span>
                      <span className="col-span-4">Gap & Multiplier</span>
                      <span className="col-span-3">Milestone</span>
                      <span className="col-span-3 text-right">DCA Entry</span>
                    </div>
                    {downsideLadder.map((lvl) => {
                      return (
                        <div
                          key={`down-${lvl.level}`}
                          className={`grid grid-cols-12 gap-1 p-1.5 items-center transition-colors ${
                            lvl.isPassed
                              ? 'bg-rose-950/25 text-rose-300'
                              : 'text-neutral-400 hover:bg-neutral-900/40'
                          }`}
                        >
                          <div className="col-span-2 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              lvl.isPassed ? 'bg-rose-400' : 'bg-neutral-700'
                            }`} />
                            <span>#{lvl.level}</span>
                          </div>
                          <span className="col-span-4 text-neutral-300 truncate" title={lvl.multiplierLabel}>
                            {lvl.multiplierLabel}
                          </span>
                          <span className="col-span-3 text-neutral-300">
                            ${lvl.milestoneTriggerPrice.toFixed(2)}
                          </span>
                          <div className="col-span-3 text-right font-bold text-rose-300">
                            ${lvl.targetEntryPrice.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Initial SL & Min Exit Floor */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Initial Stop Loss on Start
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={gridConfig.initialSlOffset}
                    onChange={(e) => onUpdateConfig({ initialSlOffset: parseFloat(e.target.value) || -50 })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-rose-300 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">pts</span>
                </div>
                <span className="text-[9px] text-neutral-500">Protection stop loss (e.g. -50 pts)</span>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Min Exit Floor (+pts)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={gridConfig.minExitProfitOffset}
                    onChange={(e) => onUpdateConfig({ minExitProfitOffset: parseFloat(e.target.value) || 15 })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-amber-300 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">+pts</span>
                </div>
                <span className="text-[9px] text-neutral-500">Minimum exit floor (e.g. +15 pts)</span>
              </div>
            </div>

            {/* Row 3: User Rule - "Once price > +25, SL will be entry +15, then start chasing" */}
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Profit Lock Trigger (Rule: Once &gt;+25, SL = entry ±15)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                  Guaranteed Profit
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">
                    Trigger Activation (+pts)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={gridConfig.profitActivationThreshold ?? 25}
                      onChange={(e) => onUpdateConfig({ profitActivationThreshold: parseFloat(e.target.value) || 25 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-neutral-500">&gt;+pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Once price gain &gt; +25 pts</span>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">
                    Locked Stop Loss (±pts)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={gridConfig.lockedProfitSlOffset ?? 15}
                      onChange={(e) => onUpdateConfig({ lockedProfitSlOffset: parseFloat(e.target.value) || 15 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-neutral-500">pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">SL moves to entry ±15</span>
                </div>
              </div>
              <div className="text-[10px] text-neutral-300 bg-neutral-950/70 p-1.5 rounded border border-emerald-500/20 leading-relaxed font-mono">
                <span className="text-emerald-400 font-bold">Step:</span> Once price gain &gt; +{gridConfig.profitActivationThreshold ?? 25} pts, SL moves to entry {isLong ? '+' : '-'}{gridConfig.lockedProfitSlOffset ?? 15} pts, guaranteeing win. Then chasing begins!
              </div>
            </div>

            {/* Row 4: Chase Extreme & Trailing Pullback Engine ("then start chasing") */}
            <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Then Start Chasing: Trailing Pullback Engine</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">
                    Trailing Distance (Extreme - X)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={gridConfig.trailingDistance}
                      onChange={(e) => onUpdateConfig({ trailingDistance: parseFloat(e.target.value) || 10 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-100 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-neutral-500">pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">Peak 80 → SL set to 70 (-10 pts)</span>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">
                    Pullback Trigger (pts)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={gridConfig.pullbackTrigger}
                      onChange={(e) => onUpdateConfig({ pullbackTrigger: parseFloat(e.target.value) || 5 })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-100 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-2 top-1 text-[9px] text-neutral-500">pts</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">e.g. Retraces 5 pts from peak</span>
                </div>
              </div>
              <div className="text-[10px] text-neutral-400 bg-neutral-950/70 p-1.5 rounded border border-neutral-800/80 leading-relaxed font-mono">
                <span className="text-cyan-400 font-bold">Chase Engine:</span> Works for both Long (chasing high) and Short (chasing low trough). SL never retreats below entry {isLong ? '+' : '-'}{gridConfig.lockedProfitSlOffset ?? 15} pts.
              </div>
            </div>

            {/* Row 5: Sizing & Leverage */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Lot / Order Size ({asset.symbol})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={gridConfig.lotSize}
                  onChange={(e) => onUpdateConfig({ lotSize: parseFloat(e.target.value) || 0.1 })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                />
                <div className="text-[9px] text-neutral-500 mt-0.5">
                  Margin: ~${requiredMargin.toFixed(2)} USDT ({gridConfig.leverage}x)
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Leverage Multiplier
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={isGold ? 75 : 150}
                    value={gridConfig.leverage}
                    onChange={(e) => onUpdateConfig({ leverage: parseInt(e.target.value, 10) || 75 })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[10px] text-neutral-500">x</span>
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">Shark Brokerage Margin</div>
              </div>
            </div>

            {/* Row 6: Base Anchor & Auto-Loop */}
            <div className="grid grid-cols-2 gap-2.5 items-end">
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Base Price Anchor</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAnchorInput(curPrice.toString());
                      onUpdateConfig({ basePriceAnchor: curPrice });
                    }}
                    className="text-[9px] text-amber-400 hover:underline"
                  >
                    Current Price
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={customAnchorInput}
                  onChange={(e) => {
                    setCustomAnchorInput(e.target.value);
                    onUpdateConfig({ basePriceAnchor: parseFloat(e.target.value) || curPrice });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                <input
                  type="checkbox"
                  id="autoLoopCheck"
                  checked={gridConfig.autoLoop}
                  onChange={(e) => onUpdateConfig({ autoLoop: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500/20"
                />
                <label htmlFor="autoLoopCheck" className="text-[11px] text-neutral-300 select-none cursor-pointer">
                  Auto-Advance & re-evaluate 1h/15m trend for next cycle
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Bot Activity & Trigger Log */}
      <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-neutral-400" />
            Live Bot Execution Logs
          </span>
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Clear Log
          </button>
        </div>

        <div className="h-44 overflow-y-auto space-y-1 font-mono text-[11px] bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80">
          {runtime.logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const badgeColor =
              log.type === 'TRIGGER'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : log.type === 'CHASE_HIGH'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : log.type === 'SL_UPDATE'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : log.type === 'EXIT'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : log.type === 'CYCLE_COMPLETE'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : log.type === 'ERROR'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700';

            return (
              <div
                key={log.id}
                className="flex items-start gap-1.5 p-1 rounded hover:bg-neutral-800/40 transition-colors"
              >
                <span className="text-neutral-500 shrink-0 text-[10px]">{timeStr}</span>
                <span className={`px-1 py-0.2 rounded border text-[9px] font-bold uppercase shrink-0 ${badgeColor}`}>
                  {log.type}
                </span>
                <span className="text-neutral-300 text-[10px] leading-tight break-words flex-1">
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
