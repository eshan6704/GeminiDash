import { GridLadderLevel } from '../types/trading';

export interface DigitGridSpec {
  spotPrice: number;
  intDigits: number; // e.g. 85435 -> 5 integer digits
  refDigits: number; // e.g. 85435 -> 6 digits reference (100000)
  refValue: number; // e.g. 100000
  baseGDigits: number; // e.g. 5-digit int -> 4-digit G (1000)
  baseG: number; // e.g. 1000 (10^(intDigits - 2))
  gridScaleFactor: number; // default 1.0
  effectiveG: number; // baseG * gridScaleFactor (e.g. 1000)
  basePriceStep: number; // 100 for BTC, 0.1% of G (0.001 * G) for other coins
  snappedBasePrice: number; // e.g. 83010 -> 83000, 83610 -> 83600
  entryGapFactor: number; // default 0.01 (+0.01 * G)
  entryOffsetPts: number; // entryGapFactor * effectiveG (e.g. 10 pts)
  slStartFactor: number; // default 0.2 (-0.2 * G trailing from price in start)
  slStartPts: number; // slStartFactor * effectiveG (e.g. 200 pts)
  winConditionFactor: number; // default 0.2 (> +0.2 * G winning condition)
  winConditionPts: number; // winConditionFactor * effectiveG (e.g. 200 pts)
  slAfterFactor: number; // default 0.01 (-0.01 * G trailing from peak when > 0.2 * G)
  slAfterPts: number; // slAfterFactor * effectiveG (e.g. 10 pts)
  lockedProfitAtWinPts: number; // (winConditionFactor - slAfterFactor) * G (e.g. +190 pts)
}

/**
 * Returns the Base Price step multiple:
 * - For BTC: multiple of 100 (e.g. 83010 -> 83000, 83610 -> 83600)
 * - Else: 0.1% of G (0.001 * G)
 */
export function getBasePriceStep(symbol: string = 'BTC', effectiveG: number = 1000): number {
  const cleanSym = (symbol || 'BTC').toUpperCase();
  if (cleanSym === 'BTC' || cleanSym.startsWith('BTC')) {
    return 100;
  }
  const step = effectiveG * 0.001; // 0.1% of G
  return step > 0 ? Number(step.toPrecision(6)) : 1;
}

/**
 * Snaps any price down to the active Base Price multiple:
 * - For BTC (multiple of 100): 83010 -> 83000, 83610 -> 83600, 85435 -> 85400
 * - For other coins: multiple of 0.1% of G (0.001 * G)
 */
export function snapToBaseMultiple(
  price: number,
  symbol: string = 'BTC',
  effectiveG: number = 1000
): number {
  const step = getBasePriceStep(symbol, effectiveG);
  if (!step || step <= 0) return Number(price.toFixed(6));
  const snapped = Math.floor((price + 1e-9) / step) * step;
  return Number(snapped.toFixed(6));
}

/**
 * Calculates the Digit-Based Grid Reference & Factor-Scaled Parameters:
 * Example: BTC trading at 85,435 (5-digit integer):
 * - 5-digit integer -> uses 4-digit G: Base G = 1,000
 * - Effective G = baseG * gridScaleFactor (default 1.0 -> 1,000)
 * - Base Price Step = 100 for BTC (83010 -> 83000, 83610 -> 83600), else 0.1% of G
 * - Entry Offset = +0.01 * G (default -> +10 pts)
 * - Trailing SL in Start = -0.2 * G from price (default -> -200 pts)
 * - Winning Condition = price gain > +0.2 * G (default -> +200 pts)
 * - Trailing SL After Win = -0.01 * G from peak price (default -> -10 pts)
 */
export function calculateDigitGridSpec(
  price: number,
  factors?: {
    gridScaleFactor?: number;
    entryGapFactor?: number;
    slStartFactor?: number;
    winConditionFactor?: number;
    slAfterFactor?: number;
  },
  symbol: string = 'BTC'
): DigitGridSpec {
  const safePrice = Math.max(0.0001, price || 85435);
  const log10 = Math.floor(Math.log10(safePrice));
  const intDigits = safePrice >= 1 ? log10 + 1 : 0; // 85435 -> log10=4, intDigits=5
  const refDigits = safePrice >= 1 ? intDigits + 1 : 1;
  const refValue = Math.pow(10, log10 + 1); // 100,000
  const baseGDigits = Math.max(1, intDigits - 1); // 5-digit int -> 4-digit G
  const baseG = Number(Math.pow(10, log10 - 1).toPrecision(6)); // 85435 (log10=4) -> 10^3 = 1000

  const gridScaleFactor = Math.max(0.01, factors?.gridScaleFactor ?? 1.0);
  const effectiveG = Number((baseG * gridScaleFactor).toPrecision(6));

  const basePriceStep = getBasePriceStep(symbol, effectiveG);
  const snappedBasePrice = snapToBaseMultiple(safePrice, symbol, effectiveG);

  const entryGapFactor = Math.max(0, factors?.entryGapFactor ?? 0.01);
  const entryOffsetPts = Number((effectiveG * entryGapFactor).toPrecision(6));

  const slStartFactor = Math.max(0.001, factors?.slStartFactor ?? 0.2);
  const slStartPts = Number((effectiveG * slStartFactor).toPrecision(6));

  const winConditionFactor = Math.max(0.001, factors?.winConditionFactor ?? 0.2);
  const winConditionPts = Number((effectiveG * winConditionFactor).toPrecision(6));

  const slAfterFactor = Math.max(0.001, factors?.slAfterFactor ?? 0.01);
  const slAfterPts = Number((effectiveG * slAfterFactor).toPrecision(6));

  const lockedProfitAtWinPts = Number(
    Math.max(0, winConditionPts - slAfterPts).toPrecision(6)
  );

  return {
    spotPrice: safePrice,
    intDigits,
    refDigits,
    refValue,
    baseGDigits,
    baseG,
    gridScaleFactor,
    effectiveG,
    basePriceStep,
    snappedBasePrice,
    entryGapFactor,
    entryOffsetPts,
    slStartFactor,
    slStartPts,
    winConditionFactor,
    winConditionPts,
    slAfterFactor,
    slAfterPts,
    lockedProfitAtWinPts,
  };
}

/**
 * Snaps any price to the base multiple (100 for BTC, 0.1% of G for other symbols).
 */
export function snapToGridMultiple(price: number, step: number, symbol: string = 'BTC'): number {
  return snapToBaseMultiple(price, symbol, step);
}

export interface GridLadderCalculationParams {
  symbol?: string;
  basePrice: number;
  gridSpacing: number;
  entryOffset?: number;
  isLong: boolean;
  upsideMultiplier?: number; // Pyramiding multiplier (default: 0.5 -> gap = G * 0.5)
  downsideMultiplier?: number; // Averaging multiplier (default: 1.0 -> gap = G * 1.0)
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
 * - Default Pyramid Step = 0.5 * G (e.g. +500 pts for G=1000)
 * - Base Anchor = snapped to 100 for BTC (e.g. 83010 -> 83000, 83610 -> 83600) or 0.1% of G for others
 * - Entry on each level = Milestone + entryOffset (+0.01 * G for BUY, -0.01 * G for SELL)
 */
export function calculateGridLadderLevels(params: GridLadderCalculationParams): GridLadderLevel[] {
  const {
    symbol = 'BTC',
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
  const gapSize = Math.max(0.0001, Number((gridSpacing * pyramidMultiplier).toPrecision(6)));
  // Snap base anchor using BTC 100-multiple or 0.1% of G (e.g. 83010 -> 83000, 83610 -> 83600)
  const baseAnchor = snapToBaseMultiple(rawBasePrice, symbol, gridSpacing);
  const baseStep = getBasePriceStep(symbol, gridSpacing);

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
      multiplierLabel = `Base Entry (Mult of ${baseStep})`;
    } else {
      gapFromPrev = gapSize;
      offsetPoints = Number(((lvl - 1) * gapSize).toPrecision(6));
      multiplierVal = Number(((lvl - 1) * pyramidMultiplier).toPrecision(6));
      multiplierLabel = `${isLong ? '+' : '-'}${gapSize} pts (${pyramidMultiplier.toFixed(2)}x G)`;
    }

    const milestoneTriggerPrice = Number(
      (isLong ? baseAnchor + offsetPoints : baseAnchor - offsetPoints).toFixed(6)
    );

    const targetEntryPrice = Number(
      (isLong
        ? milestoneTriggerPrice + entryOffset
        : milestoneTriggerPrice - entryOffset).toFixed(6)
    );

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
 * - Default Averaging Step = 1.0 * G (e.g. -1000 pts for G=1000)
 * - Base Anchor = snapped to 100 for BTC (e.g. 83010 -> 83000, 83610 -> 83600) or 0.1% of G for others
 */
export function calculateDownsideLadderLevels(params: GridLadderCalculationParams): GridLadderLevel[] {
  const {
    symbol = 'BTC',
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

  const averagingMultiplier =
    rawAvgMult ??
    rawDownMult ??
    (downsideGapMultiplier !== undefined
      ? downsideGapMultiplier <= 2
        ? downsideGapMultiplier * 0.5
        : downsideGapMultiplier
      : 1.0);

  const gapSize = Math.max(0.0001, Number((gridSpacing * averagingMultiplier).toPrecision(6)));
  const baseAnchor = snapToBaseMultiple(rawBasePrice, symbol, gridSpacing);
  const baseStep = getBasePriceStep(symbol, gridSpacing);

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
      multiplierLabel = `Base Entry (Mult of ${baseStep})`;
    } else {
      gapFromPrev = gapSize;
      offsetPoints = Number(((lvl - 1) * gapSize).toPrecision(6));
      multiplierVal = Number(((lvl - 1) * averagingMultiplier).toPrecision(6));
      multiplierLabel = `${isLong ? '-' : '+'}${gapSize} pts (${averagingMultiplier.toFixed(2)}x G)`;
    }

    const milestoneTriggerPrice = Number(
      (isLong ? baseAnchor - offsetPoints : baseAnchor + offsetPoints).toFixed(6)
    );

    const targetEntryPrice = Number(
      (isLong
        ? milestoneTriggerPrice + entryOffset
        : milestoneTriggerPrice - entryOffset).toFixed(6)
    );

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
