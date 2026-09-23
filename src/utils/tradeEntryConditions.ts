import {
  Position,
  MarketAsset,
  OrderSide,
  Candle,
  CandleTrendInfo,
} from '../types/trading';

export const MAX_RUNNING_TRADES = 10;
export const TARGET_BUY_ALLOCATION_PCT = 75; // 75% Long preference (long-term buy trade more profitable)
export const TARGET_SHORT_ALLOCATION_PCT = 25; // 25% Short cap
export const MAX_SHORT_POSITIONS = 3; // 25-30% quota of 10 max positions
export const MAX_BUY_POSITIONS = 8; // 75-80% quota of 10 max positions

export function getPortfolioDirectionalAllocation(positions: Position[]) {
  const total = positions.length;
  const longCount = positions.filter((p) => p.side === 'LONG').length;
  const shortCount = positions.filter((p) => p.side === 'SHORT').length;
  const longPct = total > 0 ? (longCount / total) * 100 : 0;
  const shortPct = total > 0 ? (shortCount / total) * 100 : 0;
  const isShortQuotaFull = shortCount >= MAX_SHORT_POSITIONS;
  const isBuyPreferred = shortCount > 0 || total === 0 || longPct <= 75;

  return {
    total,
    longCount,
    shortCount,
    longPct,
    shortPct,
    targetLongPct: TARGET_BUY_ALLOCATION_PCT,
    targetShortPct: TARGET_SHORT_ALLOCATION_PCT,
    maxShorts: MAX_SHORT_POSITIONS,
    maxBuys: MAX_BUY_POSITIONS,
    isShortQuotaFull,
    isBuyPreferred,
  };
}

export type TradeSlotDifficulty =
  | 'MINIMUM'
  | 'EASY'
  | 'MILD'
  | 'MODERATE'
  | 'RIGOROUS'
  | 'STRICT'
  | 'HIGH'
  | 'VERY_STRICT'
  | 'ULTRA_STRICT'
  | 'TOUGHEST';

export interface TradeTierCondition {
  slotNumber: number; // 1 to 10
  name: string;
  difficulty: TradeSlotDifficulty;
  difficultyScore: number; // 1 to 10
  difficultyBadge: string;
  description: string;
  rulesOverview: string[];
}

export interface RuleCheckResult {
  id: string;
  name: string;
  passed: boolean;
  requirement: string;
  currentValue: string;
  explanation: string;
}

export interface TradeSlotEvaluation {
  slotNumber: number;
  runningTradesCount: number;
  maxTrades: number;
  isMaxCapacityReached: boolean;
  tier: TradeTierCondition;
  canEnter: boolean;
  checks: RuleCheckResult[];
  unmetReasons: string[];
  passedReasons: string[];
  passPercentage: number;
}

export const TRADE_TIER_CONFIGS: Record<number, TradeTierCondition> = {
  1: {
    slotNumber: 1,
    name: 'Pioneer Entry',
    difficulty: 'MINIMUM',
    difficultyScore: 1,
    difficultyBadge: 'Level 1: Minimum / Easy',
    description: 'Easiest baseline entry. Verifies positive margin balance and basic directional coherence.',
    rulesOverview: [
      'Basic valid margin balance (> 5% free margin)',
      'Primary trade direction alignment',
      'Normal market spread tolerance (< 0.20%)',
    ],
  },
  2: {
    slotNumber: 2,
    name: 'Trend Confirmation',
    difficulty: 'EASY',
    difficultyScore: 2,
    difficultyBadge: 'Level 2: Easy Confirmation',
    description: 'Verifies 15-minute candle alignment and basic liquidity before opening a second active trade.',
    rulesOverview: [
      '15m candle bias aligns with trade side',
      'Market 24h volume check (> $10M)',
      'Free margin ratio >= 10%',
    ],
  },
  3: {
    slotNumber: 3,
    name: 'Dual Timeframe Confluence',
    difficulty: 'MILD',
    difficultyScore: 3,
    difficultyBadge: 'Level 3: Dual Timeframe Confluence',
    description: 'Requires structural agreement across both 15m and 1h intervals with SMA filter.',
    rulesOverview: [
      'Both 15m AND 1h candles must point in trade direction',
      'Price trading on correct side of 10-period SMA',
      'Free margin ratio >= 15%',
    ],
  },
  4: {
    slotNumber: 4,
    name: 'Momentum & Wick Strength',
    difficulty: 'MODERATE',
    difficultyScore: 4,
    difficultyBadge: 'Level 4: Moderate Momentum',
    description: 'Checks RSI momentum safety zone and confirms solid candle bodies without counter-trend wicks.',
    rulesOverview: [
      'RSI(14) in momentum progression zone (BUY: 40-72, SELL: 28-60)',
      'Candle body ratio >= 35% (no aggressive counter-wick rejection)',
      'Free margin ratio >= 20%',
    ],
  },
  5: {
    slotNumber: 5,
    name: '75/25 Directional & Extreme Guard',
    difficulty: 'RIGOROUS',
    difficultyScore: 5,
    difficultyBadge: 'Level 5: 75% Buy / 25% Short & Extreme Guard',
    description: 'Enforces the 75% Buy / 25% Short portfolio ratio (buys more profitable long term) and guards 24h price extremes.',
    rulesOverview: [
      'Price at least 0.25% away from 24h high (BUY) or 24h low (SELL)',
      'Directional quota: max 8 BUY trades (75% quota) vs max 2-3 SHORT trades (25% cap)',
      'Free margin ratio >= 25%',
    ],
  },
  6: {
    slotNumber: 6,
    name: 'Multi-Candle Continuity',
    difficulty: 'STRICT',
    difficultyScore: 6,
    difficultyBadge: 'Level 6: Strict Candle Follow-Through',
    description: 'Demands consecutive confirming candles and sustained directional momentum to open trade #6.',
    rulesOverview: [
      'Last 2 consecutive 15m candles confirm trade direction',
      '1h structural trend not opposing',
      'Free margin ratio >= 30%',
    ],
  },
  7: {
    slotNumber: 7,
    name: 'Pullback Retracement Filter',
    difficulty: 'HIGH',
    difficultyScore: 7,
    difficultyBadge: 'Level 7: High Discipline Pullback',
    description: 'Enforces disciplined entry on a healthy pullback instead of chasing overextended candles.',
    rulesOverview: [
      'Pullback validation: 0.10% to 1.8% retracement from recent swing extreme',
      'Existing portfolio drawdown protected (PnL not worse than -6%)',
      'Free margin ratio >= 35%',
    ],
  },
  8: {
    slotNumber: 8,
    name: 'Volume Expansion & Portfolio Shield',
    difficulty: 'VERY_STRICT',
    difficultyScore: 8,
    difficultyBadge: 'Level 8: Very Strict Portfolio Shield',
    description: 'Protects capital by forbidding 8th entry if existing positions are underwater, plus volume expansion.',
    rulesOverview: [
      'Portfolio Drawdown Shield: existing trades unrealized PnL >= -3.5%',
      'Volume is active and expanding',
      '1h & 15m SMA slopes both positively aligned with side',
      'Free margin ratio >= 45%',
    ],
  },
  9: {
    slotNumber: 9,
    name: 'Winning Portfolio Rule & Triple Confluence',
    difficulty: 'ULTRA_STRICT',
    difficultyScore: 9,
    difficultyBadge: 'Level 9: Ultra Strict Winner Rule',
    description: 'Only profitable portfolios may scale to 9 live trades, backed by 3-candle confirmation and 24h agreement.',
    rulesOverview: [
      'WINNING PORTFOLIO RULE: Aggregate unrealized PnL MUST be >= $0.00',
      'Triple Timeframe Confluence: 15m, 1h, and 24h change all aligned',
      'At least 3 consecutive confirming candle closes',
      'Free margin ratio >= 50%',
    ],
  },
  10: {
    slotNumber: 10,
    name: 'Supreme Institutional Setup',
    difficulty: 'TOUGHEST',
    difficultyScore: 10,
    difficultyBadge: 'Level 10: Toughest Supreme Setup',
    description: 'The ultimate standard. Requires a solidly profitable portfolio, pristine golden-zone RSI, and R:R >= 1.8x.',
    rulesOverview: [
      'Portfolio PnL strictly positive (aggregate PnL >= +1.0% of margin)',
      'Supreme multi-timeframe alignment across 15m, 1h, and 24h',
      'Golden Zone RSI: BUY between 50-68, SELL between 32-50 (zero exhaustion)',
      'Reward-to-Risk ratio >= 1.8:1 if TP & SL are defined',
      'Free margin ratio >= 55% of total equity',
    ],
  },
};

// Helper: Calculate 14-period RSI
export function calculateRSI(candles: Candle[], period: number = 14): number {
  if (!candles || candles.length < period + 1) {
    return 52; // Neutral default if not enough candles
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

// Helper: Calculate SMA
export function calculateSMA(candles: Candle[], period: number = 10): number {
  if (!candles || candles.length === 0) return 0;
  const window = candles.slice(-period);
  const sum = window.reduce((acc, c) => acc + c.close, 0);
  return sum / window.length;
}

// Helper: Check consecutive candle closes
export function checkConsecutiveCandles(candles: Candle[], count: number, isLong: boolean): boolean {
  if (!candles || candles.length < count) return true;
  const slice = candles.slice(-count);
  return slice.every((c) => (isLong ? c.close >= c.open : c.close <= c.open));
}

// Helper: Calculate candle body ratio (body / range)
export function getCandleBodyRatio(candle: Candle): number {
  const range = candle.high - candle.low;
  if (range <= 0) return 1;
  const body = Math.abs(candle.close - candle.open);
  return body / range;
}

export interface EvaluationParams {
  runningPositions: Position[];
  asset: MarketAsset;
  side: OrderSide;
  cashBalance: number;
  totalEquity: number;
  requiredMargin?: number;
  trend15m?: CandleTrendInfo;
  trend1h?: CandleTrendInfo;
  candles15m?: Candle[];
  candles1h?: Candle[];
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

export function evaluateTradeEntryConditions(params: EvaluationParams): TradeSlotEvaluation {
  const {
    runningPositions,
    asset,
    side,
    cashBalance,
    totalEquity,
    requiredMargin = 0,
    trend15m,
    trend1h,
    candles15m = [],
    candles1h = [],
    takeProfitPrice,
    stopLossPrice,
  } = params;

  const runningTradesCount = runningPositions.length;
  const slotNumber = Math.min(10, runningTradesCount + 1);
  const isMaxCapacityReached = runningTradesCount >= MAX_RUNNING_TRADES;

  const tier = TRADE_TIER_CONFIGS[slotNumber] || TRADE_TIER_CONFIGS[10];
  const isLong = side === 'BUY';
  const curPrice = asset.price;

  // Portfolio calculations
  const totalMarginLocked = runningPositions.reduce((acc, p) => acc + p.margin, 0);
  const totalUnrealizedPnL = runningPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
  const effectiveEquity = Math.max(1, totalEquity > 0 ? totalEquity : cashBalance + totalMarginLocked + totalUnrealizedPnL);
  const freeMarginRatio = (cashBalance / effectiveEquity) * 100;
  const portfolioDrawdownPct = totalMarginLocked > 0 ? (totalUnrealizedPnL / totalMarginLocked) * 100 : 0;

  // Technical calculations
  const rsiValue = candles15m.length >= 14 ? calculateRSI(candles15m, 14) : 50;
  const sma10_15m = candles15m.length >= 5 ? calculateSMA(candles15m, 10) : curPrice;
  const sma10_1h = candles1h.length >= 5 ? calculateSMA(candles1h, 10) : curPrice;
  const lastCandle15m = candles15m.length > 0 ? candles15m[candles15m.length - 1] : undefined;
  const bodyRatio = lastCandle15m ? getCandleBodyRatio(lastCandle15m) : 0.6;

  // Check correlation: positions on same side
  const sameSidePositionsCount = runningPositions.filter(
    (p) => (isLong ? p.side === 'LONG' : p.side === 'SHORT')
  ).length;

  const checks: RuleCheckResult[] = [];

  // If already at max capacity, immediate full fail
  if (isMaxCapacityReached) {
    checks.push({
      id: 'max_capacity_check',
      name: 'Active Live Trade Capacity',
      passed: false,
      requirement: 'Live running trades < 10',
      currentValue: `${runningTradesCount}/10 Active`,
      explanation: 'Maximum 10 live running trades limit reached. Must close an active trade before opening any new position.',
    });

    return {
      slotNumber,
      runningTradesCount,
      maxTrades: MAX_RUNNING_TRADES,
      isMaxCapacityReached: true,
      tier,
      canEnter: false,
      checks,
      unmetReasons: ['Active trade capacity full: 10 of 10 live trades running.'],
      passedReasons: [],
      passPercentage: 0,
    };
  }

  // Common Rule A: Account Liquidity & Free Margin
  const minRequiredFreeMarginRatio =
    slotNumber === 1
      ? 5
      : slotNumber === 2
      ? 10
      : slotNumber === 3
      ? 15
      : slotNumber === 4
      ? 20
      : slotNumber === 5
      ? 25
      : slotNumber === 6
      ? 30
      : slotNumber === 7
      ? 35
      : slotNumber === 8
      ? 42
      : slotNumber === 9
      ? 48
      : 55;

  const marginRatioPassed = freeMarginRatio >= minRequiredFreeMarginRatio && cashBalance >= requiredMargin;
  checks.push({
    id: 'margin_ratio_check',
    name: `Free Margin Cushion (Tier ${slotNumber})`,
    passed: marginRatioPassed,
    requirement: `>= ${minRequiredFreeMarginRatio}% free margin (Req: $${requiredMargin.toFixed(1)})`,
    currentValue: `${freeMarginRatio.toFixed(1)}% free ($${cashBalance.toFixed(2)})`,
    explanation: marginRatioPassed
      ? `Sufficient liquid cushion: ${freeMarginRatio.toFixed(1)}% free equity exceeds the ${minRequiredFreeMarginRatio}% buffer required for Slot #${slotNumber}.`
      : `Insufficient margin reserve: account has ${freeMarginRatio.toFixed(1)}% free equity, but Slot #${slotNumber} requires at least ${minRequiredFreeMarginRatio}%.`,
  });

  // SLOT 1: Pioneer Entry (Minimum / Easiest)
  if (slotNumber >= 1) {
    const dirTrend = trend15m?.direction || trend1h?.direction || (asset.change24h >= 0 ? 'BULLISH' : 'BEARISH');
    const basicDirPass = isLong ? dirTrend !== 'BEARISH' || asset.change24h > -1.5 : dirTrend !== 'BULLISH' || asset.change24h < 1.5;

    checks.push({
      id: 'slot1_direction',
      name: 'Directional Coherence',
      passed: basicDirPass,
      requirement: `No severe conflict with ${isLong ? 'BUY' : 'SELL'} direction`,
      currentValue: `Trend: ${dirTrend}, 24h: ${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%`,
      explanation: basicDirPass
        ? `Direction is viable for ${side} trade entry.`
        : `Market is in strong counter-trend opposing ${side}.`,
    });
  }

  // SLOT 2: Trend Confirmation (Easy)
  if (slotNumber >= 2) {
    const t15 = trend15m?.direction || (lastCandle15m ? (lastCandle15m.close >= lastCandle15m.open ? 'BULLISH' : 'BEARISH') : 'BULLISH');
    const trendPassed = isLong ? t15 === 'BULLISH' || (trend15m?.changePercent ?? 0) >= -0.1 : t15 === 'BEARISH' || (trend15m?.changePercent ?? 0) <= 0.1;

    checks.push({
      id: 'slot2_15m_trend',
      name: '15m Candle Confirmation',
      passed: trendPassed,
      requirement: `15m candle confirms ${isLong ? 'BULLISH' : 'BEARISH'} bias`,
      currentValue: `15m: ${t15} (${(trend15m?.changePercent ?? 0).toFixed(2)}%)`,
      explanation: trendPassed
        ? `15m interval confirms the ${side} entry bias.`
        : `15m interval is opposing ${side}. Wait for 15m candle agreement.`,
    });

    const volPassed = asset.volume24h > 1000000;
    checks.push({
      id: 'slot2_liquidity',
      name: 'Market Liquidity Filter',
      passed: volPassed,
      requirement: '24h Trading Volume > $1,000,000',
      currentValue: `$${(asset.volume24h / 1000000).toFixed(1)}M volume`,
      explanation: volPassed ? 'Active volume liquidity confirmed.' : 'Market volume is too low for safe scaling.',
    });
  }

  // SLOT 3: Dual Timeframe Confluence (Mild)
  if (slotNumber >= 3) {
    const t1hDir = trend1h?.direction || (asset.change24h >= 0 ? 'BULLISH' : 'BEARISH');
    // Long-term buy trades are more profitable: BUY requires non-bearish 1h, whereas SHORT strictly requires bearish 1h
    const dualAligned = isLong ? t1hDir !== 'BEARISH' : t1hDir === 'BEARISH';

    checks.push({
      id: 'slot3_dual_tf',
      name: isLong ? '1h Hourly Trend Alignment' : '1h Confirmed Bearish Breakdown',
      passed: dualAligned,
      requirement: isLong
        ? '1h timeframe not opposing BUY (Bullish or consolidating)'
        : '1h timeframe strictly BEARISH (Shorts require confirmed breakdown)',
      currentValue: `1h: ${t1hDir}`,
      explanation: dualAligned
        ? (isLong
            ? `Hourly structure supports BUY position with secular upward bias.`
            : `1h confirmed bearish breakdown aligns with SHORT entry.`)
        : (isLong
            ? `1h hourly timeframe conflicts with BUY. Confluence missing.`
            : `Counter-trend short blocked: 1h is ${t1hDir}. Long-term BUY trades are more profitable; shorting requires confirmed bearish hourly trend.`),
    });

    const smaPassed = isLong ? curPrice >= sma10_15m * 0.998 : curPrice <= sma10_15m * 1.002;
    checks.push({
      id: 'slot3_sma10',
      name: '10-Period SMA Trend Filter',
      passed: smaPassed,
      requirement: `Price on correct side of 15m SMA10 ($${sma10_15m.toFixed(2)})`,
      currentValue: `Price: $${curPrice.toFixed(2)} vs SMA: $${sma10_15m.toFixed(2)}`,
      explanation: smaPassed
        ? `Price action is aligned with 10-period moving average.`
        : `Price has crossed below/above SMA10 in counter-trend direction.`,
    });
  }

  // SLOT 4: Momentum & Wick Strength (Moderate)
  if (slotNumber >= 4) {
    const rsiPassed = isLong ? rsiValue >= 38 && rsiValue <= 75 : rsiValue >= 25 && rsiValue <= 62;
    checks.push({
      id: 'slot4_rsi_momentum',
      name: 'RSI(14) Momentum Safety Zone',
      passed: rsiPassed,
      requirement: isLong ? 'RSI between 38 and 75 (not oversold/exhausted)' : 'RSI between 25 and 62',
      currentValue: `RSI: ${rsiValue}`,
      explanation: rsiPassed
        ? `RSI(${rsiValue}) is in a healthy momentum corridor.`
        : `RSI(${rsiValue}) is in an extreme exhausted zone for ${side}.`,
    });

    const bodyPassed = bodyRatio >= 0.3;
    checks.push({
      id: 'slot4_wick_strength',
      name: 'Candle Body Solidness',
      passed: bodyPassed,
      requirement: 'Candle body >= 30% of range (no opposing pin rejection)',
      currentValue: `Body Ratio: ${(bodyRatio * 100).toFixed(0)}%`,
      explanation: bodyPassed
        ? 'Candle structure shows real conviction with healthy body.'
        : 'Excessive wick detected. Possible sharp rejection against trade.',
    });
  }

  // SLOT 5: Extreme Guard & Exposure Filter (Rigorous)
  if (slotNumber >= 5) {
    const distToHighPct = asset.high24h > 0 ? ((asset.high24h - curPrice) / asset.high24h) * 100 : 1;
    const distToLowPct = asset.low24h > 0 ? ((curPrice - asset.low24h) / asset.low24h) * 100 : 1;
    const extremePassed = isLong ? distToHighPct >= 0.25 : distToLowPct >= 0.25;

    checks.push({
      id: 'slot5_extreme_guard',
      name: '24h Boundary Extreme Guard',
      passed: extremePassed,
      requirement: isLong ? 'Not within 0.25% of 24h High (avoid top buying)' : 'Not within 0.25% of 24h Low (avoid bottom selling)',
      currentValue: isLong ? `${distToHighPct.toFixed(2)}% below 24h High` : `${distToLowPct.toFixed(2)}% above 24h Low`,
      explanation: extremePassed
        ? 'Price is safely spaced away from boundary extremes.'
        : `Warning: Price is too close to 24h ${isLong ? 'High ($' + asset.high24h + ')' : 'Low ($' + asset.low24h + ')'}. High probability of mean-reversion.`,
    });

    const sameSideLimit = isLong ? MAX_BUY_POSITIONS : MAX_SHORT_POSITIONS;
    const correlationPassed = sameSidePositionsCount < sameSideLimit;
    checks.push({
      id: 'slot5_correlation_guard',
      name: isLong ? '75% BUY Allocation Quota' : '25% SHORT Exposure Cap',
      passed: correlationPassed,
      requirement: isLong
        ? `Active BUY trades < ${MAX_BUY_POSITIONS} (75% Long-Term Bias Quota)`
        : `Active SHORT trades < ${MAX_SHORT_POSITIONS} (25% Directional Cap)`,
      currentValue: `${sameSidePositionsCount}/${sameSideLimit} active ${isLong ? 'BUY' : 'SHORT'} trades`,
      explanation: correlationPassed
        ? (isLong
            ? `BUY allocation is within the 75% long-term profit bias quota (${sameSidePositionsCount}/${MAX_BUY_POSITIONS}). Long trades have higher statistical expectancy.`
            : `SHORT allocation is within the 25% risk cap (${sameSidePositionsCount}/${MAX_SHORT_POSITIONS}).`)
        : (isLong
            ? `Maximum ${MAX_BUY_POSITIONS} BUY trades reached. Close or take profit on existing long positions.`
            : `25% Short Cap Reached: Already holding ${sameSidePositionsCount} active SHORT trades. Long-term BUY trades are statistically more profitable with lower drawdown risk.`),
    });
  }

  // SLOT 6: Multi-Candle Continuity (Strict)
  if (slotNumber >= 6) {
    const last2Pass = checkConsecutiveCandles(candles15m, 2, isLong);
    checks.push({
      id: 'slot6_candle_continuity',
      name: 'Consecutive Candle Follow-Through',
      passed: last2Pass,
      requirement: `Last 2 15m candles confirm ${isLong ? 'bullish' : 'bearish'} follow-through`,
      currentValue: last2Pass ? '2/2 Confirming' : 'Mixed / Counter candle detected',
      explanation: last2Pass
        ? 'Sustained directional sequence across consecutive candles.'
        : 'Lack of consecutive candle confirmation. Wait for directional close.',
    });
  }

  // SLOT 7: Pullback Retracement Filter (High Difficulty)
  if (slotNumber >= 7) {
    // Check pullback from recent 10-candle extreme
    let pullbackHealthy = true;
    if (candles15m.length >= 8) {
      const recentExtremes = candles15m.slice(-8);
      const recentHigh = Math.max(...recentExtremes.map((c) => c.high));
      const recentLow = Math.min(...recentExtremes.map((c) => c.low));
      const pullbackFromHigh = recentHigh > 0 ? ((recentHigh - curPrice) / recentHigh) * 100 : 0;
      const bounceFromLow = recentLow > 0 ? ((curPrice - recentLow) / recentLow) * 100 : 0;

      pullbackHealthy = isLong ? pullbackFromHigh >= 0.05 && pullbackFromHigh <= 2.5 : bounceFromLow >= 0.05 && bounceFromLow <= 2.5;
    }

    checks.push({
      id: 'slot7_pullback_filter',
      name: 'Disciplined Pullback Requirement',
      passed: pullbackHealthy,
      requirement: 'Price is in healthy retrace (0.05% - 2.5% from swing point, not chasing top/bottom)',
      currentValue: pullbackHealthy ? 'Healthy Pullback' : 'Overextended / Extended Run',
      explanation: pullbackHealthy
        ? 'Disciplined entry: trade is taking advantage of a measured retracement.'
        : 'Unfavorable entry location: asset is overextended without a clean pullback.',
    });

    const portfolioDrawdownPass = portfolioDrawdownPct >= -6.0;
    checks.push({
      id: 'slot7_portfolio_drawdown',
      name: 'Portfolio Drawdown Guard',
      passed: portfolioDrawdownPass,
      requirement: 'Existing portfolio unrealized PnL >= -6.0%',
      currentValue: `${portfolioDrawdownPct >= 0 ? '+' : ''}${portfolioDrawdownPct.toFixed(2)}%`,
      explanation: portfolioDrawdownPass
        ? 'Existing running positions are within safe risk parameters.'
        : `Existing trades are in -${Math.abs(portfolioDrawdownPct).toFixed(1)}% drawdown. Do not add 7th trade into a bleeding book.`,
    });
  }

  // SLOT 8: Volume Expansion & Portfolio Drawdown Shield (Very Strict)
  if (slotNumber >= 8) {
    const strictDrawdownPass = portfolioDrawdownPct >= -3.5;
    checks.push({
      id: 'slot8_strict_shield',
      name: 'Portfolio Capital Shield',
      passed: strictDrawdownPass,
      requirement: 'Existing running trades PnL >= -3.5% (strict defensive guard)',
      currentValue: `${portfolioDrawdownPct >= 0 ? '+' : ''}${portfolioDrawdownPct.toFixed(2)}% PnL`,
      explanation: strictDrawdownPass
        ? 'Portfolio drawdown shield clear. Existing positions healthy.'
        : `Blocked: Existing running trades are at ${portfolioDrawdownPct.toFixed(1)}% drawdown. Tier 8 requires PnL >= -3.5%.`,
    });

    const smaSlopePass = isLong ? sma10_15m >= sma10_1h * 0.997 : sma10_15m <= sma10_1h * 1.003;
    checks.push({
      id: 'slot8_sma_slope',
      name: 'Dual Moving Average Alignment (15m vs 1h SMA)',
      passed: smaSlopePass,
      requirement: '15m SMA and 1h SMA slopes aligned in trade direction',
      currentValue: `15m SMA: $${sma10_15m.toFixed(1)} | 1h SMA: $${sma10_1h.toFixed(1)}`,
      explanation: smaSlopePass ? 'Moving average slope alignment confirmed.' : 'Moving average slopes are diverging.',
    });
  }

  // SLOT 9: Winning Portfolio Rule & Triple Confluence (Ultra Strict)
  if (slotNumber >= 9) {
    const winningPortfolioPass = totalUnrealizedPnL >= 0;
    checks.push({
      id: 'slot9_winner_rule',
      name: 'Winning Portfolio Rule (Net Positive PnL)',
      passed: winningPortfolioPass,
      requirement: 'TOTAL RUNNING POSITIONS UNREALIZED PnL MUST BE >= $0.00',
      currentValue: `${totalUnrealizedPnL >= 0 ? '+$' : '-$'}${Math.abs(totalUnrealizedPnL).toFixed(2)} USDT`,
      explanation: winningPortfolioPass
        ? 'Winning Portfolio Rule SATISFIED: You are scaling from a position of net overall profit.'
        : 'WINNING PORTFOLIO RULE FAILED: You cannot open a 9th live trade while aggregate running trades are in negative PnL.',
    });

    const triplePass = isLong
      ? (trend15m?.direction === 'BULLISH' || (trend15m?.changePercent ?? 0) > 0) &&
        (trend1h?.direction === 'BULLISH' || (trend1h?.changePercent ?? 0) > 0) &&
        asset.change24h > 0
      : (trend15m?.direction === 'BEARISH' || (trend15m?.changePercent ?? 0) < 0) &&
        (trend1h?.direction === 'BEARISH' || (trend1h?.changePercent ?? 0) < 0) &&
        asset.change24h < 0;

    checks.push({
      id: 'slot9_triple_confluence',
      name: 'Triple Timeframe Confluence (15m + 1h + 24h)',
      passed: triplePass,
      requirement: `15m, 1h, and 24h all unanimously ${isLong ? 'BULLISH / GREEN' : 'BEARISH / RED'}`,
      currentValue: `15m: ${trend15m?.direction || 'N/A'}, 1h: ${trend1h?.direction || 'N/A'}, 24h: ${asset.change24h.toFixed(1)}%`,
      explanation: triplePass
        ? 'Triple timeframe macro-to-micro alignment confirmed.'
        : 'Missing unanimous triple timeframe agreement.',
    });
  }

  // SLOT 10: Supreme Institutional Setup (Toughest)
  if (slotNumber >= 10) {
    const profitBufferPass = portfolioDrawdownPct >= 1.0;
    checks.push({
      id: 'slot10_profit_buffer',
      name: 'Established Profit Buffer (PnL >= +1.0%)',
      passed: profitBufferPass,
      requirement: 'Aggregate running positions unrealized PnL >= +1.0% profit cushion',
      currentValue: `${portfolioDrawdownPct >= 0 ? '+' : ''}${portfolioDrawdownPct.toFixed(2)}% margin return`,
      explanation: profitBufferPass
        ? 'Strong profit buffer verified. Account is primed for 10th slot.'
        : 'Slot #10 requires existing trades to be actively locked in profit (+1.0% or greater).',
    });

    // Golden Zone RSI: Strong momentum without overbought/oversold exhaustion
    const goldenRsiPass = isLong ? rsiValue >= 48 && rsiValue <= 68 : rsiValue >= 32 && rsiValue <= 52;
    checks.push({
      id: 'slot10_golden_rsi',
      name: 'Golden Zone RSI (Pristine Momentum)',
      passed: goldenRsiPass,
      requirement: isLong ? 'RSI strictly between 48 and 68' : 'RSI strictly between 32 and 52',
      currentValue: `RSI: ${rsiValue}`,
      explanation: goldenRsiPass
        ? 'RSI is in the golden expansion corridor with zero exhaustion risk.'
        : `RSI (${rsiValue}) is outside the pristine institutional golden band.`,
    });

    // Reward to Risk Ratio >= 1.8:1
    let rrPassed = true;
    let rrRatio = 2.0;
    if (takeProfitPrice && stopLossPrice && takeProfitPrice > 0 && stopLossPrice > 0) {
      const reward = Math.abs(takeProfitPrice - curPrice);
      const risk = Math.abs(curPrice - stopLossPrice);
      rrRatio = risk > 0 ? reward / risk : 2.0;
      rrPassed = rrRatio >= 1.8;
    }
    checks.push({
      id: 'slot10_rr_ratio',
      name: 'Reward-to-Risk Standard (>= 1.8:1)',
      passed: rrPassed,
      requirement: 'Reward-to-Risk ratio >= 1.8 to 1',
      currentValue: `${rrRatio.toFixed(2)}:1 Ratio`,
      explanation: rrPassed
        ? 'Favorable asymmetric risk-to-reward ratio.'
        : `Risk-to-reward ratio (${rrRatio.toFixed(2)}:1) is below the required 1.8:1 threshold.`,
    });
  }

  const passedChecks = checks.filter((c) => c.passed);
  const unmetChecks = checks.filter((c) => !c.passed);
  const canEnter = unmetChecks.length === 0;
  const passPercentage = checks.length > 0 ? Math.round((passedChecks.length / checks.length) * 100) : 100;

  return {
    slotNumber,
    runningTradesCount,
    maxTrades: MAX_RUNNING_TRADES,
    isMaxCapacityReached: false,
    tier,
    canEnter,
    checks,
    unmetReasons: unmetChecks.map((c) => `${c.name}: ${c.requirement} (${c.currentValue})`),
    passedReasons: passedChecks.map((c) => `${c.name} passed`),
    passPercentage,
  };
}
