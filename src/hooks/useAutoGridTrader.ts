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
  CandleTrendInfo,
  getBrokerDefaultSize,
  getBrokerMaxLeverage,
} from '../types/trading';
import { fetchCandles } from '../services/marketData';
import { MAX_RUNNING_TRADES } from '../utils/tradeEntryConditions';
import {
  calculateDigitGridSpec,
  calculateGridLadderLevels,
  calculateDownsideLadderLevels,
  snapToBaseMultiple,
  getBasePriceStep,
} from '../utils/gridLadderCalculator';

const STORAGE_KEY_CONFIG = 'aurumx_auto_grid_config_v4';
const STORAGE_KEY_STATE = 'aurumx_auto_grid_state_v4';

function analyzeCandleTrend(candles: Candle[], timeframe: '15m' | '1h'): CandleTrendInfo | undefined {
  if (!candles || candles.length === 0) return undefined;

  const last = candles[candles.length - 1];
  const prev = candles.length > 1 ? candles[candles.length - 2] : last;

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

// Resolve trade side (BUY vs SELL) strictly from user selection
export function resolveDirectionFromCandles(
  directionMode: AutoGridDirectionMode,
  _timeframeFilter: AutoGridTimeframeFilter,
  _trend15m?: CandleTrendInfo,
  _trend1h?: CandleTrendInfo,
  defaultSide: 'BUY' | 'SELL' = 'BUY'
): { side: 'BUY' | 'SELL'; detectedTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  if (directionMode === 'SELL_ONLY' || defaultSide === 'SELL') {
    return { side: 'SELL', detectedTrend: 'BEARISH' };
  }
  return { side: 'BUY', detectedTrend: 'BULLISH' };
}

export function useAutoGridTrader(
  asset: MarketAsset,
  positions: Position[],
  cashBalance: number,
  _config: SimulatorConfig,
  placeOrder: (params: any) => boolean,
  closePosition: (positionId: string, percentage?: number) => void,
  updatePositionSLTP: (positionId: string, stopLoss?: number, takeProfit?: number) => void,
  onNotify?: (type: 'success' | 'info' | 'warning' | 'danger', title: string, message: string) => void
) {
  const initialSpec = calculateDigitGridSpec(
    asset.price || 85435,
    {
      gridScaleFactor: 1.0,
      entryGapFactor: 0.01,
      slStartFactor: 0.2,
      winConditionFactor: 0.2,
      slAfterFactor: 0.01,
    },
    asset.symbol
  );

  // 1. Configuration State
  const [gridConfig, setGridConfig] = useState<AutoGridConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedSide: 'BUY' | 'SELL' =
          parsed.side === 'SELL' || parsed.directionMode === 'SELL_ONLY' ? 'SELL' : 'BUY';
        const spec = calculateDigitGridSpec(
          asset.price || 85435,
          {
            gridScaleFactor: parsed.gridScaleFactor ?? 1.0,
            entryGapFactor: parsed.entryGapFactor ?? 0.01,
            slStartFactor: parsed.slStartFactor ?? 0.2,
            winConditionFactor: parsed.winConditionFactor ?? 0.2,
            slAfterFactor: parsed.slAfterFactor ?? 0.01,
          },
          asset.symbol
        );
        return {
          ...parsed,
          symbol: asset.symbol,
          side: savedSide,
          directionMode: savedSide === 'SELL' ? 'SELL_ONLY' : 'BUY_ONLY',
          timeframeFilter: 'CONFLUENCE',
          spacingMode: 'EQUAL',
          gridScaleFactor: spec.gridScaleFactor,
          entryGapFactor: spec.entryGapFactor,
          slStartFactor: spec.slStartFactor,
          winConditionFactor: spec.winConditionFactor,
          slAfterFactor: spec.slAfterFactor,
          upsideMultiplier: parsed.upsideMultiplier !== undefined ? parsed.upsideMultiplier : 0.5,
          downsideMultiplier: parsed.downsideMultiplier !== undefined ? parsed.downsideMultiplier : 1.0,
          stepMultiplier: parsed.stepMultiplier !== undefined ? parsed.stepMultiplier : 2,
          downsideGapMultiplier: parsed.downsideGapMultiplier !== undefined ? parsed.downsideGapMultiplier : 2,
          gridStructure: 'BIDIRECTIONAL',
          gridSpacing: spec.effectiveG,
          entryOffset: spec.entryOffsetPts,
          initialSlOffset: -spec.slStartPts,
          profitActivationThreshold: spec.winConditionPts,
          trailingDistance: spec.slAfterPts,
          lockedProfitSlOffset: spec.lockedProfitAtWinPts,
          minExitProfitOffset: spec.lockedProfitAtWinPts,
          pullbackTrigger: Number((spec.slAfterPts * 0.5).toPrecision(6)),
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
      directionMode: 'BUY_ONLY',
      timeframeFilter: 'CONFLUENCE',
      spacingMode: 'EQUAL',
      gridScaleFactor: 1.0,
      entryGapFactor: 0.01,
      slStartFactor: 0.2,
      winConditionFactor: 0.2,
      slAfterFactor: 0.01,
      upsideMultiplier: 0.5,
      downsideMultiplier: 1.0,
      stepMultiplier: 2,
      downsideGapMultiplier: 2,
      gridStructure: 'BIDIRECTIONAL',
      gridSpacing: initialSpec.effectiveG, // e.g. 1000 for BTC @ 85435 (5-digit int -> 4-digit G)
      entryOffset: initialSpec.entryOffsetPts, // +0.01 * G = +10 pts
      initialSlOffset: -initialSpec.slStartPts, // -0.2 * G = -200 pts
      profitActivationThreshold: initialSpec.winConditionPts, // +0.2 * G = +200 pts
      lockedProfitSlOffset: initialSpec.lockedProfitAtWinPts, // +0.19 * G = +190 pts
      trailingDistance: initialSpec.slAfterPts, // -0.01 * G = 10 pts
      pullbackTrigger: Number((initialSpec.slAfterPts * 0.5).toPrecision(6)),
      minExitProfitOffset: initialSpec.lockedProfitAtWinPts,
      lotSize: getBrokerDefaultSize(asset.symbol),
      leverage: getBrokerMaxLeverage(asset.symbol),
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: snapToBaseMultiple(asset.price || 85435, asset.symbol, initialSpec.effectiveG),
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

    const base = snapToBaseMultiple(asset.price || 85435, asset.symbol, initialSpec.effectiveG);
    return {
      status: 'IDLE',
      currentCycle: 1,
      basePrice: base,
      targetEntryPrice: Number((base + initialSpec.entryOffsetPts).toFixed(6)),
      activeSide: 'BUY',
      completedTradesCount: 0,
      totalRealizedPoints: 0,
      totalRealizedPnL: 0,
      logs: [
        {
          id: 'init',
          timestamp: Date.now(),
          type: 'INFO',
          message: `Auto Grid Engine ready. ${initialSpec.intDigits}-digit int -> ${initialSpec.baseGDigits}-digit G=${initialSpec.baseG}. Entry: +0.01*G (+${initialSpec.entryOffsetPts}), SL Start: -0.2*G (-${initialSpec.slStartPts}), Win >0.2*G (+${initialSpec.winConditionPts}) -> SL After Win: -0.01*G (-${initialSpec.slAfterPts}).`,
        },
      ],
    };
  });

  // When switching coins while IDLE, auto-scale G and offsets from new coin's digit reference
  const prevSymbolRef = useRef<string>(asset.symbol);
  useEffect(() => {
    if (prevSymbolRef.current !== asset.symbol) {
      prevSymbolRef.current = asset.symbol;
      const spec = calculateDigitGridSpec(
        asset.price,
        {
          gridScaleFactor: gridConfig.gridScaleFactor ?? 1.0,
          entryGapFactor: gridConfig.entryGapFactor ?? 0.01,
          slStartFactor: gridConfig.slStartFactor ?? 0.2,
          winConditionFactor: gridConfig.winConditionFactor ?? 0.2,
          slAfterFactor: gridConfig.slAfterFactor ?? 0.01,
        },
        asset.symbol
      );
      const snappedBase = snapToBaseMultiple(asset.price, asset.symbol, spec.effectiveG);
      const isLong = gridConfig.side !== 'SELL';

      setGridConfig((prev) => ({
        ...prev,
        symbol: asset.symbol,
        gridSpacing: spec.effectiveG,
        entryOffset: spec.entryOffsetPts,
        initialSlOffset: -spec.slStartPts,
        profitActivationThreshold: spec.winConditionPts,
        trailingDistance: spec.slAfterPts,
        lockedProfitSlOffset: spec.lockedProfitAtWinPts,
        minExitProfitOffset: spec.lockedProfitAtWinPts,
        lotSize: getBrokerDefaultSize(asset.symbol),
        leverage: getBrokerMaxLeverage(asset.symbol),
        basePriceAnchor: snappedBase,
      }));

      setRuntime((prev) => {
        if (prev.status === 'IN_POSITION') return prev;
        return {
          ...prev,
          basePrice: snappedBase,
          targetEntryPrice: Number(
            (isLong
              ? snappedBase + spec.entryOffsetPts
              : snappedBase - spec.entryOffsetPts).toFixed(6)
          ),
        };
      });
    }
  }, [
    asset.symbol,
    asset.price,
    gridConfig.gridScaleFactor,
    gridConfig.entryGapFactor,
    gridConfig.slStartFactor,
    gridConfig.winConditionFactor,
    gridConfig.slAfterFactor,
    gridConfig.side,
  ]);

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
  const lastEntryTimestampRef = useRef<number>(0);

  // Dynamic Base Price & Pyramid/Averaging Grid Sync whenever NO live position is running:
  // - Suppose BTC price is 83010 -> Base is 83000 (multiple of 100 for BTC, else 0.1% of G)
  // - Suppose BTC price is 83610 -> Base is 83600
  // - Base update is ONLY applicable when no live position is running
  useEffect(() => {
    const curPrice = asset.price;
    if (!curPrice || curPrice <= 0) return;

    const hasLivePosForSymbol =
      runtimeRef.current.status === 'IN_POSITION' ||
      positionsRef.current.some((p) => p.assetSymbol === asset.symbol);

    if (hasLivePosForSymbol) {
      return; // Do NOT update base price while a live position is running
    }

    const cfg = configRef.current;
    const gVal = cfg.gridSpacing || 1000;
    const entryOff = cfg.entryOffset ?? Number((gVal * (cfg.entryGapFactor ?? 0.01)).toPrecision(6));
    const isLong = (runtimeRef.current.activeSide || cfg.side || 'BUY') === 'BUY';

    const newSnappedBase = snapToBaseMultiple(curPrice, asset.symbol, gVal);
    const newTargetEntry = Number(
      (isLong ? newSnappedBase + entryOff : newSnappedBase - entryOff).toFixed(6)
    );

    if (cfg.basePriceAnchor !== newSnappedBase) {
      setGridConfig((prev) =>
        prev.basePriceAnchor === newSnappedBase
          ? prev
          : { ...prev, basePriceAnchor: newSnappedBase }
      );
    }

    if (
      runtimeRef.current.basePrice !== newSnappedBase ||
      runtimeRef.current.targetEntryPrice !== newTargetEntry
    ) {
      setRuntime((prev) => {
        if (prev.status === 'IN_POSITION') return prev;
        if (prev.basePrice === newSnappedBase && prev.targetEntryPrice === newTargetEntry) {
          return prev;
        }
        return {
          ...prev,
          basePrice: newSnappedBase,
          targetEntryPrice: newTargetEntry,
        };
      });
    }
  }, [asset.price, asset.symbol, positions]);

  // 3. Candle Trend & Base Anchor Sync
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

      setRuntime((prev) => {
        const isTradeRunning =
          prev.status === 'IN_POSITION' ||
          positionsRef.current.some((p) => p.assetSymbol === asset.symbol);
        const isIdleOrWaiting = prev.status === 'IDLE' || prev.status === 'WAITING_FOR_ENTRY';
        const gStep = configRef.current.gridSpacing || 1000;
        const entryOff = configRef.current.entryOffset || gStep * 0.01;

        // Base update only applicable if no live position is running
        const newBase = !isTradeRunning
          ? snapToBaseMultiple(asset.price, asset.symbol, gStep)
          : prev.basePrice;

        const nextActiveSide = isIdleOrWaiting ? resolvedSide : prev.activeSide;
        const targetEntry = !isTradeRunning
          ? Number(
              (nextActiveSide === 'BUY' ? newBase + entryOff : newBase - entryOff).toFixed(6)
            )
          : prev.targetEntryPrice;

        if (
          prev.trend15m?.direction === t15m?.direction &&
          prev.trend1h?.direction === t1h?.direction &&
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

  useEffect(() => {
    refreshCandleTrends();
    const interval = setInterval(refreshCandleTrends, 15000);
    return () => clearInterval(interval);
  }, [refreshCandleTrends]);

  // 4. Main Real-time Tick Evaluation Engine
  useEffect(() => {
    const curPrice = asset.price;
    const currentRuntime = runtimeRef.current;
    const cfg = configRef.current;

    if (!cfg.enabled || cfg.symbol !== asset.symbol) {
      return;
    }

    const activeSide = currentRuntime.activeSide || cfg.side || 'BUY';
    const isLong = activeSide === 'BUY';

    // Derived factor distances from G:
    const gVal = cfg.gridSpacing || 1000;
    const slStartFactor = cfg.slStartFactor ?? 0.2;
    const winCondFactor = cfg.winConditionFactor ?? 0.2;
    const slAfterFactor = cfg.slAfterFactor ?? 0.01;

    const slStartDist = Number((gVal * slStartFactor).toPrecision(6)); // default 0.2 * G (e.g. 200 pts)
    const winCondPts = Number((gVal * winCondFactor).toPrecision(6)); // default 0.2 * G (e.g. 200 pts)
    const slAfterDist = Number((gVal * slAfterFactor).toPrecision(6)); // default 0.01 * G (e.g. 10 pts)
    const entryOff = cfg.entryOffset ?? Number((gVal * (cfg.entryGapFactor ?? 0.01)).toPrecision(6));

    // A. WAITING FOR ENTRY STATE (No live position running -> Base dynamically tracks latest price)
    if (currentRuntime.status === 'WAITING_FOR_ENTRY') {
      const runningTrades = positionsRef.current;
      const runningTradesCount = runningTrades.length;
      const hasLivePosForSymbol = runningTrades.some((p) => p.assetSymbol === cfg.symbol);

      // Since no live position is running for this symbol, Base is snapped from latest price
      // (for BTC: multiple of 100 -> e.g. 83010 -> 83000, 83610 -> 83600; else 0.1% of G)
      const dynamicBase = hasLivePosForSymbol
        ? currentRuntime.basePrice
        : snapToBaseMultiple(curPrice, cfg.symbol, gVal);
      const target = hasLivePosForSymbol
        ? currentRuntime.targetEntryPrice
        : Number((isLong ? dynamicBase + entryOff : dynamicBase - entryOff).toFixed(6));

      if (runningTradesCount >= MAX_RUNNING_TRADES) {
        const now = Date.now();
        if (now - lastGatingLogRef.current > 15000) {
          lastGatingLogRef.current = now;
          addLogRef.current(
            'INFO',
            `[MAX CAPACITY REACHED] 10/10 active live trades currently running. Auto Grid entry is paused until a live trade closes.`
          );
        }
        return;
      }

      const shouldEnter = isLong ? curPrice >= target : curPrice <= target;

      if (shouldEnter) {
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

        // Initial Trailing SL at start = -0.2 * G from entry price (for BUY) or +0.2 * G (for SELL)
        const initialSL = isLong
          ? Number((curPrice - slStartDist).toFixed(6))
          : Number((curPrice + slStartDist).toFixed(6));

        const currentSlotNum = Math.min(MAX_RUNNING_TRADES, runningTradesCount + 1);
        lastEntryTimestampRef.current = Date.now();

        const placed = placeOrderRef.current({
          symbol: cfg.symbol,
          mode: 'LEVERAGED',
          side: activeSide,
          orderType: 'MARKET',
          margin: requiredMargin,
          leverage: cfg.leverage,
          amount: cfg.lotSize,
          isMaker: true,
          stopLossPrice: initialSL,
          accountSource: 'AUTO_GRID',
        });

        if (placed) {
          const lockedAtWin = isLong
            ? curPrice + (winCondPts - slAfterDist)
            : curPrice - (winCondPts - slAfterDist);

          // Lock in the Base Price (e.g. 83000 for 83010, 83600 for 83610) while position is running
          setGridConfig((prev) => ({
            ...prev,
            basePriceAnchor: dynamicBase,
          }));

          setTimeout(() => {
            const openPos = positionsRef.current.find(
              (p) => p.assetSymbol === cfg.symbol && p.side === (isLong ? 'LONG' : 'SHORT')
            );

            setRuntime((prev) => ({
              ...prev,
              status: 'IN_POSITION',
              activeSide,
              basePrice: dynamicBase,
              targetEntryPrice: target,
              activePositionId: openPos ? openPos.id : undefined,
              entryPrice: curPrice,
              highestPriceReached: isLong ? curPrice : undefined,
              lowestPriceReached: !isLong ? curPrice : undefined,
              currentTrailingSL: initialSL,
              initialSLPrice: initialSL,
              minExitPrice: lockedAtWin,
              lockedProfitSlPrice: lockedAtWin,
              isChasingActivated: false,
              pointsGain: 0,
              peakPointsGain: 0,
              runningTradesCount: runningTradesCount + 1,
              slotNumber: currentSlotNum,
              slotConditionPassed: true,
              slotUnmetReason: undefined,
            }));

            addLogRef.current(
              'TRIGGER',
              `[CYCLE ${currentRuntime.currentCycle} | SLOT #${currentSlotNum} ENTRY] ${activeSide} ${cfg.lotSize} ${cfg.symbol} @ $${curPrice.toFixed(2)} (Base $${dynamicBase.toFixed(2)} -> Entry +${cfg.entryGapFactor ?? 0.01}*G). Base & Pyramid/DCA Grid locked while position is running. Start Trailing SL: $${initialSL.toFixed(2)} (-${slStartFactor}*G = -${slStartDist} pts).`,
              curPrice
            );

            if (onNotifyRef.current) {
              onNotifyRef.current(
                'success',
                `Auto Grid Slot #${currentSlotNum} Executed`,
                `Base $${dynamicBase.toFixed(2)} -> ${activeSide} ${cfg.lotSize} ${cfg.symbol} @ $${curPrice.toFixed(2)} | Start SL: $${initialSL.toFixed(2)}`
              );
            }
          }, 100);
        }
      }
    }

    // B. IN POSITION:
    // - Base price is LOCKED while position is running
    // - If position was externally closed (no live position running anymore), immediately re-sync Base & Grid to latest price
    else if (currentRuntime.status === 'IN_POSITION' && currentRuntime.entryPrice) {
      const symbolLivePositions = positionsRef.current.filter((p) => p.assetSymbol === cfg.symbol);
      if (symbolLivePositions.length === 0 && Date.now() - lastEntryTimestampRef.current > 1000) {
        const newBaseAfterManualClose = snapToBaseMultiple(curPrice, cfg.symbol, gVal);
        const nextEntryAfterManualClose = Number(
          (isLong
            ? newBaseAfterManualClose + entryOff
            : newBaseAfterManualClose - entryOff).toFixed(6)
        );
        setGridConfig((prev) => ({
          ...prev,
          basePriceAnchor: newBaseAfterManualClose,
        }));
        setRuntime((prev) => ({
          ...prev,
          status: cfg.autoLoop ? 'WAITING_FOR_ENTRY' : 'IDLE',
          basePrice: newBaseAfterManualClose,
          targetEntryPrice: nextEntryAfterManualClose,
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
          `No live position running for ${cfg.symbol}. Updated Base Price from latest price $${curPrice.toFixed(2)} -> $${newBaseAfterManualClose.toFixed(2)} and refreshed Pyramid/Averaging Grid.`
        );
        return;
      }
      const entry = currentRuntime.entryPrice;
      const pointsDiff = isLong ? curPrice - entry : entry - curPrice;

      let newHighest = currentRuntime.highestPriceReached;
      let newLowest = currentRuntime.lowestPriceReached;
      let peakPoints = 0;
      let shouldUpdatePeak = false;

      if (isLong) {
        const prevHighest = currentRuntime.highestPriceReached || entry;
        newHighest = Math.max(prevHighest, curPrice);
        peakPoints = newHighest - entry;
        shouldUpdatePeak = newHighest > prevHighest;
      } else {
        const prevLowest = currentRuntime.lowestPriceReached || entry;
        newLowest = Math.min(prevLowest, curPrice);
        peakPoints = entry - newLowest;
        shouldUpdatePeak = newLowest < prevLowest;
      }

      const extremePrice = isLong ? (newHighest || curPrice) : (newLowest || curPrice);
      let newTrailingSL =
        currentRuntime.currentTrailingSL ||
        (isLong ? entry - slStartDist : entry + slStartDist);
      let isChasingActive = currentRuntime.isChasingActivated || false;

      // Check Winning Condition: Price gain > winCondFactor * G (default 0.5 * G)
      const hasReachedWinCondition = peakPoints > winCondPts;

      if (hasReachedWinCondition) {
        // Tight Trailing SL = Peak - 0.1 * G (for BUY) or Trough + 0.1 * G (for SELL)
        const tightSLPrice = isLong
          ? Number((extremePrice - slAfterDist).toFixed(6))
          : Number((extremePrice + slAfterDist).toFixed(6));

        const isBetter = isLong
          ? tightSLPrice > newTrailingSL
          : tightSLPrice < newTrailingSL;

        const justActivated = !isChasingActive;
        isChasingActive = true;

        if (isBetter) {
          newTrailingSL = tightSLPrice;
          if (currentRuntime.activePositionId) {
            updatePositionSLTPRef.current(currentRuntime.activePositionId, tightSLPrice, undefined);
          }
          const lockedGainPts = isLong ? tightSLPrice - entry : entry - tightSLPrice;
          addLogRef.current(
            'SL_UPDATE',
            justActivated
              ? `Winning Condition (> +${winCondFactor}*G = +${winCondPts} pts) Reached! Price @ $${curPrice.toFixed(2)}. Trailing SL tightened from -${slStartFactor}*G to -${slAfterFactor}*G (-${slAfterDist} pts from peak) -> SL @ $${tightSLPrice.toFixed(2)} (Locked ${lockedGainPts >= 0 ? '+' : ''}${lockedGainPts.toFixed(2)} pts).`
              : `Tight Trailing SL (-${slAfterFactor}*G = -${slAfterDist} pts): Peak reached +${peakPoints.toFixed(2)} pts ($${extremePrice.toFixed(2)}). Ratcheted SL to $${tightSLPrice.toFixed(2)} (+${lockedGainPts.toFixed(2)} pts locked).`,
            tightSLPrice,
            undefined,
            lockedGainPts
          );
        }
      } else {
        // Before Winning Condition (<= 0.5 * G): Trailing SL at -0.5 * G from peak price in start
        const startTrailSL = isLong
          ? Number((extremePrice - slStartDist).toFixed(6))
          : Number((extremePrice + slStartDist).toFixed(6));

        const isBetter = isLong
          ? startTrailSL > newTrailingSL
          : startTrailSL < newTrailingSL;

        if (isBetter) {
          newTrailingSL = startTrailSL;
          if (currentRuntime.activePositionId) {
            updatePositionSLTPRef.current(currentRuntime.activePositionId, startTrailSL, undefined);
          }
        }
      }

      const lockedSlPrice = isLong
        ? entry + Math.max(0, winCondPts - slAfterDist)
        : entry - Math.max(0, winCondPts - slAfterDist);

      setRuntime((prev) => {
        const hasChanged =
          prev.highestPriceReached !== newHighest ||
          prev.lowestPriceReached !== newLowest ||
          prev.currentTrailingSL !== newTrailingSL ||
          prev.isChasingActivated !== isChasingActive ||
          prev.pointsGain !== pointsDiff;

        if (!hasChanged) return prev;

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

      if (shouldUpdatePeak && peakPoints >= winCondPts * 0.5 && Math.floor(peakPoints) % 10 === 0) {
        addLogRef.current(
          'CHASE_HIGH',
          `Peak Update: New ${isLong ? 'high' : 'low'} @ $${extremePrice.toFixed(2)} (+${peakPoints.toFixed(2)} pts) | Active Trailing SL: $${newTrailingSL.toFixed(2)} (${isChasingActive ? `-${slAfterFactor}*G tight` : `-${slStartFactor}*G start`}).`,
          extremePrice,
          undefined,
          peakPoints
        );
      }

      // Check Exit Trigger (Trailing SL Hit)
      const hitTrailingSL = isLong ? curPrice <= newTrailingSL : curPrice >= newTrailingSL;

      if (hitTrailingSL) {
        if (currentRuntime.activePositionId) {
          closePositionRef.current(currentRuntime.activePositionId, 100);
        } else {
          const openPos = positionsRef.current.find((p) => p.assetSymbol === cfg.symbol);
          if (openPos) {
            closePositionRef.current(openPos.id, 100);
          }
        }

        const exitPoints = isLong ? curPrice - entry : entry - curPrice;
        const entryTradeValue = entry * cfg.lotSize;
        const exitTradeValue = curPrice * cfg.lotSize;
        const estPnL = isLong
          ? exitTradeValue - entryTradeValue
          : entryTradeValue - exitTradeValue;

        addLogRef.current(
          'EXIT',
          `[CYCLE ${currentRuntime.currentCycle}] ${activeSide} Trailing SL (${isChasingActive ? `-${slAfterFactor}*G tight` : `-${slStartFactor}*G start`}) hit @ $${curPrice.toFixed(2)}! Entry $${entry.toFixed(2)} -> Exit $${curPrice.toFixed(2)} (${exitPoints >= 0 ? '+' : ''}${exitPoints.toFixed(2)} pts) | Return: ${estPnL >= 0 ? '+' : ''}$${estPnL.toFixed(4)} USDT.`,
          curPrice,
          estPnL,
          exitPoints
        );

        if (onNotifyRef.current) {
          onNotifyRef.current(
            estPnL >= 0 ? 'success' : 'warning',
            `Auto Grid Cycle Complete: ${cfg.symbol}`,
            `Closed ${activeSide} @ $${curPrice.toFixed(2)} | ${exitPoints >= 0 ? '+' : ''}${exitPoints.toFixed(2)} pts (${estPnL >= 0 ? '+' : ''}$${estPnL.toFixed(4)} USDT)`
          );
        }

        // Upon Trailing SL exit, no live position is running -> Update Base Price & Pyramid/Averaging Grid from latest price!
        // (For BTC: multiple of 100 -> e.g. 83010 -> 83000, 83610 -> 83600; else 0.1% of G)
        const newBaseFromLatest = snapToBaseMultiple(curPrice, cfg.symbol, gVal);
        const baseStepVal = getBasePriceStep(cfg.symbol, gVal);

        if (cfg.autoLoop && currentRuntime.currentCycle < cfg.maxGridCycles) {
          const nextCycle = currentRuntime.currentCycle + 1;
          const { side: nextSide } = resolveDirectionFromCandles(
            cfg.directionMode,
            cfg.timeframeFilter,
            currentRuntime.trend15m,
            currentRuntime.trend1h,
            cfg.side
          );

          const nextEntry = Number(
            (nextSide === 'BUY'
              ? newBaseFromLatest + entryOff
              : newBaseFromLatest - entryOff).toFixed(6)
          );

          setGridConfig((prev) => ({
            ...prev,
            basePriceAnchor: newBaseFromLatest,
          }));

          setRuntime((prev) => ({
            ...prev,
            status: 'WAITING_FOR_ENTRY',
            currentCycle: nextCycle,
            activeSide: nextSide,
            basePrice: newBaseFromLatest,
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
            `[BASE & GRID UPDATED] Position exited @ $${curPrice.toFixed(2)} (no live position running) -> New Base Price: $${newBaseFromLatest.toFixed(2)} (Multiple of ${baseStepVal}) -> Next Entry (${nextSide === 'BUY' ? '+' : '-'}${cfg.entryGapFactor ?? 0.01}*G): $${nextEntry.toFixed(2)}. Pyramid & Averaging grids re-anchored to $${newBaseFromLatest.toFixed(2)}.`,
            nextEntry
          );
        } else {
          const nextEntry = Number(
            (isLong
              ? newBaseFromLatest + entryOff
              : newBaseFromLatest - entryOff).toFixed(6)
          );
          setGridConfig((prev) => ({
            ...prev,
            enabled: false,
            basePriceAnchor: newBaseFromLatest,
          }));
          setRuntime((prev) => ({
            ...prev,
            status: 'COMPLETED',
            basePrice: newBaseFromLatest,
            targetEntryPrice: nextEntry,
            activePositionId: undefined,
            entryPrice: undefined,
            completedTradesCount: prev.completedTradesCount + 1,
            totalRealizedPoints: prev.totalRealizedPoints + exitPoints,
            totalRealizedPnL: prev.totalRealizedPnL + estPnL,
          }));

          addLogRef.current(
            'INFO',
            `Auto Grid sequence completed ${currentRuntime.currentCycle} cycles. Base updated to $${newBaseFromLatest.toFixed(2)} from latest price $${curPrice.toFixed(2)}. Total Realized: ${currentRuntime.totalRealizedPoints + exitPoints >= 0 ? '+' : ''}${(currentRuntime.totalRealizedPoints + exitPoints).toFixed(2)} points.`
          );
        }
      }
    }
  }, [asset.price, asset.symbol]);

  // Actions
  const startBot = useCallback(
    (basePrice?: number) => {
      const curRuntime = runtimeRef.current;
      const gStep = gridConfig.gridSpacing || 1000;
      const hasLivePos =
        curRuntime.status === 'IN_POSITION' ||
        positionsRef.current.some((p) => p.assetSymbol === asset.symbol);
      const rawBase = hasLivePos
        ? basePrice !== undefined
          ? basePrice
          : curRuntime.basePrice || gridConfig.basePriceAnchor || asset.price
        : asset.price;
      const base = snapToBaseMultiple(rawBase, asset.symbol, gStep);

      const { side: chosenSide } = resolveDirectionFromCandles(
        gridConfig.directionMode,
        gridConfig.timeframeFilter,
        curRuntime.trend15m,
        curRuntime.trend1h,
        gridConfig.side
      );

      const entryOff = gridConfig.entryOffset ?? Number((gStep * (gridConfig.entryGapFactor ?? 0.01)).toPrecision(6));
      const target = Number(
        (chosenSide === 'BUY' ? base + entryOff : base - entryOff).toFixed(6)
      );

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
        `Auto Grid started (${chosenSide} ONLY) for ${gridConfig.symbol}! Grid G=${gStep} pts. Base: $${base.toFixed(2)} -> Entry (${chosenSide === 'BUY' ? '+' : '-'}${gridConfig.entryGapFactor ?? 0.01}*G): $${target.toFixed(2)}. Start Trailing SL: -${gridConfig.slStartFactor ?? 0.2}*G (${Math.abs(gridConfig.initialSlOffset)} pts). When price > +${gridConfig.winConditionFactor ?? 0.2}*G (+${gridConfig.profitActivationThreshold} pts), SL tightens to -${gridConfig.slAfterFactor ?? 0.01}*G (${gridConfig.trailingDistance} pts).`,
        target
      );

      if (onNotifyRef.current) {
        onNotifyRef.current(
          'info',
          `Auto Grid Started (${chosenSide} Only · G=${gStep})`,
          `Entry @ $${target.toFixed(2)} (${chosenSide === 'BUY' ? '+' : '-'}${gridConfig.entryGapFactor ?? 0.01}*G) | Start SL: -${gridConfig.slStartFactor ?? 0.2}*G -> Tight SL: -${gridConfig.slAfterFactor ?? 0.01}*G when > +${gridConfig.winConditionFactor ?? 0.2}*G`
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
    const spec = calculateDigitGridSpec(
      asset.price,
      {
        gridScaleFactor: gridConfig.gridScaleFactor ?? 1.0,
        entryGapFactor: gridConfig.entryGapFactor ?? 0.01,
        slStartFactor: gridConfig.slStartFactor ?? 0.2,
        winConditionFactor: gridConfig.winConditionFactor ?? 0.2,
        slAfterFactor: gridConfig.slAfterFactor ?? 0.01,
      },
      asset.symbol
    );
    const snappedBase = snapToBaseMultiple(asset.price, asset.symbol, spec.effectiveG);
    const isLong = gridConfig.side !== 'SELL';

    setGridConfig((prev) => ({
      ...prev,
      enabled: false,
      gridSpacing: spec.effectiveG,
      entryOffset: spec.entryOffsetPts,
      initialSlOffset: -spec.slStartPts,
      profitActivationThreshold: spec.winConditionPts,
      trailingDistance: spec.slAfterPts,
      lockedProfitSlOffset: spec.lockedProfitAtWinPts,
      minExitProfitOffset: spec.lockedProfitAtWinPts,
      basePriceAnchor: snappedBase,
    }));

    setRuntime((prev) => ({
      ...prev,
      status: 'IDLE',
      currentCycle: 1,
      basePrice: snappedBase,
      targetEntryPrice: Number(
        (isLong ? snappedBase + spec.entryOffsetPts : snappedBase - spec.entryOffsetPts).toFixed(6)
      ),
      completedTradesCount: 0,
      totalRealizedPoints: 0,
      totalRealizedPnL: 0,
      logs: [
        {
          id: 'reset',
          timestamp: Date.now(),
          type: 'INFO',
          message: `Auto Grid reset. ${spec.intDigits}-digit int -> ${spec.baseGDigits}-digit Base G=${spec.baseG}, Effective G=${spec.effectiveG}.`,
        },
      ],
    }));
  }, [asset.price, gridConfig]);

  const updateConfig = useCallback((partial: Partial<AutoGridConfig>) => {
    setGridConfig((prev) => {
      const merged = { ...prev, ...partial };

      // Recompute G and point offsets whenever any factor changes (unless raw point override was explicitly passed without factor change)
      const hasFactorUpdate =
        partial.gridScaleFactor !== undefined ||
        partial.entryGapFactor !== undefined ||
        partial.slStartFactor !== undefined ||
        partial.winConditionFactor !== undefined ||
        partial.slAfterFactor !== undefined;

      if (hasFactorUpdate) {
        const spec = calculateDigitGridSpec(
          currentPriceRef.current || 85435,
          {
            gridScaleFactor: merged.gridScaleFactor ?? 1.0,
            entryGapFactor: merged.entryGapFactor ?? 0.01,
            slStartFactor: merged.slStartFactor ?? 0.2,
            winConditionFactor: merged.winConditionFactor ?? 0.2,
            slAfterFactor: merged.slAfterFactor ?? 0.01,
          },
          merged.symbol
        );
        merged.gridSpacing = spec.effectiveG;
        merged.entryOffset = spec.entryOffsetPts;
        merged.initialSlOffset = -spec.slStartPts;
        merged.profitActivationThreshold = spec.winConditionPts;
        merged.trailingDistance = spec.slAfterPts;
        merged.lockedProfitSlOffset = spec.lockedProfitAtWinPts;
        merged.minExitProfitOffset = spec.lockedProfitAtWinPts;
        merged.pullbackTrigger = Number((spec.slAfterPts * 0.5).toPrecision(6));
      } else if (partial.gridSpacing !== undefined && partial.gridSpacing > 0) {
        const g = partial.gridSpacing;
        const entryFactor = merged.entryGapFactor ?? 0.01;
        const slStartF = merged.slStartFactor ?? 0.2;
        const winF = merged.winConditionFactor ?? 0.2;
        const slAfterF = merged.slAfterFactor ?? 0.01;
        merged.entryOffset = Number((g * entryFactor).toPrecision(6));
        merged.initialSlOffset = -Number((g * slStartF).toPrecision(6));
        merged.profitActivationThreshold = Number((g * winF).toPrecision(6));
        merged.trailingDistance = Number((g * slAfterF).toPrecision(6));
        merged.lockedProfitSlOffset = Number((Math.max(0, (winF - slAfterF) * g)).toPrecision(6));
        merged.minExitProfitOffset = merged.lockedProfitSlOffset;
      }

      // Sync runtime target if not in position
      setRuntime((prevRuntime) => {
        if (prevRuntime.status === 'IN_POSITION') return prevRuntime;
        const nextSide: 'BUY' | 'SELL' =
          merged.side === 'SELL' || merged.directionMode === 'SELL_ONLY' ? 'SELL' : 'BUY';
        const base =
          partial.basePriceAnchor !== undefined
            ? snapToBaseMultiple(partial.basePriceAnchor, merged.symbol, merged.gridSpacing)
            : snapToBaseMultiple(
                currentPriceRef.current || prevRuntime.basePrice || merged.basePriceAnchor || 85435,
                merged.symbol,
                merged.gridSpacing
              );
        const offset = merged.entryOffset ?? 10;
        const nextTarget = Number(
          (nextSide === 'BUY' ? base + offset : base - offset).toFixed(6)
        );
        return {
          ...prevRuntime,
          activeSide: nextSide,
          basePrice: base,
          targetEntryPrice: nextTarget,
        };
      });

      return merged;
    });
  }, []);

  const applyGoldPreset = useCallback(() => {
    // Auto Digit-Scaled Spec for current coin: N-digit int -> (N-1)-digit G
    // entry = 0.01*G, sl = 0.2*G, win = 0.2*G, sl after win = 0.01*G
    const spec = calculateDigitGridSpec(
      asset.price || 2750,
      {
        gridScaleFactor: 1.0,
        entryGapFactor: 0.01,
        slStartFactor: 0.2,
        winConditionFactor: 0.2,
        slAfterFactor: 0.01,
      },
      asset.symbol
    );
    const base = snapToBaseMultiple(asset.price || 2750, asset.symbol, spec.effectiveG);

    setGridConfig((prev) => ({
      ...prev,
      gridScaleFactor: 1.0,
      entryGapFactor: 0.01,
      slStartFactor: 0.2,
      winConditionFactor: 0.2,
      slAfterFactor: 0.01,
      upsideMultiplier: 0.5,
      downsideMultiplier: 1.0,
      gridSpacing: spec.effectiveG,
      entryOffset: spec.entryOffsetPts,
      initialSlOffset: -spec.slStartPts,
      profitActivationThreshold: spec.winConditionPts,
      lockedProfitSlOffset: spec.lockedProfitAtWinPts,
      trailingDistance: spec.slAfterPts,
      pullbackTrigger: Number((spec.slAfterPts * 0.5).toPrecision(6)),
      minExitProfitOffset: spec.lockedProfitAtWinPts,
      directionMode: prev.side === 'SELL' ? 'SELL_ONLY' : 'BUY_ONLY',
      lotSize: 0.1,
      leverage: 75,
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: base,
    }));
    addLog(
      'INFO',
      `Applied Digit-Scaled Spec (${asset.symbol}): ${spec.intDigits}-digit int -> ${spec.baseGDigits}-digit G=${spec.effectiveG}, Entry +0.01*G (${spec.entryOffsetPts} pts), SL Start -0.2*G (-${spec.slStartPts} pts), Win >0.2*G (+${spec.winConditionPts} pts) -> Tight SL -0.01*G (-${spec.slAfterPts} pts).`
    );
  }, [asset.price, asset.symbol, addLog]);

  const applyBtcPreset = useCallback(() => {
    // BTC @ 85,435 (5-digit int) -> 4-digit G = 1,000, Base multiple = 100
    // Entry = +0.01*G (+10 pts), SL Start = -0.2*G (-200 pts), Win >0.2*G (+200 pts) -> SL After Win = -0.01*G (-10 pts)
    const spec = calculateDigitGridSpec(
      asset.price || 85435,
      {
        gridScaleFactor: 1.0,
        entryGapFactor: 0.01,
        slStartFactor: 0.2,
        winConditionFactor: 0.2,
        slAfterFactor: 0.01,
      },
      asset.symbol
    );
    const base = snapToBaseMultiple(asset.price || 85435, asset.symbol, spec.effectiveG);

    setGridConfig((prev) => ({
      ...prev,
      gridScaleFactor: 1.0,
      entryGapFactor: 0.01,
      slStartFactor: 0.2,
      winConditionFactor: 0.2,
      slAfterFactor: 0.01,
      upsideMultiplier: 0.5,
      downsideMultiplier: 1.0,
      gridSpacing: spec.effectiveG, // 1000
      entryOffset: spec.entryOffsetPts, // 10
      initialSlOffset: -spec.slStartPts, // -200
      profitActivationThreshold: spec.winConditionPts, // 200
      lockedProfitSlOffset: spec.lockedProfitAtWinPts, // 190
      trailingDistance: spec.slAfterPts, // 10
      pullbackTrigger: Number((spec.slAfterPts * 0.5).toPrecision(6)),
      minExitProfitOffset: spec.lockedProfitAtWinPts,
      directionMode: prev.side === 'SELL' ? 'SELL_ONLY' : 'BUY_ONLY',
      lotSize: 0.002,
      leverage: 150,
      autoLoop: true,
      maxGridCycles: 10,
      basePriceAnchor: base,
    }));
    addLog(
      'INFO',
      `Applied BTC 5-Digit -> 4-Digit G Spec: G=${spec.effectiveG} pts, Entry +0.01*G (+${spec.entryOffsetPts} pts), SL Start -0.2*G (-${spec.slStartPts} pts), Win >0.2*G (+${spec.winConditionPts} pts) -> SL After Win -0.01*G (-${spec.slAfterPts} pts).`
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
    const hasLivePos =
      runtime.status === 'IN_POSITION' ||
      positions.some((p) => p.assetSymbol === asset.symbol);
    // Base update only applicable if no live position is running
    const effectiveBase = hasLivePos
      ? runtime.basePrice || gridConfig.basePriceAnchor || snapToBaseMultiple(asset.price, asset.symbol, gridConfig.gridSpacing)
      : snapToBaseMultiple(asset.price, asset.symbol, gridConfig.gridSpacing);

    return calculateGridLadderLevels({
      symbol: asset.symbol,
      basePrice: effectiveBase,
      gridSpacing: gridConfig.gridSpacing,
      entryOffset: gridConfig.entryOffset,
      isLong,
      spacingMode: gridConfig.spacingMode || 'EQUAL',
      upsideMultiplier: gridConfig.upsideMultiplier !== undefined ? gridConfig.upsideMultiplier : 0.5,
      downsideMultiplier: gridConfig.downsideMultiplier !== undefined ? gridConfig.downsideMultiplier : 1.0,
      stepMultiplier: gridConfig.stepMultiplier || 2,
      downsideGapMultiplier: gridConfig.downsideGapMultiplier || 2,
      currentPrice: asset.price,
      currentActiveLevel: 1,
    });
  }, [
    runtime.status,
    runtime.basePrice,
    runtime.activeSide,
    runtime.currentCycle,
    positions,
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
    asset.symbol,
  ]);

  const downsideLadder = useMemo(() => {
    const isLong = (runtime.activeSide || gridConfig.side) === 'BUY';
    const hasLivePos =
      runtime.status === 'IN_POSITION' ||
      positions.some((p) => p.assetSymbol === asset.symbol);
    // Base update only applicable if no live position is running
    const effectiveBase = hasLivePos
      ? runtime.basePrice || gridConfig.basePriceAnchor || snapToBaseMultiple(asset.price, asset.symbol, gridConfig.gridSpacing)
      : snapToBaseMultiple(asset.price, asset.symbol, gridConfig.gridSpacing);

    return calculateDownsideLadderLevels({
      symbol: asset.symbol,
      basePrice: effectiveBase,
      gridSpacing: gridConfig.gridSpacing,
      entryOffset: gridConfig.entryOffset,
      isLong,
      spacingMode: gridConfig.spacingMode || 'EQUAL',
      upsideMultiplier: gridConfig.upsideMultiplier !== undefined ? gridConfig.upsideMultiplier : 0.5,
      downsideMultiplier: gridConfig.downsideMultiplier !== undefined ? gridConfig.downsideMultiplier : 1.0,
      stepMultiplier: gridConfig.stepMultiplier || 2,
      downsideGapMultiplier: gridConfig.downsideGapMultiplier || 2,
      currentPrice: asset.price,
      currentActiveLevel: 1,
    });
  }, [
    runtime.status,
    runtime.basePrice,
    runtime.activeSide,
    runtime.currentCycle,
    positions,
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
    asset.symbol,
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
