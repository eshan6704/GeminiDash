import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MarketAsset,
  Position,
  Candle,
  SimulatorConfig,
  AutoGridConfig,
  AutoGridRuntimeState,
  AutoGridLogItem,
  AutoGridDirectionMode,
  AutoGridTimeframeFilter,
  AutoGridSpacingMode,
  CandleTrendInfo,
  GridLadderLevel,
  getBrokerDefaultSize,
  getBrokerMaxLeverage,
} from '../types/trading';
import { fetchCandles } from '../services/marketData';
import {
  evaluateTradeEntryConditions,
  MAX_RUNNING_TRADES,
} from '../utils/tradeEntryConditions';
import {
  calculateGridLadderLevels,
  calculateDownsideLadderLevels,
  snapToGridMultiple,
} from '../utils/gridLadderCalculator';

const STORAGE_KEY_CONFIG = 'aurumx_auto_grid_config_v2';
const STORAGE_KEY_STATE = 'aurumx_auto_grid_state_v2';

// Helper to analyze candle trend from a series of candles
function analyzeCandleTrend(candles: Candle[], timeframe: '15m' | '1h'): CandleTrendInfo | undefined {
  if (!candles || candles.length === 0) return undefined;

  const last = candles[candles.length - 1];
  const prev = candles.length > 1 ? candles[candles.length - 2] : last;

  // Calculate SMA 10 over recent candles
  const windowSize = Math.min(10, candles.length);
  const subset = candles.slice(-windowSize);
  const sum = subset.reduce((acc, c) => acc + c.close, 0);
  const sma10 = sum / windowSize;

  const changePercent = prev.close !== 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;
  const candleBullish = last.close >= last.open;
  const isAboveSMA = last.close >= sma10;

  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (candleBullish && isAboveSMA) {
    direction = 'BULLISH';
  } else if (!candleBullish && !isAboveSMA) {
    direction = 'BEARISH';
  } else {
    direction = candleBullish ? 'BULLISH' : 'BEARISH';
  }

  return {
    timeframe,
    direction,
    open: last.open,
    close: last.close,
    high: last.high,
    low: last.low,
    changePercent,
    sma10,
  };
}

// Resolve trade side (BUY vs SELL) from candle trends
export function resolveDirectionFromCandles(
  directionMode: AutoGridDirectionMode,
  timeframeFilter: AutoGridTimeframeFilter,
  trend15m?: CandleTrendInfo,
  trend1h?: CandleTrendInfo,
  defaultSide: 'BUY' | 'SELL' = 'BUY'
): { side: 'BUY' | 'SELL'; detectedTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  if (directionMode === 'BUY_ONLY') {
    return { side: 'BUY', detectedTrend: trend1h?.direction || trend15m?.direction || 'BULLISH' };
  }
  if (directionMode === 'SELL_ONLY') {
    return { side: 'SELL', detectedTrend: trend1h?.direction || trend15m?.direction || 'BEARISH' };
  }

  // AUTO_TREND:
  let effectiveTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'BULLISH';

  if (timeframeFilter === '1h') {
    effectiveTrend = trend1h?.direction || trend15m?.direction || 'BULLISH';
  } else if (timeframeFilter === '15m') {
    effectiveTrend = trend15m?.direction || trend1h?.direction || 'BULLISH';
  } else {
    // CONFLUENCE:
    if (trend1h?.direction === 'BEARISH' && trend15m?.direction === 'BEARISH') {
      effectiveTrend = 'BEARISH';
    } else if (trend1h?.direction === 'BULLISH' && trend15m?.direction === 'BULLISH') {
      effectiveTrend = 'BULLISH';
    } else {
      // 1h candle has higher structural weight
      effectiveTrend = trend1h?.direction || trend15m?.direction || 'BULLISH';
    }
  }

  const side = effectiveTrend === 'BEARISH' ? 'SELL' : 'BUY';
  return { side, detectedTrend: effectiveTrend };
}

export function useAutoGridTrader(
  asset: MarketAsset,
  positions: Position[],
  cashBalance: number,
  config: SimulatorConfig,
  placeOrder: (params: any) => boolean,
  closePosition: (positionId: string, percentage?: number) => void,
  updatePositionSLTP: (positionId: string, stopLoss?: number, takeProfit?: number) => void,
  onNotify?: (type: 'success' | 'info' | 'warning' | 'danger', title: string, message: string) => void
) {
  // 1. Configuration State
  const [gridConfig, setGridConfig] = useState<AutoGridConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          symbol: asset.symbol,
          directionMode: parsed.directionMode || 'AUTO_TREND',
          timeframeFilter: parsed.timeframeFilter || 'CONFLUENCE',
          spacingMode: parsed.spacingMode || 'EQUAL',
          upsideMultiplier: parsed.upsideMultiplier !== undefined ? parsed.upsideMultiplier : 0.5,
          downsideMultiplier: parsed.downsideMultiplier !== undefined ? parsed.downsideMultiplier : 1.0,
          stepMultiplier: parsed.stepMultiplier !== undefined ? parsed.stepMultiplier : 2,
          downsideGapMultiplier: parsed.downsideGapMultiplier !== undefined ? parsed.downsideGapMultiplier : 2,
          gridStructure: parsed.gridStructure || 'BIDIRECTIONAL',
        };
      }
    } catch (e) {
      console.error('Failed to load auto grid config:', e);
    }

    return {
      id: 'default_grid',
      enabled: false,
      symbol: asset.symbol,
      side: 'BUY',
      directionMode: 'AUTO_TREND',
      timeframeFilter: 'CONFLUENCE',
      spacingMode: 'EQUAL',
      upsideMultiplier: 0.5,
      downsideMultiplier: 1.0,
      stepMultiplier: 2,
      downsideGapMultiplier: 2,
      gridStructure: 'BIDIRECTIONAL',
      gridSpacing: 50,
      entryOffset: 2.5,
      initialSlOffset: -50,
      profitActivationThreshold: 25,
      lockedProfitSlOffset: 15,
      trailingDistance: 10,
      pullbackTrigger: 5,
      minExitProfitOffset: 15,
      lotSize: getBrokerDefaultSize(asset.symbol),
      leverage: getBrokerMaxLeverage(asset.symbol),
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: asset.price,
    };
  });

  // 2. Runtime State
  const [runtime, setRuntime] = useState<AutoGridRuntimeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load auto grid runtime:', e);
    }

    return {
      status: 'IDLE',
      currentCycle: 1,
      basePrice: asset.price,
      targetEntryPrice: asset.price + 2.5,
      activeSide: 'BUY',
      completedTradesCount: 0,
      totalRealizedPoints: 0,
      totalRealizedPnL: 0,
      logs: [
        {
          id: 'init',
          timestamp: Date.now(),
          type: 'INFO',
          message: 'Auto Grid Simulator ready. Monitors 1h/15m candle trends for Buy & Sell directions.',
        },
      ],
    };
  });

  // Save config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(gridConfig));
    } catch (e) {
      console.error('Failed to save auto grid config:', e);
    }
  }, [gridConfig]);

  // Save runtime to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(runtime));
    } catch (e) {
      console.error('Failed to save auto grid runtime:', e);
    }
  }, [runtime]);

  // Helper to add logs
  const addLog = useCallback(
    (type: AutoGridLogItem['type'], message: string, price?: number, pnl?: number, points?: number) => {
      const newLog: AutoGridLogItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type,
        message,
        price,
        pnl,
        points,
      };

      setRuntime((prev) => ({
        ...prev,
        logs: [newLog, ...prev.logs.slice(0, 99)],
      }));
    },
    []
  );

  // References to keep callbacks and effects always fresh
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const currentPriceRef = useRef(asset.price);
  currentPriceRef.current = asset.price;

  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  const configRef = useRef(gridConfig);
  configRef.current = gridConfig;

  const cashBalanceRef = useRef(cashBalance);
  cashBalanceRef.current = cashBalance;

  const placeOrderRef = useRef(placeOrder);
  placeOrderRef.current = placeOrder;

  const closePositionRef = useRef(closePosition);
  closePositionRef.current = closePosition;

  const updatePositionSLTPRef = useRef(updatePositionSLTP);
  updatePositionSLTPRef.current = updatePositionSLTP;

  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  const candles15mRef = useRef<Candle[]>([]);
  const candles1hRef = useRef<Candle[]>([]);
  const last1hCandleTimeRef = useRef<number>(0);
  const lastGatingLogRef = useRef<number>(0);

  // 3. Candle Trend Fetcher & Updater (15m & 1h)
  const refreshCandleTrends = useCallback(async () => {
    try {
      const [candles15m, candles1h] = await Promise.all([
        fetchCandles(asset.symbol, '15m'),
        fetchCandles(asset.symbol, '1h'),
      ]);

      candles15mRef.current = candles15m;
      candles1hRef.current = candles1h;

      const t15m = analyzeCandleTrend(candles15m, '15m');
      const t1h = analyzeCandleTrend(candles1h, '1h');

      const { side: resolvedSide, detectedTrend } = resolveDirectionFromCandles(
        configRef.current.directionMode,
        configRef.current.timeframeFilter,
        t15m,
        t1h,
        configRef.current.side
      );

      // Hourly Candle Close detection
      const latest1h = candles1h[candles1h.length - 1];
      const prev1hTime = last1hCandleTimeRef.current;
      const isNew1hClose = prev1hTime !== 0 && latest1h && latest1h.time !== prev1hTime;
      if (latest1h) {
        last1hCandleTimeRef.current = latest1h.time;
      }

      setRuntime((prev) => {
        const isTradeRunning = positionsRef.current.some((p) => p.assetSymbol === asset.symbol);
        const isIdleOrWaiting = prev.status === 'IDLE' || prev.status === 'WAITING_FOR_ENTRY';

        // Auto Grid Anchor Update:
        // Case 1: If NO trade is running -> auto-update grid anchor to nearest multiple of gridSpacing (e.g. multiple of 50)
        // Case 2: If trade is running and 1-hour candle closes -> re-anchor based on hourly close snapped to multiple of 50
        let newBase = prev.basePrice;
        if (!isTradeRunning) {
          // Dynamic snap to multiple of grid (e.g. 50, 4500, 4550)
          newBase = snapToGridMultiple(asset.price, configRef.current.gridSpacing || 50);
        } else if (isNew1hClose && latest1h) {
          // Closed hourly candle anchor
          const hourlyAnchor = snapToGridMultiple(latest1h.close, configRef.current.gridSpacing || 50);
          addLogRef.current(
            'INFO',
            `[HOURLY CANDLE CLOSE] 1h Candle closed @ $${latest1h.close.toFixed(2)}. Snapped grid base anchor to $${hourlyAnchor.toFixed(2)} (Multiple of ${configRef.current.gridSpacing || 50}).`
          );
          newBase = hourlyAnchor;
        }

        const nextActiveSide = isIdleOrWaiting ? resolvedSide : prev.activeSide;
        const targetEntry = isIdleOrWaiting
          ? nextActiveSide === 'BUY'
            ? snapToGridMultiple(newBase + (configRef.current.entryOffset || 0), 0.5)
            : snapToGridMultiple(newBase - (configRef.current.entryOffset || 0), 0.5)
          : prev.targetEntryPrice;

        if (
          prev.trend15m?.direction === t15m?.direction &&
          prev.trend15m?.changePercent === t15m?.changePercent &&
          prev.trend1h?.direction === t1h?.direction &&
          prev.trend1h?.changePercent === t1h?.changePercent &&
          prev.detectedTrend === detectedTrend &&
          prev.activeSide === nextActiveSide &&
          prev.basePrice === newBase &&
          prev.targetEntryPrice === targetEntry
        ) {
          return prev;
        }

        return {
          ...prev,
          basePrice: newBase,
          trend15m: t15m,
          trend1h: t1h,
          detectedTrend,
          activeSide: nextActiveSide,
          targetEntryPrice: targetEntry,
        };
      });
    } catch (err) {
      console.warn('Failed to refresh candle trends', err);
    }
  }, [asset.symbol, asset.price]);

  // Initial & periodic refresh of 15m/1h candle trends
  useEffect(() => {
    refreshCandleTrends();
    const interval = setInterval(refreshCandleTrends, 15000); // every 15s
    return () => clearInterval(interval);
  }, [refreshCandleTrends]);

  // 4. Main Real-time Tick Evaluation Engine
  useEffect(() => {
    const curPrice = asset.price;
    const currentRuntime = runtimeRef.current;
    const cfg = configRef.current;

    // Only process if enabled and targeting this asset
    if (!cfg.enabled || cfg.symbol !== asset.symbol) {
      return;
    }

    const activeSide = currentRuntime.activeSide || cfg.side || 'BUY';
    const isLong = activeSide === 'BUY';

    // A. WAITING FOR ENTRY STATE
    if (currentRuntime.status === 'WAITING_FOR_ENTRY') {
      const target = currentRuntime.targetEntryPrice;
      const runningTrades = positionsRef.current;
      const runningTradesCount = runningTrades.length;

      // Rule 1: Max running live trades is 10
      if (runningTradesCount >= MAX_RUNNING_TRADES) {
        const now = Date.now();
        if (now - lastGatingLogRef.current > 15000) {
          lastGatingLogRef.current = now;
          addLogRef.current(
            'INFO',
            `[MAX CAPACITY REACHED] 10/10 active live trades currently running. Auto Grid entry is paused until a live trade closes.`
          );
        }
        setRuntime((prev) => {
          if (prev.slotNumber === 10 && prev.slotUnmetReason === 'Max 10 live trades running') return prev;
          return {
            ...prev,
            slotNumber: 10,
            slotTierName: 'Max Limit (10/10)',
            slotDifficulty: 'BLOCKED',
            slotConditionPassed: false,
            slotUnmetReason: 'Max 10 live trades running',
            runningTradesCount,
          };
        });
        return;
      }

      // Entry trigger condition
      // For BUY (LONG): triggers when price rises to or crosses target (or is within 0.05% of target)
      // For SELL (SHORT): triggers when price drops to or crosses below target
      const shouldEnter = isLong ? curPrice >= target : curPrice <= target;

      if (shouldEnter) {
        // Calculate margin for specified lot size (Trade Value = Price * Qty)
        const tradeValue = curPrice * cfg.lotSize;
        const requiredMargin = tradeValue / cfg.leverage;

        if (requiredMargin > cashBalanceRef.current) {
          addLogRef.current(
            'ERROR',
            `Insufficient cash balance ($${cashBalanceRef.current.toFixed(2)}) for required margin ($${requiredMargin.toFixed(2)} USDT).`
          );
          if (onNotifyRef.current) {
            onNotifyRef.current(
              'danger',
              'Auto Grid: Insufficient Balance',
              `Required $${requiredMargin.toFixed(2)} USDT margin, but only $${cashBalanceRef.current.toFixed(2)} available.`
            );
          }
          setRuntime((prev) => ({ ...prev, status: 'PAUSED' }));
          setGridConfig((prev) => ({ ...prev, enabled: false }));
          return;
        }

        // Initial Stop Loss calculation:
        // For BUY (LONG): curPrice - 50 (below entry)
        // For SELL (SHORT): curPrice + 50 (above entry, protecting against rally)
        const initialSL = isLong
          ? curPrice + cfg.initialSlOffset // curPrice - 50
          : curPrice - cfg.initialSlOffset; // curPrice + 50

        // Rule 2: Progressive 10-Tier Entry Ladder Evaluation
        // (1st trade has minimum easy conditions, 10th trade has toughest conditions)
        const slotEval = evaluateTradeEntryConditions({
          runningPositions: runningTrades,
          asset,
          side: activeSide,
          cashBalance: cashBalanceRef.current,
          totalEquity: 0,
          requiredMargin,
          trend15m: currentRuntime.trend15m,
          trend1h: currentRuntime.trend1h,
          candles15m: candles15mRef.current,
          candles1h: candles1hRef.current,
          stopLossPrice: initialSL,
        });

        if (!slotEval.canEnter) {
          const now = Date.now();
          if (now - lastGatingLogRef.current > 12000) {
            lastGatingLogRef.current = now;
            addLogRef.current(
              'INFO',
              `[SLOT ${slotEval.slotNumber} GATING: ${slotEval.tier.name}] Price reached target ($${curPrice.toFixed(2)}), but ${slotEval.tier.difficultyBadge} entry conditions not yet satisfied: ${slotEval.unmetReasons[0] || 'Pending confirmation'}. Holding entry until conditions align.`
            );
          }
          setRuntime((prev) => {
            if (
              prev.slotNumber === slotEval.slotNumber &&
              prev.slotConditionPassed === false &&
              prev.slotUnmetReason === slotEval.unmetReasons[0]
            ) {
              return prev;
            }
            return {
              ...prev,
              slotNumber: slotEval.slotNumber,
              slotTierName: slotEval.tier.name,
              slotDifficulty: slotEval.tier.difficultyBadge,
              slotConditionPassed: false,
              slotUnmetReason: slotEval.unmetReasons[0],
              runningTradesCount,
            };
          });
          return;
        }

        // Execute order through the simulator with activeSide (BUY or SELL)
        const placed = placeOrderRef.current({
          symbol: cfg.symbol,
          mode: 'LEVERAGED',
          side: activeSide,
          orderType: 'MARKET',
          margin: requiredMargin,
          leverage: cfg.leverage,
          stopLossPrice: initialSL,
        });

        if (placed) {
          const minExit = isLong
            ? curPrice + cfg.lockedProfitSlOffset
            : curPrice - cfg.lockedProfitSlOffset;

          setTimeout(() => {
            const openPos = positionsRef.current.find(
              (p) => p.assetSymbol === cfg.symbol && p.side === (isLong ? 'LONG' : 'SHORT')
            );

            setRuntime((prev) => ({
              ...prev,
              status: 'IN_POSITION',
              activeSide,
              activePositionId: openPos ? openPos.id : undefined,
              entryPrice: curPrice,
              highestPriceReached: isLong ? curPrice : undefined,
              lowestPriceReached: !isLong ? curPrice : undefined,
              currentTrailingSL: initialSL,
              initialSLPrice: initialSL,
              minExitPrice: minExit,
              lockedProfitSlPrice: minExit,
              isChasingActivated: false,
              pointsGain: 0,
              peakPointsGain: 0,
              runningTradesCount: runningTradesCount + 1,
              slotNumber: slotEval.slotNumber,
              slotTierName: slotEval.tier.name,
              slotDifficulty: slotEval.tier.difficultyBadge,
              slotConditionPassed: true,
              slotUnmetReason: undefined,
            }));

            addLogRef.current(
              'TRIGGER',
              `[CYCLE ${currentRuntime.currentCycle} | SLOT ${slotEval.slotNumber} ENTRY] ${activeSide} ${cfg.lotSize} ${cfg.symbol} @ $${curPrice.toFixed(2)}! Met ${slotEval.tier.difficultyBadge} (${slotEval.tier.name}). Initial SL: $${initialSL.toFixed(2)} (${isLong ? cfg.initialSlOffset : `+${Math.abs(cfg.initialSlOffset)}`} pts). Target Lock @ +${cfg.profitActivationThreshold ?? 25} pts.`,
              curPrice
            );

            if (onNotifyRef.current) {
              onNotifyRef.current(
                'success',
                `Auto Grid Slot #${slotEval.slotNumber} Executed`,
                `${activeSide} ${cfg.lotSize} ${cfg.symbol} @ $${curPrice.toFixed(2)}. SL: $${initialSL.toFixed(2)}`
              );
            }
          }, 100);
        }
      }
    }

    // B. IN POSITION: CHASE PEAK (HIGH for LONG, LOW for SHORT) & DYNAMIC TRAILING SL
    else if (currentRuntime.status === 'IN_POSITION' && currentRuntime.entryPrice) {
      const entry = currentRuntime.entryPrice;
      const pointsDiff = isLong ? curPrice - entry : entry - curPrice;

      // Track extreme price reached (High for Long, Low for Short)
      let newHighest = currentRuntime.highestPriceReached;
      let newLowest = currentRuntime.lowestPriceReached;
      let peakPoints = 0;
      let pullbackFromPeak = 0;
      let shouldUpdatePeak = false;

      if (isLong) {
        const prevHighest = currentRuntime.highestPriceReached || entry;
        newHighest = Math.max(prevHighest, curPrice);
        peakPoints = newHighest - entry;
        pullbackFromPeak = newHighest - curPrice;
        shouldUpdatePeak = newHighest > prevHighest;
      } else {
        const prevLowest = currentRuntime.lowestPriceReached || entry;
        newLowest = Math.min(prevLowest, curPrice);
        peakPoints = entry - newLowest;
        pullbackFromPeak = curPrice - newLowest; // price rebounding up from low
        shouldUpdatePeak = newLowest < prevLowest;
      }

      let newTrailingSL = currentRuntime.currentTrailingSL || (isLong ? entry + cfg.initialSlOffset : entry - cfg.initialSlOffset);
      let isChasingActive = currentRuntime.isChasingActivated || false;

      // STEP 1: "Once price >+25, sl will be entry +15, then start chasing"
      // For LONG: price >= entry + 25 -> SL moves to entry + 15
      // For SHORT: price <= entry - 25 -> SL moves to entry - 15
      const activationPoints = cfg.profitActivationThreshold ?? 25;
      const lockedOffset = cfg.lockedProfitSlOffset ?? 15;
      const lockedSlPrice = isLong ? entry + lockedOffset : entry - lockedOffset;

      const hasReachedActivation = peakPoints >= activationPoints;

      if (!isChasingActive && hasReachedActivation) {
        isChasingActive = true;
        const isBetter = isLong ? lockedSlPrice > newTrailingSL : lockedSlPrice < newTrailingSL;
        if (isBetter) {
          newTrailingSL = lockedSlPrice;
          if (currentRuntime.activePositionId && currentRuntime.currentTrailingSL !== lockedSlPrice) {
            updatePositionSLTPRef.current(currentRuntime.activePositionId, lockedSlPrice, undefined);
          }
          addLogRef.current(
            'SL_UPDATE',
            `Profit Lock Activated: Price gained >+${activationPoints} pts (${activeSide} @ $${curPrice.toFixed(2)}). Stop Loss ratcheted to entry ${isLong ? '+' : '-'}${lockedOffset} pts ($${lockedSlPrice.toFixed(2)}). Trailing chase active!`,
            lockedSlPrice,
            undefined,
            lockedOffset
          );
        }
      }

      // STEP 2: "then start chasing" (Trailing Dynamic Stop Loss)
      if (isChasingActive) {
        if (pullbackFromPeak >= cfg.pullbackTrigger) {
          const proposedSLPoints = peakPoints - cfg.trailingDistance;
          const proposedSLPrice = isLong
            ? entry + proposedSLPoints
            : entry - proposedSLPoints;

          const isAtLeastLockedSL = isLong ? proposedSLPrice >= lockedSlPrice : proposedSLPrice <= lockedSlPrice;
          const isBetterThanCurrent = isLong
            ? proposedSLPrice > newTrailingSL
            : proposedSLPrice < newTrailingSL;

          if (isAtLeastLockedSL && isBetterThanCurrent) {
            newTrailingSL = proposedSLPrice;
            if (currentRuntime.activePositionId && currentRuntime.currentTrailingSL !== proposedSLPrice) {
              updatePositionSLTPRef.current(currentRuntime.activePositionId, proposedSLPrice, undefined);
            }
            addLogRef.current(
              'SL_UPDATE',
              `Chase & Pullback: Peak reached +${peakPoints.toFixed(2)} pts. Retraced ${pullbackFromPeak.toFixed(2)} pts to $${curPrice.toFixed(2)}. Ratcheted Trailing SL to $${proposedSLPrice.toFixed(2)} (${isLong ? '+' : '-'}${proposedSLPoints.toFixed(2)} pts, locked ≥ ${isLong ? '+' : '-'}${lockedOffset} pts).`,
              proposedSLPrice,
              undefined,
              proposedSLPoints
            );
          }
        }
      }

      // Update runtime state for live tracking HUD only when values change
      setRuntime((prev) => {
        const hasChanged =
          prev.highestPriceReached !== newHighest ||
          prev.lowestPriceReached !== newLowest ||
          prev.currentTrailingSL !== newTrailingSL ||
          prev.isChasingActivated !== isChasingActive ||
          prev.lockedProfitSlPrice !== lockedSlPrice;

        if (!hasChanged) {
          return prev;
        }

        return {
          ...prev,
          highestPriceReached: newHighest,
          lowestPriceReached: newLowest,
          currentTrailingSL: newTrailingSL,
          isChasingActivated: isChasingActive,
          lockedProfitSlPrice: lockedSlPrice,
          pointsGain: pointsDiff,
          peakPointsGain: peakPoints,
        };
      });

      if (shouldUpdatePeak && peakPoints > 5 && Math.floor(peakPoints) % 10 === 0) {
        addLogRef.current(
          'CHASE_HIGH',
          `Chase Extreme: New ${isLong ? 'peak' : 'trough'} reached @ $${(isLong ? newHighest : newLowest)?.toFixed(2)} (+${peakPoints.toFixed(2)} pts in ${activeSide} direction).`,
          isLong ? newHighest : newLowest,
          undefined,
          peakPoints
        );
      }

      // 4. Check Exit Trigger (Trailing SL Hit)
      // For LONG: exit when price drops to or below SL
      // For SHORT: exit when price rallies to or above SL
      const hitTrailingSL = isLong ? curPrice <= newTrailingSL : curPrice >= newTrailingSL;

      if (hitTrailingSL) {
        const isCatastropheSL = isLong
          ? newTrailingSL <= entry + cfg.initialSlOffset + 0.1
          : newTrailingSL >= entry - cfg.initialSlOffset - 0.1;

        const isProfitableExit = isLong
          ? newTrailingSL >= (currentRuntime.minExitPrice || entry + (cfg.lockedProfitSlOffset ?? 15)) - 0.1
          : newTrailingSL <= (currentRuntime.minExitPrice || entry - (cfg.lockedProfitSlOffset ?? 15)) + 0.1;

        if (isCatastropheSL || isProfitableExit) {
          if (currentRuntime.activePositionId) {
            closePositionRef.current(currentRuntime.activePositionId, 100);
          } else {
            const openPos = positionsRef.current.find((p) => p.assetSymbol === cfg.symbol);
            if (openPos) {
              closePositionRef.current(openPos.id, 100);
            }
          }

          const exitPoints = isLong ? curPrice - entry : entry - curPrice;
          const estPnL = exitPoints * cfg.lotSize;

          addLogRef.current(
            'EXIT',
            `[CYCLE ${currentRuntime.currentCycle}] ${activeSide} Trailing SL hit @ $${curPrice.toFixed(2)}! Realized: ${exitPoints >= 0 ? '+' : ''}${exitPoints.toFixed(2)} pts (~$${estPnL.toFixed(2)} USDT).`,
            curPrice,
            estPnL,
            exitPoints
          );

          if (onNotifyRef.current) {
            onNotifyRef.current(
              estPnL >= 0 ? 'success' : 'warning',
              `Auto Grid Cycle Complete: ${cfg.symbol}`,
              `Closed ${activeSide} @ $${curPrice.toFixed(2)}. Realized: ${exitPoints >= 0 ? '+' : ''}${exitPoints.toFixed(2)} pts (~$${estPnL.toFixed(2)} USDT)`
            );
          }

          // Advance Grid Level if autoLoop is enabled
          if (cfg.autoLoop && currentRuntime.currentCycle < cfg.maxGridCycles) {
            const nextCycle = currentRuntime.currentCycle + 1;

            // Re-evaluate candle trend for next cycle direction
            const { side: nextSide } = resolveDirectionFromCandles(
              cfg.directionMode,
              cfg.timeframeFilter,
              currentRuntime.trend15m,
              currentRuntime.trend1h,
              cfg.side
            );

            // Spacing: advance base price according to selected Grid Ladder (EQUAL vs STEP)
            const ladder = calculateGridLadderLevels({
              basePrice: currentRuntime.basePrice,
              gridSpacing: cfg.gridSpacing,
              entryOffset: cfg.entryOffset,
              isLong: nextSide === 'BUY',
              spacingMode: cfg.spacingMode || 'EQUAL',
              upsideMultiplier: cfg.upsideMultiplier !== undefined ? cfg.upsideMultiplier : 0.5,
              downsideMultiplier: cfg.downsideMultiplier !== undefined ? cfg.downsideMultiplier : 1.0,
              stepMultiplier: cfg.stepMultiplier || 2,
              downsideGapMultiplier: cfg.downsideGapMultiplier || 2,
              currentPrice: curPrice,
              currentActiveLevel: nextCycle,
            });
            const nextLevelInfo = ladder[nextCycle - 1] || ladder[ladder.length - 1];
            const nextBasePrice = nextLevelInfo.milestoneTriggerPrice;
            const nextEntry = nextLevelInfo.targetEntryPrice;

            setRuntime((prev) => ({
              ...prev,
              status: 'WAITING_FOR_ENTRY',
              currentCycle: nextCycle,
              activeSide: nextSide,
              basePrice: nextBasePrice,
              targetEntryPrice: nextEntry,
              activePositionId: undefined,
              entryPrice: undefined,
              highestPriceReached: undefined,
              lowestPriceReached: undefined,
              currentTrailingSL: undefined,
              initialSLPrice: undefined,
              minExitPrice: undefined,
              lockedProfitSlPrice: undefined,
              isChasingActivated: false,
              pointsGain: 0,
              peakPointsGain: 0,
              completedTradesCount: prev.completedTradesCount + 1,
              totalRealizedPoints: prev.totalRealizedPoints + exitPoints,
              totalRealizedPnL: prev.totalRealizedPnL + estPnL,
            }));

            addLogRef.current(
              'CYCLE_COMPLETE',
              `Advancing to Cycle ${nextCycle}/${cfg.maxGridCycles} (${nextSide}) [${cfg.spacingMode || 'EQUAL'} Mode: ${nextLevelInfo.multiplierLabel}]. Milestone Base: $${nextBasePrice.toFixed(2)}. Waiting for entry @ $${nextEntry.toFixed(2)}.`,
              nextEntry
            );
          } else {
            // Sequence completed
            setRuntime((prev) => ({
              ...prev,
              status: 'COMPLETED',
              activePositionId: undefined,
              completedTradesCount: prev.completedTradesCount + 1,
              totalRealizedPoints: prev.totalRealizedPoints + exitPoints,
              totalRealizedPnL: prev.totalRealizedPnL + estPnL,
            }));
            setGridConfig((prev) => ({ ...prev, enabled: false }));

            addLogRef.current(
              'INFO',
              `Auto Grid sequence completed ${currentRuntime.currentCycle} cycles. Total Realized: ${currentRuntime.totalRealizedPoints + exitPoints >= 0 ? '+' : ''}${(currentRuntime.totalRealizedPoints + exitPoints).toFixed(2)} points.`
            );
          }
        }
      }
    }
  }, [asset.price, asset.symbol]);

  // Actions
  const startBot = useCallback(
    (basePrice?: number) => {
      const curRuntime = runtimeRef.current;
      const rawBase = basePrice !== undefined ? basePrice : (gridConfig.basePriceAnchor || asset.price);
      const base = snapToGridMultiple(rawBase, gridConfig.gridSpacing || 50);

      // Determine initial side based on candle trend
      const { side: chosenSide, detectedTrend } = resolveDirectionFromCandles(
        gridConfig.directionMode,
        gridConfig.timeframeFilter,
        curRuntime.trend15m,
        curRuntime.trend1h,
        gridConfig.side
      );

      const target = chosenSide === 'BUY'
        ? snapToGridMultiple(base + (gridConfig.entryOffset || 0), 0.5)
        : snapToGridMultiple(base - (gridConfig.entryOffset || 0), 0.5);

      setGridConfig((prev) => ({
        ...prev,
        enabled: true,
        side: chosenSide,
        basePriceAnchor: base,
      }));

      setRuntime((prev) => ({
        ...prev,
        status: 'WAITING_FOR_ENTRY',
        currentCycle: 1,
        activeSide: chosenSide,
        basePrice: base,
        targetEntryPrice: target,
        activePositionId: undefined,
        entryPrice: undefined,
        highestPriceReached: undefined,
        lowestPriceReached: undefined,
        currentTrailingSL: undefined,
        isChasingActivated: false,
        pointsGain: 0,
        peakPointsGain: 0,
      }));

      addLogRef.current(
        'INFO',
        `Auto Grid started (${chosenSide}) for ${gridConfig.symbol}! Trend: ${detectedTrend} (1h: ${curRuntime.trend1h?.direction || 'N/A'}, 15m: ${curRuntime.trend15m?.direction || 'N/A'}). Target ${chosenSide} entry: $${target.toFixed(2)}. SL on start: ${chosenSide === 'BUY' ? gridConfig.initialSlOffset : `+${Math.abs(gridConfig.initialSlOffset)}`} pts. Once price >+${gridConfig.profitActivationThreshold ?? 25} pts, SL locked to entry ${chosenSide === 'BUY' ? '+' : '-'}${gridConfig.lockedProfitSlOffset ?? 15} pts, then chasing begins.`,
        target
      );

      if (onNotifyRef.current) {
        onNotifyRef.current(
          'info',
          `Auto Grid Started (${chosenSide})`,
          `Armed for ${gridConfig.symbol} based on ${gridConfig.timeframeFilter} candle trend. Waiting for entry @ $${target.toFixed(2)}.`
        );
      }
    },
    [asset.price, gridConfig]
  );

  const pauseBot = useCallback(() => {
    setGridConfig((prev) => ({ ...prev, enabled: false }));
    setRuntime((prev) => ({ ...prev, status: 'PAUSED' }));
    addLogRef.current('INFO', 'Auto Grid paused by user.');
    if (onNotifyRef.current) {
      onNotifyRef.current('warning', 'Auto Grid Paused', 'Automated trade triggers suspended.');
    }
  }, []);

  const resumeBot = useCallback(() => {
    setGridConfig((prev) => ({ ...prev, enabled: true }));
    setRuntime((prev) => ({
      ...prev,
      status: prev.activePositionId ? 'IN_POSITION' : 'WAITING_FOR_ENTRY',
    }));
    addLogRef.current('INFO', 'Auto Grid resumed.');
  }, []);

  const stopBot = useCallback(
    (closeCurrentPosition: boolean = false) => {
      setGridConfig((prev) => ({ ...prev, enabled: false }));

      const currentActivePosId = runtimeRef.current.activePositionId;
      if (closeCurrentPosition && currentActivePosId) {
        closePositionRef.current(currentActivePosId, 100);
        addLogRef.current('INFO', 'Closed active position on bot termination.');
      }

      setRuntime((prev) => ({
        ...prev,
        status: 'IDLE',
        activePositionId: undefined,
      }));

      addLogRef.current('INFO', 'Auto Grid stopped.');
      if (onNotifyRef.current) {
        onNotifyRef.current('info', 'Auto Grid Stopped', 'Auto Grid terminated.');
      }
    },
    []
  );

  const resetBot = useCallback(() => {
    setGridConfig((prev) => ({ ...prev, enabled: false }));
    setRuntime((prev) => ({
      ...prev,
      status: 'IDLE',
      currentCycle: 1,
      basePrice: asset.price,
      targetEntryPrice: asset.price + gridConfig.entryOffset,
      completedTradesCount: 0,
      totalRealizedPoints: 0,
      totalRealizedPnL: 0,
      logs: [
        {
          id: 'reset',
          timestamp: Date.now(),
          type: 'INFO',
          message: 'Auto Grid reset to initial state.',
        },
      ],
    }));
  }, [asset.price, gridConfig.entryOffset]);

  const updateConfig = useCallback((partial: Partial<AutoGridConfig>) => {
    setGridConfig((prev) => {
      const updated = { ...prev, ...partial };
      return updated;
    });
  }, []);

  const applyGoldPreset = useCallback(() => {
    setGridConfig((prev) => ({
      ...prev,
      gridSpacing: 50,
      entryOffset: 2.5,
      initialSlOffset: -50,
      profitActivationThreshold: 25,
      lockedProfitSlOffset: 15,
      trailingDistance: 10,
      pullbackTrigger: 5,
      minExitProfitOffset: 15,
      directionMode: 'AUTO_TREND',
      timeframeFilter: 'CONFLUENCE',
      lotSize: 0.1,
      leverage: 75,
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: asset.price,
    }));
    addLog(
      'INFO',
      'Applied Gold (XAUT) Spec: Auto-detects 1h/15m candle trend (Buy or Sell). Spacing 50 pts, Entry ±2.5, Initial SL ±50. Once price >+25 → SL moves to entry ±15, then chases high/trough. Size 0.1, 75x margin.'
    );
  }, [asset.price, addLog]);

  const applyBtcPreset = useCallback(() => {
    setGridConfig((prev) => ({
      ...prev,
      gridSpacing: 500,
      entryOffset: 25,
      initialSlOffset: -500,
      profitActivationThreshold: 250,
      lockedProfitSlOffset: 150,
      trailingDistance: 100,
      pullbackTrigger: 50,
      minExitProfitOffset: 150,
      directionMode: 'AUTO_TREND',
      timeframeFilter: 'CONFLUENCE',
      lotSize: 0.002,
      leverage: 100,
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: asset.price,
    }));
    addLog(
      'INFO',
      'Applied BTC Scalp Spec: Auto-detects 1h/15m trend (Buy or Sell). Spacing 500 pts, Entry ±25, Initial SL ±500. Once price >+250 → SL moves to entry ±150, then chases. Size 0.002 BTC, 100x.'
    );
  }, [asset.price, addLog]);

  const clearLogs = useCallback(() => {
    setRuntime((prev) => ({
      ...prev,
      logs: [
        {
          id: 'cleared',
          timestamp: Date.now(),
          type: 'INFO',
          message: 'Logs cleared.',
        },
      ],
    }));
  }, []);

  const gridLadder = useMemo(() => {
    const isLong = (runtime.activeSide || gridConfig.side) === 'BUY';
    return calculateGridLadderLevels({
      basePrice: runtime.basePrice || gridConfig.basePriceAnchor || asset.price,
      gridSpacing: gridConfig.gridSpacing,
      entryOffset: gridConfig.entryOffset,
      isLong,
      spacingMode: gridConfig.spacingMode || 'EQUAL',
      upsideMultiplier: gridConfig.upsideMultiplier !== undefined ? gridConfig.upsideMultiplier : 0.5,
      downsideMultiplier: gridConfig.downsideMultiplier !== undefined ? gridConfig.downsideMultiplier : 1.0,
      stepMultiplier: gridConfig.stepMultiplier || 2,
      downsideGapMultiplier: gridConfig.downsideGapMultiplier || 2,
      currentPrice: asset.price,
      currentActiveLevel: runtime.currentCycle || 1,
    });
  }, [
    runtime.basePrice,
    runtime.activeSide,
    runtime.currentCycle,
    gridConfig.side,
    gridConfig.basePriceAnchor,
    gridConfig.gridSpacing,
    gridConfig.entryOffset,
    gridConfig.spacingMode,
    gridConfig.upsideMultiplier,
    gridConfig.downsideMultiplier,
    gridConfig.stepMultiplier,
    gridConfig.downsideGapMultiplier,
    asset.price,
  ]);

  const downsideLadder = useMemo(() => {
    const isLong = (runtime.activeSide || gridConfig.side) === 'BUY';
    return calculateDownsideLadderLevels({
      basePrice: runtime.basePrice || gridConfig.basePriceAnchor || asset.price,
      gridSpacing: gridConfig.gridSpacing,
      entryOffset: gridConfig.entryOffset,
      isLong,
      spacingMode: gridConfig.spacingMode || 'EQUAL',
      upsideMultiplier: gridConfig.upsideMultiplier !== undefined ? gridConfig.upsideMultiplier : 0.5,
      downsideMultiplier: gridConfig.downsideMultiplier !== undefined ? gridConfig.downsideMultiplier : 1.0,
      stepMultiplier: gridConfig.stepMultiplier || 2,
      downsideGapMultiplier: gridConfig.downsideGapMultiplier || 2,
      currentPrice: asset.price,
      currentActiveLevel: runtime.currentCycle || 1,
    });
  }, [
    runtime.basePrice,
    runtime.activeSide,
    runtime.currentCycle,
    gridConfig.side,
    gridConfig.basePriceAnchor,
    gridConfig.gridSpacing,
    gridConfig.entryOffset,
    gridConfig.spacingMode,
    gridConfig.upsideMultiplier,
    gridConfig.downsideMultiplier,
    gridConfig.stepMultiplier,
    gridConfig.downsideGapMultiplier,
    asset.price,
  ]);

  return {
    gridConfig,
    runtime,
    gridLadder,
    downsideLadder,
    startBot,
    pauseBot,
    resumeBot,
    stopBot,
    resetBot,
    updateConfig,
    applyGoldPreset,
    applyBtcPreset,
    clearLogs,
    refreshCandleTrends,
  };
}
