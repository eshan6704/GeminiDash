import React, { useState } from 'react';
import {
  MarketAsset,
  Position,
  SimulatorConfig,
  AutoGridConfig,
  AutoGridRuntimeState,
  GridLadderLevel,
} from '../../types/trading';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ListFilter,
  Sliders,
  Layers,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { MAX_RUNNING_TRADES, TRADE_TIER_CONFIGS } from '../../utils/tradeEntryConditions';
import {
  calculateDigitGridSpec,
  snapToBaseMultiple,
  getBasePriceStep,
} from '../../utils/gridLadderCalculator';
import { useInrCurrency, InrCurrencyToggle } from '../../utils/inrCurrency';

interface AutoGridPanelProps {
  asset: MarketAsset;
  cashBalance: number;
  gridMarginLocked?: number;
  gridUnrealizedPnL?: number;
  gridTotalEquity?: number;
  onUpdateGridBalance?: (newBalance: number) => void;
  onResetGridSimulation?: (newBalance?: number) => void;
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
  gridMarginLocked = 0,
  gridUnrealizedPnL = 0,
  gridTotalEquity,
  onUpdateGridBalance,
  onResetGridSimulation,
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
}) => {
  const [ladderTab, setLadderTab] = useState<'ALL' | 'UPSIDE' | 'DOWNSIDE'>('ALL');
  const [customAnchorInput, setCustomAnchorInput] = useState<string>(
    gridConfig.basePriceAnchor ? gridConfig.basePriceAnchor.toString() : asset.price.toString()
  );
  const [gridBalanceInput, setGridBalanceInput] = useState<string>(cashBalance.toFixed(0));

  React.useEffect(() => {
    setGridBalanceInput(cashBalance.toFixed(0));
  }, [cashBalance]);

  React.useEffect(() => {
    setCustomAnchorInput(
      gridConfig.basePriceAnchor ? gridConfig.basePriceAnchor.toString() : asset.price.toString()
    );
  }, [asset.symbol, gridConfig.basePriceAnchor]);

  const effectiveGridEquity =
    gridTotalEquity ?? cashBalance + gridMarginLocked + gridUnrealizedPnL;

  const isRunning =
    gridConfig.enabled &&
    (runtime.status === 'WAITING_FOR_ENTRY' || runtime.status === 'IN_POSITION');
  const inPosition = runtime.status === 'IN_POSITION' && runtime.entryPrice !== undefined;
  const hasLivePosition = inPosition || positions.length > 0;

  const activeSide = gridConfig.side || runtime.activeSide || 'BUY';
  const isLong = activeSide === 'BUY';

  const curPrice = asset.price || 85435;

  // Digit-Reference & Factor-Based Grid Spec (e.g. 85435 (5-digit int) -> 4-digit Base G = 1000)
  const digitSpec = calculateDigitGridSpec(curPrice, {
    gridScaleFactor: gridConfig.gridScaleFactor ?? 1.0,
    entryGapFactor: gridConfig.entryGapFactor ?? 0.01,
    slStartFactor: gridConfig.slStartFactor ?? 0.2,
    winConditionFactor: gridConfig.winConditionFactor ?? 0.2,
    slAfterFactor: gridConfig.slAfterFactor ?? 0.01,
    symbol: asset.symbol,
  });

  const gValue = gridConfig.gridSpacing || digitSpec.effectiveG;
  const baseStep = getBasePriceStep(gValue, asset.symbol);
  const entryGapFactor = gridConfig.entryGapFactor ?? 0.01;
  const slStartFactor = gridConfig.slStartFactor ?? 0.2;
  const winConditionFactor = gridConfig.winConditionFactor ?? 0.2;
  const slAfterFactor = gridConfig.slAfterFactor ?? 0.01;
  const gridScaleFactor = gridConfig.gridScaleFactor ?? 1.0;

  const entryOffsetPts = Number((gValue * entryGapFactor).toPrecision(6));
  const slStartPts = Number((gValue * slStartFactor).toPrecision(6));
  const winConditionPts = Number((gValue * winConditionFactor).toPrecision(6));
  const slAfterPts = Number((gValue * slAfterFactor).toPrecision(6));
  const lockedProfitPts = Number(Math.max(0, winConditionPts - slAfterPts).toPrecision(6));

  const liveSnappedBase = snapToBaseMultiple(curPrice, gValue, asset.symbol);
  const baseAnchorPrice = hasLivePosition
    ? snapToBaseMultiple(
        runtime.basePrice || gridConfig.basePriceAnchor || curPrice,
        gValue,
        asset.symbol
      )
    : snapToBaseMultiple(
        gridConfig.basePriceAnchor || runtime.basePrice || curPrice,
        gValue,
        asset.symbol
      );

  React.useEffect(() => {
    if (!hasLivePosition) {
      setCustomAnchorInput(baseAnchorPrice.toString());
    }
  }, [hasLivePosition, baseAnchorPrice]);
  const firstTriggerPrice = Number(
    (baseAnchorPrice + (isLong ? entryOffsetPts : -entryOffsetPts)).toFixed(6)
  );

  const entryPrice = runtime.entryPrice || firstTriggerPrice;

  const pointsGain = inPosition
    ? isLong
      ? curPrice - runtime.entryPrice!
      : runtime.entryPrice! - curPrice
    : 0;

  const peakGain = inPosition
    ? isLong
      ? (runtime.highestPriceReached || curPrice) - runtime.entryPrice!
      : runtime.entryPrice! - (runtime.lowestPriceReached || curPrice)
    : 0;

  const startSlPrice = isLong ? entryPrice - slStartPts : entryPrice + slStartPts;
  const winTriggerPrice = isLong ? entryPrice + winConditionPts : entryPrice - winConditionPts;
  const tightSlAtWinPrice = isLong
    ? winTriggerPrice - slAfterPts
    : winTriggerPrice + slAfterPts;

  const currentSL = runtime.currentTrailingSL || startSlPrice;

  // Broker Math:
  const { showInr, formatInr } = useInrCurrency();
  const tradeValue = curPrice * gridConfig.lotSize;
  const entryTradeValue = entryPrice * gridConfig.lotSize;
  const requiredMargin =
    gridConfig.leverage > 0 ? tradeValue / gridConfig.leverage : tradeValue;
  const makerFee = tradeValue * 0.00016;
  const takerFee = tradeValue * 0.00064;
  const liveNetReturn = isLong
    ? tradeValue - entryTradeValue
    : entryTradeValue - tradeValue;
  const liveNetAfterMakerFee = liveNetReturn - makerFee;

  const slStartRiskUsd = slStartPts * gridConfig.lotSize;
  const winCondProfitUsd = winConditionPts * gridConfig.lotSize;
  const lockedProfitUsd = lockedProfitPts * gridConfig.lotSize;

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: val < 10 ? 4 : 2,
      maximumFractionDigits: val < 10 ? 4 : 2,
    });

  const upsideGapPts = Number((gValue * (gridConfig.upsideMultiplier ?? 0.5)).toPrecision(6));
  const downsideGapPts = Number((gValue * (gridConfig.downsideMultiplier ?? 1.0)).toPrecision(6));

  return (
    <div className="space-y-4 text-[var(--theme-text-primary)]">
      {/* 1. TOP COMMAND HEADER & SIMULATION BALANCE BAR */}
      <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[var(--theme-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-600/25 flex items-center justify-center font-mono font-black text-xs text-emerald-700 shrink-0">
              G={gValue}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-[var(--theme-text-primary)]">
                  Auto Grid Factor Engine ({asset.symbol}/USDT)
                </h2>
                <span aria-hidden="true" className="text-[var(--theme-text-muted)]">&middot;</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    runtime.status === 'IN_POSITION'
                      ? 'text-emerald-600'
                      : runtime.status === 'WAITING_FOR_ENTRY'
                      ? 'text-amber-600'
                      : 'text-[var(--theme-text-muted)]'
                  }`}
                >
                  {runtime.status.replace(/_/g, ' ')}
                </span>
                <span aria-hidden="true" className="text-[var(--theme-text-muted)]">&middot;</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-mono font-extrabold ${
                    isLong ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isLong ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {isLong ? 'BUY (LONG)' : 'SELL (SHORT)'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--theme-text-muted)] mt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  {digitSpec.intDigits}-Digit Int &rarr; {digitSpec.baseGDigits}-Digit G:{' '}
                  <strong className="text-emerald-600">{digitSpec.baseG}</strong> &times;{' '}
                  {gridScaleFactor} = <strong className="text-emerald-600">G={gValue}</strong>
                </span>
                <span aria-hidden="true">&middot;</span>
                <span>
                  Entry: <strong className="text-[var(--theme-text-primary)]">{isLong ? '+' : '-'}{entryGapFactor}*G ({isLong ? '+' : '-'}{entryOffsetPts})</strong>
                </span>
                <span aria-hidden="true">&middot;</span>
                <span>
                  SL: <strong className="text-rose-600">-{slStartFactor}*G (-{slStartPts})</strong> &rarr;{' '}
                  <strong className="text-emerald-600">-{slAfterFactor}*G (-{slAfterPts}) when &gt;{winConditionFactor}*G (+{winConditionPts})</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Primary Bot Controls & Strategy Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <InrCurrencyToggle />

            <div className="flex rounded-lg p-0.5 border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold">
              <button
                type="button"
                onClick={onApplyBtcPreset}
                className="px-2.5 py-1 rounded-md text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                title="BTC 5-digit int (85,435) -> 4-digit G=1000, Entry 0.01*G (10), SL 0.2*G (200), Win 0.2*G (200) -> SL After Win 0.01*G (10)"
              >
                BTC Spec (G=1000)
              </button>
              <button
                type="button"
                onClick={onApplyGoldPreset}
                className="px-2.5 py-1 rounded-md text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                title="Apply Digit-Scaled Preset for current coin"
              >
                Auto Digit Spec
              </button>
              {onOpenWhatIf && (
                <button
                  type="button"
                  onClick={onOpenWhatIf}
                  className="px-2.5 py-1 rounded-md text-amber-600 font-bold hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
                >
                  What-If
                </button>
              )}
            </div>

            {!isRunning ? (
              <button
                type="button"
                onClick={() =>
                  onStartBot(
                    hasLivePosition
                      ? parseFloat(customAnchorInput) || baseAnchorPrice
                      : liveSnappedBase
                  )
                }
                className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Auto Grid ({activeSide})</span>
              </button>
            ) : runtime.status === 'PAUSED' ? (
              <button
                type="button"
                onClick={onResumeBot}
                className="py-1.5 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Grid</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPauseBot}
                className="py-1.5 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Grid</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onStopBot(inPosition)}
              disabled={runtime.status === 'IDLE'}
              className="py-1.5 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            <button
              type="button"
              onClick={onResetBot}
              className="py-1.5 px-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 4-Metric Capital, Digit Reference & Capacity Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
          {/* Metric 1: Grid Cash & Editable Balance */}
          <div className="p-3 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Auto Grid Free Cash
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 block">
                  ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {showInr && (
                  <span className="text-[10px] font-bold text-emerald-700 block">
                    {formatInr(cashBalance)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--theme-border-subtle)]">
              <input
                type="number"
                min={0}
                step="any"
                value={gridBalanceInput}
                onChange={(e) => setGridBalanceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onUpdateGridBalance) {
                    const val = parseFloat(gridBalanceInput);
                    if (!isNaN(val) && val >= 0) onUpdateGridBalance(val);
                  }
                }}
                className="w-20 px-2 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] font-bold text-[11px] focus:outline-none focus:border-emerald-600"
              />
              {onUpdateGridBalance && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(gridBalanceInput);
                      if (!isNaN(val) && val >= 0) onUpdateGridBalance(val);
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[10px] cursor-pointer transition-colors"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGridBalanceInput('1000');
                      if (onResetGridSimulation) {
                        onResetGridSimulation(1000);
                      } else {
                        onUpdateGridBalance(1000);
                      }
                    }}
                    className="px-2 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-sans font-semibold text-[10px] cursor-pointer transition-colors"
                  >
                    $1K Default
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metric 2: Margin Locked & Net Equity */}
          <div className="p-3 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Grid Net Equity
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-[var(--theme-text-primary)] block">
                  ${effectiveGridEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {showInr && (
                  <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] block">
                    {formatInr(effectiveGridEquity)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--theme-border-subtle)]">
              <span className="font-sans text-[var(--theme-text-muted)]">
                Margin: <strong className="font-mono text-amber-600">${gridMarginLocked.toFixed(2)}</strong>
                {showInr && <span className="text-[10px] text-amber-700 ml-1">({formatInr(gridMarginLocked)})</span>}
              </span>
              <span
                className={`font-bold ${
                  gridUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                PnL: {gridUnrealizedPnL >= 0 ? '+' : ''}${gridUnrealizedPnL.toFixed(2)}
                {showInr && <span className="text-[10px] ml-1">({formatInr(gridUnrealizedPnL, { signed: true })})</span>}
              </span>
            </div>
          </div>

          {/* Metric 3: N-Digit Int -> (N-1)-Digit Base G */}
          <div className="p-3 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                {digitSpec.intDigits}-Digit Int &rarr; {digitSpec.baseGDigits}-Digit G
              </span>
              <span className="text-xs font-extrabold text-[var(--theme-text-primary)]">
                G = {gValue}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--theme-border-subtle)]">
              <span className="text-[var(--theme-text-muted)]">
                Entry: <strong className="text-emerald-600">{isLong ? '+' : '-'}{entryGapFactor}*G ({isLong ? '+' : '-'}{entryOffsetPts})</strong>
              </span>
              <span className="text-[var(--theme-text-muted)]">
                SL: <strong className="text-rose-600">-{slStartFactor}*G</strong> &rarr; <strong className="text-emerald-600">-{slAfterFactor}*G</strong>
              </span>
            </div>
          </div>

          {/* Metric 4: Live Trade Slot Capacity (10 Slots) */}
          <div className="p-3 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Slot Capacity</span>
              </span>
              <span
                className={`text-xs font-extrabold ${
                  positions.length >= MAX_RUNNING_TRADES
                    ? 'text-rose-600'
                    : 'text-[var(--theme-text-primary)]'
                }`}
              >
                {positions.length} / {MAX_RUNNING_TRADES} Active
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1 pt-1">
              {Array.from({ length: 10 }, (_, i) => {
                const slotIdx = i + 1;
                const isOccupied = slotIdx <= positions.length;
                const isTargetSlot =
                  slotIdx === Math.min(10, positions.length + 1) &&
                  positions.length < MAX_RUNNING_TRADES;
                return (
                  <div
                    key={slotIdx}
                    className={`h-3.5 rounded-xs flex items-center justify-center text-[9px] font-bold ${
                      isOccupied
                        ? 'bg-emerald-600 text-white'
                        : isTargetSlot
                        ? 'bg-amber-500 text-white'
                        : 'bg-[var(--theme-bg-elevated)] text-[var(--theme-text-muted)]'
                    }`}
                    title={`Slot #${slotIdx}: ${TRADE_TIER_CONFIGS[slotIdx]?.name}`}
                  >
                    {slotIdx}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 12-COLUMN WORKSPACE: FACTOR PARAMETERS (LEFT 5) & LADDER / LOGS (RIGHT 7) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN (5 COLS): FACTOR-SCALED GRID, ENTRY, SL & EXIT ENGINE */}
        <div className="xl:col-span-5 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                Factor-Scaled Grid, Entry &amp; SL Rules
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--theme-text-muted)]">
              G = <strong className="text-emerald-600">{gValue} pts</strong> &middot;{' '}
              <strong className={isLong ? 'text-emerald-600' : 'text-rose-600'}>{activeSide}</strong>
            </span>
          </div>

          {/* Section 01: User Trade Direction Selection */}
          <div className="space-y-2.5 pb-3.5 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                01. Trade Direction (User Selected)
              </span>
              <span className="text-[11px] font-mono text-[var(--theme-text-muted)]">
                Executes {isLong ? 'Buy (Long)' : 'Sell (Short)'} orders only
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateConfig({ directionMode: 'BUY_ONLY', side: 'BUY' })}
                className={`py-2.5 px-3 rounded-lg border text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  isLong
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                    : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="text-xs block font-bold">Buy Only (Long)</span>
                  <span className="block text-[10px] opacity-85 font-normal">
                    Entry +{entryGapFactor}*G &middot; Pyramid Up
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ directionMode: 'SELL_ONLY', side: 'SELL' })}
                className={`py-2.5 px-3 rounded-lg border text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  !isLong
                    ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                    : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="text-xs block font-bold">Sell Only (Short)</span>
                  <span className="block text-[10px] opacity-85 font-normal">
                    Entry -{entryGapFactor}*G &middot; Pyramid Down
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 02: Digit Reference, Grid Scale Factor (G), Entry Gap Factor (+0.01*G) & Ladder Multipliers */}
          <div className="space-y-3 pb-3.5 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                02. Grid Scale Factor (G) &amp; Entry Gap Factor
              </span>
              <span className="text-[11px] font-mono text-[var(--theme-text-muted)]">
                Spot ${formatPrice(curPrice)} ({digitSpec.intDigits}-digit int) &rarr; {digitSpec.baseGDigits}-digit G={digitSpec.baseG}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {/* Factor 1: Grid Size Scale Factor */}
              <div>
                <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                  <span>Grid Scale Factor (&times; Base G={digitSpec.baseG})</span>
                  <span className="font-mono text-emerald-600 font-bold">G = {gValue}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={gridScaleFactor}
                  onChange={(e) =>
                    onUpdateConfig({ gridScaleFactor: Math.max(0.05, parseFloat(e.target.value) || 1.0) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] font-bold focus:outline-none focus:border-emerald-600"
                />
                <div className="text-[10px] text-[var(--theme-text-muted)] mt-1">
                  Base {digitSpec.baseG} &times; {gridScaleFactor} = <strong>{gValue} pts</strong>
                </div>
              </div>

              {/* Factor 2: Entry Gap Factor (+0.01 * G) */}
              <div>
                <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                  <span>Entry Gap Factor (&times; G)</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {isLong ? '+' : '-'}{entryOffsetPts} pts
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={entryGapFactor}
                  onChange={(e) =>
                    onUpdateConfig({ entryGapFactor: Math.max(0, parseFloat(e.target.value) || 0.01) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-emerald-600 font-bold focus:outline-none focus:border-emerald-600"
                />
                <div className="text-[10px] text-[var(--theme-text-muted)] mt-1">
                  {isLong ? '+' : '-'}{entryGapFactor} &times; {gValue} = <strong>{isLong ? '+' : '-'}{entryOffsetPts} pts</strong>
                </div>
              </div>

              {/* Pyramiding Multiplier (0.5 * G) */}
              <div>
                <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-emerald-700 mb-1">
                  <span>Pyramiding Factor (&times; G)</span>
                  <span className="font-mono font-bold">
                    {isLong ? '+' : '-'}{upsideGapPts} pts
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={gridConfig.upsideMultiplier ?? 0.5}
                  onChange={(e) =>
                    onUpdateConfig({ upsideMultiplier: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-emerald-600 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Averaging DCA Multiplier (1.0 * G) */}
              <div>
                <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-rose-600 mb-1">
                  <span>Averaging DCA Factor (&times; G)</span>
                  <span className="font-mono font-bold">
                    {isLong ? '-' : '+'}{downsideGapPts} pts
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={gridConfig.downsideMultiplier ?? 1.0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1.0;
                    onUpdateConfig({
                      downsideMultiplier: val,
                      downsideGapMultiplier: val * 2,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-rose-600 font-bold focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Section 03: Factor-Scaled Trailing SL & Winning Condition (> 0.2 * G -> -0.01 * G) */}
          <div className="space-y-3 pb-3.5 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>03. SL Start (-{slStartFactor}*G), Win Condition (&gt;{winConditionFactor}*G) &amp; SL After Win (-{slAfterFactor}*G)</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
              {/* Factor 3: SL Start Factor (-0.2 * G) */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-rose-600 mb-1">
                  SL Start (-X &times; G)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5"
                  value={slStartFactor}
                  onChange={(e) =>
                    onUpdateConfig({ slStartFactor: Math.max(0.01, parseFloat(e.target.value) || 0.2) })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-rose-600 font-bold focus:outline-none focus:border-rose-600"
                />
                <div className="text-[10px] text-rose-600 font-bold mt-1">
                  -{slStartFactor}*G = -{slStartPts} pts
                </div>
              </div>

              {/* Factor 4: Winning Condition Factor (> +0.2 * G) */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-amber-600 mb-1">
                  Win Cond (&gt; +X &times; G)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5"
                  value={winConditionFactor}
                  onChange={(e) =>
                    onUpdateConfig({
                      winConditionFactor: Math.max(0.01, parseFloat(e.target.value) || 0.2),
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-amber-600 font-bold focus:outline-none focus:border-amber-600"
                />
                <div className="text-[10px] text-amber-600 font-bold mt-1">
                  &gt;+{winConditionFactor}*G = +{winConditionPts} pts
                </div>
              </div>

              {/* Factor 5: SL After Winning Condition (-0.01 * G) */}
              <div>
                <label className="block font-sans text-[11px] font-semibold text-emerald-700 mb-1">
                  SL After Win (-X &times; G)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.005"
                  max="5"
                  value={slAfterFactor}
                  onChange={(e) =>
                    onUpdateConfig({ slAfterFactor: Math.max(0.005, parseFloat(e.target.value) || 0.01) })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-emerald-600 font-bold focus:outline-none focus:border-emerald-600"
                />
                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                  -{slAfterFactor}*G = -{slAfterPts} pts
                </div>
              </div>
            </div>

            {/* Live Rule Price Walkthrough Box (e.g. BTC @ 85436 -> Base 85400, Entry 85405, Start SL 85355, Win > 85455 -> Tight SL 85445+) */}
            <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] font-mono text-[11px] tabular-nums space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  Base Anchor (
                  {asset.symbol.toUpperCase().includes('BTC')
                    ? 'Multiple of 100'
                    : `0.1% of G = ${baseStep}`}{' '}
                  &middot; {hasLivePosition ? 'Locked in Trade' : 'Auto-Updates w/ Price'}):
                </span>
                <strong className="text-[var(--theme-text-primary)]">${formatPrice(baseAnchorPrice)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  1. Entry ({isLong ? '+' : '-'}{entryGapFactor}*G = {isLong ? '+' : '-'}{entryOffsetPts} pts):
                </span>
                <strong className="text-emerald-600">${formatPrice(entryPrice)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  2. Trailing SL in Start (-{slStartFactor}*G = -{slStartPts} pts):
                </span>
                <strong className="text-rose-600">
                  ${formatPrice(startSlPrice)} (-${slStartRiskUsd.toFixed(2)}
                  {showInr ? ` / ${formatInr(-slStartRiskUsd, { signed: true })}` : ''})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  3. Winning Condition (&gt;+{winConditionFactor}*G = +{winConditionPts} pts):
                </span>
                <strong className="text-amber-600">
                  &gt; ${formatPrice(winTriggerPrice)} (+${winCondProfitUsd.toFixed(2)}
                  {showInr ? ` / ${formatInr(winCondProfitUsd, { signed: true })}` : ''})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  4. Tight Trailing SL After Win (-{slAfterFactor}*G = -{slAfterPts} pts):
                </span>
                <strong className="text-emerald-600">
                  ${formatPrice(tightSlAtWinPrice)}+ (Locks +${lockedProfitUsd.toFixed(2)}
                  {showInr ? ` / ${formatInr(lockedProfitUsd, { signed: true })}` : ''})
                </strong>
              </div>
            </div>
          </div>

          {/* Section 04: Sizing, Leverage & Anchor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                04. Order Sizing, Leverage &amp; Anchor
              </span>
              <span className="text-[11px] font-mono text-[var(--theme-text-muted)]">
                Trade Val: <strong className="text-[var(--theme-text-primary)]">${tradeValue.toFixed(2)}</strong>
                {showInr && <span className="text-emerald-700 font-bold"> ({formatInr(tradeValue)})</span>} &middot; Margin: <strong className="text-amber-600">${requiredMargin.toFixed(4)}</strong>
                {showInr && <span className="text-amber-700 font-bold"> ({formatInr(requiredMargin)})</span>}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                  Lot / Order Size ({asset.symbol})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={gridConfig.lotSize}
                  onChange={(e) =>
                    onUpdateConfig({ lotSize: parseFloat(e.target.value) || 0.002 })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] font-bold focus:outline-none focus:border-emerald-600"
                />
                <div className="text-[10px] text-[var(--theme-text-muted)] mt-1">
                  Maker (0.016%): <strong className="text-emerald-600">${makerFee.toFixed(4)}</strong>
                  {showInr && <span className="text-emerald-700 font-bold"> ({formatInr(makerFee)})</span>}
                </div>
              </div>

              <div>
                <label className="block font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                  Leverage Multiplier (x)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={150}
                  value={gridConfig.leverage}
                  onChange={(e) =>
                    onUpdateConfig({ leverage: parseInt(e.target.value, 10) || 150 })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] font-bold focus:outline-none focus:border-emerald-600"
                />
                <div className="text-[10px] text-[var(--theme-text-muted)] mt-1">
                  Taker (0.064%): <strong className="text-amber-600">${takerFee.toFixed(4)}</strong>
                  {showInr && <span className="text-amber-700 font-bold"> ({formatInr(takerFee)})</span>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                  <span>
                    Base Price Anchor ({asset.symbol.toUpperCase().includes('BTC') ? '100x' : `0.1% G=${baseStep}`})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        hasLivePosition ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                      title={
                        hasLivePosition
                          ? 'Base price & grid ladder are locked while a live position is running'
                          : 'Base price & grid ladder auto-update from latest spot price when no position is running'
                      }
                    >
                      {hasLivePosition ? 'Locked (In Pos)' : 'Auto-Sync'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const snapped = snapToBaseMultiple(curPrice, gValue, asset.symbol);
                        setCustomAnchorInput(snapped.toString());
                        onUpdateConfig({ basePriceAnchor: snapped });
                      }}
                      className="text-[10px] text-emerald-600 hover:underline cursor-pointer"
                    >
                      Snap Spot
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step={baseStep}
                  value={customAnchorInput}
                  disabled={hasLivePosition}
                  onChange={(e) => {
                    setCustomAnchorInput(e.target.value);
                    onUpdateConfig({
                      basePriceAnchor: parseFloat(e.target.value) || liveSnappedBase,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] font-bold focus:outline-none focus:border-emerald-600 disabled:opacity-60"
                />
                <div className="text-[10px] text-[var(--theme-text-muted)] mt-1">
                  {hasLivePosition
                    ? `Locked at $${formatPrice(baseAnchorPrice)} while live position is running`
                    : `Spot $${formatPrice(curPrice)} \u2192 Base $${formatPrice(baseAnchorPrice)} (Step ${baseStep})`}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] self-end">
                <input
                  type="checkbox"
                  id="autoLoopCheck"
                  checked={gridConfig.autoLoop}
                  onChange={(e) => onUpdateConfig({ autoLoop: e.target.checked })}
                  className="rounded border-[var(--theme-border)] text-emerald-600 focus:ring-emerald-500/20"
                />
                <label
                  htmlFor="autoLoopCheck"
                  className="font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] select-none cursor-pointer leading-tight"
                >
                  Auto-Advance to next grid level on cycle close ({activeSide} only)
                </label>
              </div>
            </div>

            {/* Entry vs Current Price & Trade Value Return Link Box */}
            <div className="p-3 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] font-mono text-[11px] tabular-nums space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
                  Entry &rarr; Current Price (&Delta; Pts)
                </span>
                <span className="font-bold text-[var(--theme-text-primary)]">
                  ${formatPrice(entryPrice)} &rarr; ${formatPrice(curPrice)}{' '}
                  <span
                    className={
                      (isLong ? curPrice - entryPrice : entryPrice - curPrice) >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }
                  >
                    ({(isLong ? curPrice - entryPrice : entryPrice - curPrice) >= 0 ? '+' : ''}
                    {(isLong ? curPrice - entryPrice : entryPrice - curPrice).toFixed(2)} pts)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  Trade Value (Entry &rarr; Current)
                </span>
                <div className="text-right">
                  <span className="text-[var(--theme-text-primary)] block">
                    ${entryTradeValue.toFixed(2)} &rarr; <strong>${tradeValue.toFixed(2)}</strong>
                  </span>
                  {showInr && (
                    <span className="text-[10px] font-bold text-emerald-700 block">
                      {formatInr(entryTradeValue)} &rarr; {formatInr(tradeValue)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[var(--theme-text-muted)]">
                  Fees (Maker 0.016% / Taker 0.064%)
                </span>
                <div className="text-right">
                  <span className="text-[var(--theme-text-primary)] block">
                    M: <strong className="text-emerald-600">${makerFee.toFixed(4)}</strong> &middot; T: <strong className="text-amber-600">${takerFee.toFixed(4)}</strong>
                  </span>
                  {showInr && (
                    <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] block">
                      M: {formatInr(makerFee)} &middot; T: {formatInr(takerFee)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--theme-border-subtle)]">
                <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
                  Return (&Delta; Price &times; Lot)
                </span>
                <div className="text-right">
                  <span
                    className={`font-extrabold block ${
                      liveNetReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {liveNetReturn >= 0 ? '+' : ''}${liveNetReturn.toFixed(4)} USDT (
                    {requiredMargin > 0
                      ? `${liveNetReturn >= 0 ? '+' : ''}${((liveNetReturn / requiredMargin) * 100).toFixed(1)}% ROE`
                      : '0.0%'}
                    )
                  </span>
                  {showInr && (
                    <span
                      className={`text-[10px] font-bold block ${
                        liveNetReturn >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatInr(liveNetReturn, { signed: true })} &middot; Net After Fee: {formatInr(liveNetAfterMakerFee, { signed: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): LIVE POSITION CHASE HUD, DUAL-LADDER MATRIX & EXECUTION LOGS */}
        <div className="xl:col-span-7 space-y-4">
          {/* Active Trigger / In-Position Telemetry Card */}
          {inPosition ? (
            <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 shadow-sm space-y-3 font-mono tabular-nums">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--theme-border-subtle)]">
                <div className="flex items-center gap-2 font-sans text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>
                    Active Position Trailing Chase ({activeSide}: Entry ${formatPrice(runtime.entryPrice!)} &rarr; Current ${formatPrice(curPrice)})
                  </span>
                </div>
                <div
                  className={`text-xs font-extrabold text-right ${
                    liveNetReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  <div>
                    {pointsGain >= 0 ? '+' : ''}
                    {pointsGain.toFixed(2)} pts &times; {gridConfig.lotSize} ={' '}
                    {liveNetReturn >= 0 ? '+' : ''}${liveNetReturn.toFixed(4)} USDT (
                    {entryTradeValue > 0 ? `$${entryTradeValue.toFixed(2)} \u2192 $${tradeValue.toFixed(2)}` : ''})
                  </div>
                  {showInr && (
                    <div className="text-[11px] font-bold">
                      Return: {formatInr(liveNetReturn, { signed: true })} &middot; Val: {formatInr(entryTradeValue)} &rarr; {formatInr(tradeValue)} &middot; Fee: {formatInr(makerFee)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
                  <span className="font-sans text-[10px] text-[var(--theme-text-muted)] block">
                    Entry (+{entryGapFactor}*G)
                  </span>
                  <span className="font-bold text-[var(--theme-text-primary)]">
                    ${runtime.entryPrice?.toFixed(1)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/25">
                  <span className="font-sans text-[10px] text-rose-600 block">
                    SL Start (-{slStartFactor}*G)
                  </span>
                  <span className="font-bold text-rose-600">
                    -{slStartPts} pts
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/25">
                  <span className="font-sans text-[10px] text-amber-600 block">
                    {runtime.isChasingActivated ? 'Win Active!' : `Win (>+${winConditionFactor}*G)`}
                  </span>
                  <span className="font-bold text-amber-600">
                    &gt;+{winConditionPts} pts
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/25">
                  <span className="font-sans text-[10px] text-emerald-600 block">
                    SL After (-{slAfterFactor}*G)
                  </span>
                  <span className="font-bold text-emerald-600">
                    -{slAfterPts} pts trail
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)]">
                  <span className="font-sans text-[10px] text-[var(--theme-text-muted)] block">
                    Active Trailing SL
                  </span>
                  <span className="font-extrabold text-[var(--theme-text-primary)]">
                    ${currentSL.toFixed(1)} (+{peakGain.toFixed(1)} pk)
                  </span>
                </div>
              </div>
            </div>
          ) : runtime.status === 'WAITING_FOR_ENTRY' ? (
            <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 font-mono text-xs tabular-nums">
              <div className="space-y-0.5">
                <div className="font-sans font-extrabold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                  {isLong ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  )}
                  <span>
                    Armed &amp; Waiting for {activeSide} Entry Trigger (Slot #
                    {runtime.slotNumber || positions.length + 1})
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[var(--theme-text-muted)]">
                  Target Trigger Price ({isLong ? '+' : '-'}{entryGapFactor}*G):{' '}
                  <strong className="font-mono text-[var(--theme-text-primary)]">
                    ${formatPrice(runtime.targetEntryPrice)}
                  </strong>{' '}
                  ({isLong ? '+' : '-'}{entryOffsetPts} pts from base ${formatPrice(runtime.basePrice)} &middot; Start SL: -{slStartFactor}*G = -{slStartPts} pts)
                </p>
              </div>
              <div className="text-right">
                <span className="font-sans text-[10px] text-[var(--theme-text-muted)] block">
                  Distance to Trigger
                </span>
                <span className="text-sm font-black text-amber-600">
                  {Math.abs(runtime.targetEntryPrice - curPrice).toFixed(2)} pts
                </span>
              </div>
            </div>
          ) : positions.length >= MAX_RUNNING_TRADES ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 text-xs text-rose-600 flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                Maximum 10 live positions reached. Auto Grid entry is paused until an active slot closes.
              </span>
            </div>
          ) : null}

          {/* 10-Level Dual-Ladder Price Preview Card */}
          <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--theme-border-subtle)]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                    10-Level Progressive Dual-Grid Ladder ({activeSide} &middot; G={gValue})
                  </h3>
                  <p className="text-[11px] text-[var(--theme-text-muted)] font-mono">
                    Base ({asset.symbol.toUpperCase().includes('BTC') ? '100x' : `0.1% G`}):{' '}
                    <strong className="text-[var(--theme-text-primary)]">${formatPrice(baseAnchorPrice)}</strong>{' '}
                    <span className={hasLivePosition ? 'text-amber-600' : 'text-emerald-600'}>
                      ({hasLivePosition ? 'Locked in Pos' : 'Live Sync'})
                    </span>{' '}
                    &middot; 1st Trigger ({isLong ? '+' : '-'}{entryGapFactor}*G):{' '}
                    <strong className="text-[var(--theme-text-primary)]">${formatPrice(firstTriggerPrice)}</strong> &middot; Pyramid ({gridConfig.upsideMultiplier ?? 0.5}*G):{' '}
                    <strong className="text-emerald-600">{upsideGapPts} pts</strong> &middot; DCA ({gridConfig.downsideMultiplier ?? 1.0}*G):{' '}
                    <strong className="text-rose-600">{downsideGapPts} pts</strong>
                  </p>
                </div>
              </div>

              {/* Segmented View Filter */}
              <div className="flex rounded-lg p-0.5 border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold">
                <button
                  type="button"
                  onClick={() => setLadderTab('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    ladderTab === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setLadderTab('UPSIDE')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    ladderTab === 'UPSIDE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  Pyramiding ({isLong ? '+' : '-'}{upsideGapPts})
                </button>
                <button
                  type="button"
                  onClick={() => setLadderTab('DOWNSIDE')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    ladderTab === 'DOWNSIDE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  DCA Pullback ({isLong ? '-' : '+'}{downsideGapPts})
                </button>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                ladderTab === 'ALL' ? 'lg:grid-cols-2' : ''
              } gap-3.5 font-mono text-xs tabular-nums`}
            >
              {/* Upside Pyramiding Table */}
              {(ladderTab === 'ALL' || ladderTab === 'UPSIDE') && (
                <div className="rounded-lg border border-[var(--theme-border)] overflow-hidden">
                  <div className="px-3 py-2 bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border-subtle)] flex items-center justify-between font-sans text-[11px] font-bold text-emerald-700">
                    <span>Upside Pyramiding ({isLong ? '+' : '-'}{upsideGapPts} pts/lvl)</span>
                    <span className="font-mono text-[10px] text-[var(--theme-text-muted)]">
                      Entry {isLong ? '+' : '-'}{entryGapFactor}*G
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="sticky top-0 z-10 bg-[var(--theme-bg-card-subtle)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] border-b border-[var(--theme-border)]">
                          <th className="py-1.5 px-3">Lvl</th>
                          <th className="py-1.5 px-3 text-right">Milestone (G)</th>
                          <th className="py-1.5 px-3 text-right">
                            Entry ({isLong ? '+' : '-'}{entryOffsetPts})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {gridLadder.map((lvl) => {
                          const isTarget = lvl.level === (runtime.currentCycle || 1);
                          return (
                            <tr
                              key={`up-${lvl.level}`}
                              className={`transition-colors ${
                                isTarget
                                  ? 'bg-amber-500/10 font-bold'
                                  : lvl.isPassed
                                  ? 'bg-emerald-500/[0.06]'
                                  : 'hover:bg-[var(--theme-bg-card-subtle)]'
                              }`}
                            >
                              <td className="py-1.5 px-3 font-bold text-[var(--theme-text-primary)]">
                                #{lvl.level}
                              </td>
                              <td className="py-1.5 px-3 text-right text-[var(--theme-text-secondary)]">
                                ${formatPrice(lvl.milestoneTriggerPrice)}
                              </td>
                              <td className="py-1.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                                ${formatPrice(lvl.targetEntryPrice)}
                                {isTarget ? ' · Next' : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Downside DCA Table */}
              {(ladderTab === 'ALL' || ladderTab === 'DOWNSIDE') && (
                <div className="rounded-lg border border-[var(--theme-border)] overflow-hidden">
                  <div className="px-3 py-2 bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border-subtle)] flex items-center justify-between font-sans text-[11px] font-bold text-rose-600">
                    <span>Downside DCA Pullback ({isLong ? '-' : '+'}{downsideGapPts} pts/lvl)</span>
                    <span className="font-mono text-[10px] text-[var(--theme-text-muted)]">
                      Entry {isLong ? '+' : '-'}{entryGapFactor}*G
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="sticky top-0 z-10 bg-[var(--theme-bg-card-subtle)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] border-b border-[var(--theme-border)]">
                          <th className="py-1.5 px-3">Lvl</th>
                          <th className="py-1.5 px-3 text-right">Milestone (G)</th>
                          <th className="py-1.5 px-3 text-right">
                            DCA Entry ({isLong ? '+' : '-'}{entryOffsetPts})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {downsideLadder.map((lvl) => (
                          <tr
                            key={`down-${lvl.level}`}
                            className={`transition-colors ${
                              lvl.isPassed
                                ? 'bg-rose-500/[0.06] font-bold'
                                : 'hover:bg-[var(--theme-bg-card-subtle)]'
                            }`}
                          >
                            <td className="py-1.5 px-3 font-bold text-[var(--theme-text-primary)]">
                              #{lvl.level}
                            </td>
                            <td className="py-1.5 px-3 text-right text-[var(--theme-text-secondary)]">
                              ${formatPrice(lvl.milestoneTriggerPrice)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                              ${formatPrice(lvl.targetEntryPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Bot Execution Logs Card */}
          <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--theme-border-subtle)]">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                <ListFilter className="w-4 h-4 text-emerald-600" />
                <span>Live Auto Grid Execution Log ({runtime.logs.length} Events)</span>
              </div>
              <button
                type="button"
                onClick={onClearLogs}
                className="text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-[var(--theme-border-subtle)] font-mono text-[11px] tabular-nums">
              {runtime.logs.length === 0 ? (
                <div className="py-6 text-center font-sans text-xs text-[var(--theme-text-muted)]">
                  No bot execution events recorded yet. Click &ldquo;Start Auto Grid&rdquo; to arm the ladder.
                </div>
              ) : (
                runtime.logs.map((log) => {
                  const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  const typeColor =
                    log.type === 'TRIGGER'
                      ? 'text-emerald-600'
                      : log.type === 'CHASE_HIGH'
                      ? 'text-amber-600'
                      : log.type === 'SL_UPDATE'
                      ? 'text-emerald-700'
                      : log.type === 'EXIT'
                      ? 'text-rose-600'
                      : log.type === 'ERROR'
                      ? 'text-rose-600'
                      : 'text-[var(--theme-text-secondary)]';

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 py-1.5 px-2 hover:bg-[var(--theme-bg-card-subtle)] transition-colors"
                    >
                      <span className="text-[var(--theme-text-muted)] shrink-0">{timeStr}</span>
                      <span className={`font-bold shrink-0 w-24 ${typeColor}`}>
                        [{log.type}]
                      </span>
                      <span className="text-[var(--theme-text-primary)] break-words flex-1">
                        {log.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
