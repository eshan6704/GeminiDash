import { GridLadderLevel } from '../types/trading';

/**
 * Snaps any price to the nearest exact multiple of the grid step (e.g. multiple of 50 or multiple of 25).
 * Strictly rejects arbitrary fractional prices like 23.4.
 */
export function snapToGridMultiple(price: number, step: number): number {
  if (!step || step <= 0) return Math.round(price);
  const snapped = Math.round(price / step) * step;
  // If step is an integer (e.g. 50, 25, 10), return as clean integer or clean decimal
  return Number(snapped.toFixed(4));
}

/**
 * Grid Progression Calculator for Pyramiding vs Averaging (DCA):
 *
 * Rules:
 * - Base Grid Spacing: G (e.g. 50 pts)
 * - Base Anchor: Snapped to exact multiple of G (e.g. 4500, 4550, 4600)
 * - Pyramiding Multiplier (Trend Momentum): default 0.5x
 *     -> Subsequent pyramid gap = G * pyramidMultiplier (e.g. 50 * 0.5 = 25 pts)
 *     -> All pyramid trigger prices are exact multiples of 25 (4500, 4525, 4550, 4575...)
 * - Averaging Multiplier (Pullback DCA): default 1.0x
 *     -> Subsequent averaging gap = G * averagingMultiplier (e.g. 50 * 1.0 = 50 pts)
 *     -> All averaging trigger prices are exact multiples of 50 (4500, 4450, 4400, 4350...)
 *
 * Rejects irregular decimals (like 23.4); all levels strictly adhere to multiples of G or G * multiplier.
 */

export interface GridLadderCalculationParams {
  basePrice: number;
  gridSpacing: number;
  entryOffset?: number;
  isLong: boolean;
  upsideMultiplier?: number; // Pyramiding multiplier (default: 0.5 -> gap = G * 0.5 = 25 pts)
  downsideMultiplier?: number; // Averaging multiplier (default: 1.0 -> gap = G * 1.0 = 50 pts)
  pyramidMultiplier?: number;
  averagingMultiplier?: number;
  spacingMode?: string; // legacy compatibility
  stepMultiplier?: number; // legacy compatibility
  downsideGapMultiplier?: number; // legacy compatibility
  currentPrice: number;
  currentActiveLevel?: number;
  ladderType?: 'UPSIDE_ONLY' | 'DOWNSIDE_ONLY' | 'ALL_UPSIDE';
}

/**
 * Calculates the Pyramiding Ladder (Adding in profit along trend direction)
 * - BUY (Long): 4500 -> 4525 -> 4550 -> 4575 (+25 pts each)
 * - SELL (Short): 4500 -> 4475 -> 4450 -> 4425 (-25 pts each)
 */
export function calculateGridLadderLevels(params: GridLadderCalculationParams): GridLadderLevel[] {
  const {
    basePrice: rawBasePrice,
    gridSpacing,
    entryOffset = 0,
    isLong,
    upsideMultiplier: rawUpMult,
    pyramidMultiplier: rawPyrMult,
    currentPrice,
    currentActiveLevel = 1,
  } = params;

  const pyramidMultiplier = rawPyrMult ?? rawUpMult ?? 0.5;
  const gapSize = Math.max(1, snapToGridMultiple(gridSpacing * pyramidMultiplier, 0.5)); // e.g. 50 * 0.5 = 25 pts
  // Snap base anchor to nearest multiple of gridSpacing or gapSize
  const baseAnchor = snapToGridMultiple(rawBasePrice, gapSize);

  const levels: GridLadderLevel[] = [];
  const maxLevels = 10;

  for (let lvl = 1; lvl <= maxLevels; lvl++) {
    let offsetPoints = 0;
    let gapFromPrev = 0;
    let multiplierVal = 0;
    let multiplierLabel = '';

    if (lvl === 1) {
      offsetPoints = 0;
      gapFromPrev = 0;
      multiplierVal = 0;
      multiplierLabel = 'Base Entry (Multiple of G)';
    } else {
      gapFromPrev = gapSize;
      offsetPoints = (lvl - 1) * gapSize;
      multiplierVal = (lvl - 1) * pyramidMultiplier;
      multiplierLabel = `${isLong ? '+' : '-'}${gapSize} pts (${(pyramidMultiplier).toFixed(2)}x G gap)`;
    }

    // Milestone Price: exact multiple of gapSize (e.g. 4500, 4525, 4550...)
    const milestoneTriggerPrice = snapToGridMultiple(
      isLong ? baseAnchor + offsetPoints : baseAnchor - offsetPoints,
      gapSize
    );

    // Target Entry: Snap to grid multiple (if entryOffset is 0, exactly equals milestone)
    const rawTarget = isLong ? milestoneTriggerPrice + entryOffset : milestoneTriggerPrice - entryOffset;
    const targetEntryPrice = entryOffset === 0
      ? milestoneTriggerPrice
      : snapToGridMultiple(rawTarget, 0.5);

    const isPassed = isLong
      ? currentPrice >= targetEntryPrice
      : currentPrice <= targetEntryPrice;

    const isActive = lvl === currentActiveLevel;

    levels.push({
      level: lvl,
      direction: lvl === 1 ? 'BASE' : isLong ? 'UP' : 'DOWN',
      multiplier: multiplierVal,
      multiplierLabel,
      milestoneTriggerPrice,
      targetEntryPrice,
      offsetFromBase: offsetPoints,
      gapFromPrev,
      isPassed,
      isActive,
      type: lvl === 1 ? 'BASE' : 'TREND_PYRAMID',
    });
  }

  return levels;
}

/**
 * Calculates the Averaging / DCA Ladder (Adding on pullback / adverse movement)
 * - BUY (Long): 4500 -> 4450 -> 4400 -> 4350 (-50 pts each)
 * - SELL (Short): 4500 -> 4550 -> 4600 -> 4650 (+50 pts each)
 */
export function calculateDownsideLadderLevels(params: GridLadderCalculationParams): GridLadderLevel[] {
  const {
    basePrice: rawBasePrice,
    gridSpacing,
    entryOffset = 0,
    isLong,
    downsideMultiplier: rawDownMult,
    averagingMultiplier: rawAvgMult,
    downsideGapMultiplier,
    currentPrice,
    currentActiveLevel = 1,
  } = params;

  const averagingMultiplier = rawAvgMult ?? rawDownMult ?? (
    downsideGapMultiplier !== undefined ? (downsideGapMultiplier <= 2 ? downsideGapMultiplier * 0.5 : downsideGapMultiplier) : 1.0
  );

  const gapSize = Math.max(1, snapToGridMultiple(gridSpacing * averagingMultiplier, 1)); // e.g. 50 * 1.0 = 50 pts
  // Snap base anchor to nearest multiple of gridSpacing
  const baseAnchor = snapToGridMultiple(rawBasePrice, gridSpacing);

  const levels: GridLadderLevel[] = [];
  const maxLevels = 10;

  for (let lvl = 1; lvl <= maxLevels; lvl++) {
    let offsetPoints = 0;
    let gapFromPrev = 0;
    let multiplierVal = 0;
    let multiplierLabel = '';

    if (lvl === 1) {
      offsetPoints = 0;
      gapFromPrev = 0;
      multiplierVal = 0;
      multiplierLabel = 'Base Entry (Multiple of G)';
    } else {
      gapFromPrev = gapSize;
      offsetPoints = (lvl - 1) * gapSize;
      multiplierVal = (lvl - 1) * averagingMultiplier;
      multiplierLabel = `${isLong ? '-' : '+'}${gapSize} pts (${(averagingMultiplier).toFixed(2)}x G DCA gap)`;
    }

    // Milestone Price: exact multiple of gapSize (e.g. 4500, 4450, 4400...)
    const milestoneTriggerPrice = snapToGridMultiple(
      isLong ? baseAnchor - offsetPoints : baseAnchor + offsetPoints,
      gapSize
    );

    // Target Entry: Snap to clean grid multiple
    const rawTarget = isLong
      ? (lvl === 1 ? milestoneTriggerPrice + entryOffset : milestoneTriggerPrice - entryOffset)
      : (lvl === 1 ? milestoneTriggerPrice - entryOffset : milestoneTriggerPrice + entryOffset);
    const targetEntryPrice = entryOffset === 0
      ? milestoneTriggerPrice
      : snapToGridMultiple(rawTarget, 0.5);

    const isPassed = isLong
      ? currentPrice <= targetEntryPrice
      : currentPrice >= targetEntryPrice;

    const isActive = lvl === currentActiveLevel;

    levels.push({
      level: lvl,
      direction: lvl === 1 ? 'BASE' : isLong ? 'DOWN' : 'UP',
      multiplier: multiplierVal,
      multiplierLabel,
      milestoneTriggerPrice,
      targetEntryPrice,
      offsetFromBase: offsetPoints,
      gapFromPrev,
      isPassed,
      isActive,
      type: lvl === 1 ? 'BASE' : 'DCA_PULLBACK',
    });
  }

  return levels;
}
