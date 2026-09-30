export type AssetCategory = 'gold' | 'crypto';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: number;
  dataTimestamp: number;
  description: string;
  goldOunceFactor?: number; // 1 for XAUT/PAXG
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type PositionSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT';
export type TradeMode = 'SPOT' | 'LEVERAGED';

export interface Position {
  id: string;
  assetSymbol: string;
  side: PositionSide;
  entryPrice: number;
  amount: number; // In asset units (e.g. 0.5 XAUT)
  margin: number; // In USDT collateral
  leverage: number; // 1 to 50
  liquidationPrice: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  trailingStopPercent?: number; // e.g. 2 for 2%
  peakPrice?: number; // Highest price reached for LONG, lowest for SHORT
  openTime: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  feePaid: number;
  accountSource?: 'MANUAL' | 'AUTO_GRID';
}

export interface LimitOrder {
  id: string;
  assetSymbol: string;
  side: OrderSide;
  mode: TradeMode;
  targetPrice: number;
  amount: number;
  margin: number;
  leverage: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  trailingStopPercent?: number;
  createdAt: number;
  accountSource?: 'MANUAL' | 'AUTO_GRID';
}

export interface TradeRecord {
  id: string;
  assetSymbol: string;
  side: 'LONG' | 'SHORT' | 'BUY' | 'SELL';
  mode: TradeMode;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  leverage: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  fees: number;
  openTime: number;
  closeTime: number;
  closeReason: 'MANUAL' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'LIQUIDATION' | 'SPOT_SELL';
  accountSource?: 'MANUAL' | 'AUTO_GRID';
}

export interface SpotHolding {
  symbol: string;
  amount: number;
  avgCostPrice: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  initialPrice: number;
  note?: string;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
  browserNotified?: boolean;
}

export interface SimulatorConfig {
  initialBalance: number;
  brokerName?: string; // 'Shark Exchange'
  takerFeeRate: number; // e.g. 0.00016 (0.016% of trade value)
  makerFeeRate: number; // e.g. 0.00016 (0.016% of trade value)
  slippageRate: number; // e.g. 0.0004 (0.04%)
  enableSlippage: boolean;
  enableFees: boolean;
}

export interface SharkBrokerSpecs {
  name: string;
  makerBrokerageRatePct: number; // 0.016%
  makerBrokerageRateDecimal: number; // 0.00016
  takerBrokerageRatePct: number; // 0.064% (4x maker)
  takerBrokerageRateDecimal: number; // 0.00064
  brokerageRatePct: number; // 0.016% (maker base)
  brokerageRateDecimal: number; // 0.00016
  defaultLot: number; // 0.002
  goldDefaultSize: number; // 0.1
  btcDefaultLot: number; // 0.002
  goldMaxLeverage: number; // 75x
  btcMaxLeverage: number; // 150x
  restMaxLeverage: number; // 25x
}

export const SHARK_EXCHANGE: SharkBrokerSpecs = {
  name: 'Shark Exchange',
  makerBrokerageRatePct: 0.016, // 0.016% Maker
  makerBrokerageRateDecimal: 0.00016,
  takerBrokerageRatePct: 0.064, // 0.064% Taker (4x Maker)
  takerBrokerageRateDecimal: 0.00064,
  brokerageRatePct: 0.016,
  brokerageRateDecimal: 0.00016,
  defaultLot: 0.002,
  goldDefaultSize: 0.1, // 0.1 XAUT / Gold
  btcDefaultLot: 0.002, // 0.002 BTC
  goldMaxLeverage: 150, // Up to 150x supported
  btcMaxLeverage: 150, // 150x for BTC
  restMaxLeverage: 150, // Up to 150x supported across symbols
};

export interface TradeMarginCalculation {
  symbolPrice: number;
  lot: number;
  leverage: number;
  tradeValue: number; // symbolPrice * lot
  marginRequired: number; // tradeValue / leverage
  makerFee: number; // tradeValue * 0.016% (0.00016)
  takerFee: number; // tradeValue * 0.064% (4x maker = 0.00064)
  activeFee: number; // makerFee if Maker, takerFee if Taker (4x)
  exitPrice: number;
  exitTradeValue: number; // exitPrice * lot
  tradeValueDiff: number; // (exitTradeValue - tradeValue) for LONG, (tradeValue - exitTradeValue) for SHORT
  netReturn: number; // Return = Change in Trade Value (tradeValueDiff)
  netReturnAfterFees: number; // tradeValueDiff - activeFee
  roePercent: number; // (netReturn / marginRequired) * 100
}

/**
 * Canonical Margin, Fee & Return Calculator:
 * - Trade value = symbolPrice * lot (e.g. 80000 * 0.002 = 160)
 * - Margin required = tradeValue / leverage (e.g. 160 / 150 = 1.0667)
 * - Fees = tradeValue * 0.016% if Maker order (Taker has 4x brokerage = 0.064%)
 * - Return = Change in Trade Value (exitTradeValue - tradeValue for LONG, tradeValue - exitTradeValue for SHORT)
 */
export function calculateMarginAndReturn(params: {
  symbolPrice: number;
  lot: number;
  leverage: number;
  isMaker?: boolean;
  exitPrice?: number;
  side?: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  enableFees?: boolean;
}): TradeMarginCalculation {
  const symbolPrice = Math.max(0, params.symbolPrice || 0);
  const lot = Math.max(0, params.lot || 0);
  const leverage = Math.max(1, params.leverage || 1);
  const isMaker = params.isMaker ?? false;
  const enableFees = params.enableFees ?? true;
  const isLong = !params.side || params.side === 'BUY' || params.side === 'LONG';

  const tradeValue = symbolPrice * lot;
  const marginRequired = tradeValue / leverage;
  const makerFee = enableFees ? tradeValue * SHARK_EXCHANGE.makerBrokerageRateDecimal : 0;
  const takerFee = enableFees ? tradeValue * SHARK_EXCHANGE.takerBrokerageRateDecimal : 0;
  const activeFee = isMaker ? makerFee : takerFee;

  const exitPrice = params.exitPrice !== undefined ? Math.max(0, params.exitPrice) : symbolPrice;
  const exitTradeValue = exitPrice * lot;
  const tradeValueDiff = isLong
    ? exitTradeValue - tradeValue
    : tradeValue - exitTradeValue;
  const netReturn = tradeValueDiff;
  const netReturnAfterFees = tradeValueDiff - activeFee;
  const roePercent = marginRequired > 0 ? (netReturn / marginRequired) * 100 : 0;

  return {
    symbolPrice,
    lot,
    leverage,
    tradeValue,
    marginRequired,
    makerFee,
    takerFee,
    activeFee,
    exitPrice,
    exitTradeValue,
    tradeValueDiff,
    netReturn,
    netReturnAfterFees,
    roePercent,
  };
}

export interface LotPointRiskCalculation {
  entryPrice: number;
  lotSize: number;
  dollarRisk: number; // e.g. $3 on BTC
  pointsDistance: number; // dollarRisk / lotSize (1 lot -> 3 pts, 0.1 -> 30 pts, 0.01 -> 300 pts, 0.002 -> 1500 pts)
  buySlLiqPrice: number; // entryPrice - pointsDistance (e.g. 80000 - 1500 = 78500)
  sellSlLiqPrice: number; // entryPrice + pointsDistance (e.g. 80000 + 1500 = 81500)
  activeSlLiqPrice: number;
  distancePercent: number;
}

/**
 * Contract Size (Lot) Based Liquidation & Stop-Loss Point Calculator:
 * - Points Distance = Dollar Risk ($) / Lot Size
 *   Example for $3 on BTC:
 *   - 1 lot     -> 3 / 1     = 3 points     (Buy @ 80000 -> 79997)
 *   - 0.1 lot   -> 3 / 0.1   = 30 points    (Buy @ 80000 -> 79970)
 *   - 0.01 lot  -> 3 / 0.01  = 300 points   (Buy @ 80000 -> 79700)
 *   - 0.002 lot -> 3 / 0.002 = 1500 points  (Buy @ 80000 -> 78500)
 */
export function calculateLotPointsAndSlLiq(params: {
  entryPrice: number;
  lotSize: number;
  dollarRisk?: number; // Default $3
  side?: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
}): LotPointRiskCalculation {
  const entryPrice = Math.max(0, params.entryPrice || 0);
  const lotSize = Math.max(0.000001, params.lotSize || 0.002);
  const dollarRisk = Math.max(0.01, params.dollarRisk ?? 3);
  const isLong = !params.side || params.side === 'BUY' || params.side === 'LONG';

  const pointsDistance = dollarRisk / lotSize;
  const buySlLiqPrice = Math.max(0, entryPrice - pointsDistance);
  const sellSlLiqPrice = entryPrice + pointsDistance;
  const activeSlLiqPrice = isLong ? buySlLiqPrice : sellSlLiqPrice;
  const distancePercent = entryPrice > 0 ? (pointsDistance / entryPrice) * 100 : 0;

  return {
    entryPrice,
    lotSize,
    dollarRisk,
    pointsDistance,
    buySlLiqPrice,
    sellSlLiqPrice,
    activeSlLiqPrice,
    distancePercent,
  };
}

export function getBrokerMaxLeverage(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === 'BTC') return SHARK_EXCHANGE.btcMaxLeverage;
  if (s === 'XAUT' || s === 'PAXG' || s.includes('GOLD')) return SHARK_EXCHANGE.goldMaxLeverage;
  return SHARK_EXCHANGE.restMaxLeverage;
}

export function getBrokerDefaultSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === 'BTC') return SHARK_EXCHANGE.btcDefaultLot;
  if (s === 'XAUT' || s === 'PAXG' || s.includes('GOLD')) return SHARK_EXCHANGE.goldDefaultSize;
  return SHARK_EXCHANGE.defaultLot;
}

// Auto Grid Trader Data Models
export type AutoGridStatus =
  | 'IDLE'
  | 'WAITING_FOR_ENTRY'
  | 'IN_POSITION'
  | 'PAUSED'
  | 'COMPLETED';

export type AutoGridDirectionMode = 'AUTO_TREND' | 'BUY_ONLY' | 'SELL_ONLY';
export type AutoGridTimeframeFilter = '15m' | '1h' | 'CONFLUENCE';
export type AutoGridSpacingMode = 'EQUAL' | 'STEP';

export interface GridLadderLevel {
  level: number; // 1 to 10
  direction: 'UP' | 'DOWN' | 'BASE';
  multiplier: number; // 0, 0.5, 1, 1.5, 2... or 1, 2, 4, 8...
  multiplierLabel: string; // e.g. "0.5x G (+25 pts)", "2x step (+100 pts)"
  milestoneTriggerPrice: number; // e.g. 4500, 4525, 4550 or 4450, 4400...
  targetEntryPrice: number; // e.g. 4502.5, 4527.5, 4447.5, 4397.5...
  offsetFromBase: number; // in points
  gapFromPrev: number; // gap in points from previous tier
  isPassed: boolean;
  isActive: boolean;
  type: 'TREND_PYRAMID' | 'DCA_PULLBACK' | 'BASE';
}

export interface CandleTrendInfo {
  timeframe: '15m' | '1h';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  open: number;
  close: number;
  high: number;
  low: number;
  changePercent: number;
  sma10?: number;
}

export interface AutoGridConfig {
  id: string;
  enabled: boolean;
  symbol: string;
  side: 'BUY' | 'SELL';
  // Trend and Direction control
  directionMode: AutoGridDirectionMode; // 'AUTO_TREND' | 'BUY_ONLY' | 'SELL_ONLY'
  timeframeFilter: AutoGridTimeframeFilter; // '15m' | '1h' | 'CONFLUENCE'
  // Grid Spacing Strategy Mode: EQUAL (0.5x up, 1.0x down) vs STEP (1x, 2x, 4x with editable multiplier)
  spacingMode: AutoGridSpacingMode; // 'EQUAL' | 'STEP'
  // Digit-Reference & Factor-Based Scaling Parameters:
  // Example: BTC @ 85,436 -> 6-digit min ref (100,000) -> 3-digit min Base G (100)
  // G = baseG * gridScaleFactor
  // Entry = +entryGapFactor * G (default 0.05 * G)
  // SL in Start = -slStartFactor * G trailing from price (default 0.5 * G)
  // Winning Condition = > winConditionFactor * G (default 0.5 * G)
  // SL After Win = -slAfterFactor * G trailing from peak price (default 0.1 * G)
  gridScaleFactor?: number; // default: 1.0 (scales Base G)
  entryGapFactor?: number; // default: 0.05 (+0.05 * G entry trigger)
  slStartFactor?: number; // default: 0.5 (-0.5 * G trailing SL at start)
  winConditionFactor?: number; // default: 0.5 (> 0.5 * G winning condition)
  slAfterFactor?: number; // default: 0.1 (-0.1 * G tight trailing SL after winning condition)
  upsideMultiplier: number; // multiplier for upside gap (default: 0.5 -> G * 0.5)
  downsideMultiplier: number; // multiplier for downside gap (default: 1.0 -> G * 1.0)
  stepMultiplier: number; // editable step multiplier for geometric scaling (default: 2 -> 1x, 2x, 4x...)
  downsideGapMultiplier?: number; // legacy alias for downsideMultiplier
  gridStructure?: 'BIDIRECTIONAL' | 'UP_ONLY' | 'DOWN_ONLY'; // default: BIDIRECTIONAL
  // Computed Point-based Grid & Entry parameters (synced from factors * G)
  gridSpacing: number; // G = baseG * gridScaleFactor (e.g. 100 points for BTC)
  entryOffset: number; // entryGapFactor * G (e.g. +5 points for G=100)
  initialSlOffset: number; // -slStartFactor * G (e.g. -50 points for G=100)
  // Chase high & Trailing Dynamic SL
  trailingDistance: number; // slAfterFactor * G (e.g. 10 points for G=100)
  pullbackTrigger: number; // pullback trigger
  // Winning Condition & Profit Lock
  profitActivationThreshold: number; // winConditionFactor * G (e.g. +50 points for G=100)
  lockedProfitSlOffset: number; // (winConditionFactor - slAfterFactor) * G (e.g. +40 points for G=100)
  // Guaranteed Minimum Profit Exit
  minExitProfitOffset: number; // minimum exit threshold
  // Execution & Sizing
  lotSize: number; // e.g. 0.1 for XAUT, 0.002 for BTC
  leverage: number; // e.g. 75x for Gold, 150x for BTC
  autoLoop: boolean; // loop to next grid level upon completion
  maxGridCycles: number; // max execution cycles (e.g. 10)
  basePriceAnchor?: number; // base price level reference
}

export interface AutoGridLogItem {
  id: string;
  timestamp: number;
  type: 'INFO' | 'TRIGGER' | 'CHASE_HIGH' | 'SL_UPDATE' | 'EXIT' | 'CYCLE_COMPLETE' | 'ERROR';
  message: string;
  price?: number;
  pnl?: number;
  points?: number;
}

export const MAX_RUNNING_LIVE_TRADES = 10;

export interface AutoGridRuntimeState {
  status: AutoGridStatus;
  currentCycle: number;
  basePrice: number;
  targetEntryPrice: number;
  activeSide: 'BUY' | 'SELL';
  activePositionId?: string;
  entryPrice?: number;
  highestPriceReached?: number;
  lowestPriceReached?: number;
  currentTrailingSL?: number;
  minExitPrice?: number;
  initialSLPrice?: number;
  lockedProfitSlPrice?: number;
  isChasingActivated?: boolean;
  pointsGain?: number;
  peakPointsGain?: number;
  trend15m?: CandleTrendInfo;
  trend1h?: CandleTrendInfo;
  detectedTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  completedTradesCount: number;
  totalRealizedPoints: number;
  totalRealizedPnL: number;
  runningTradesCount?: number;
  slotNumber?: number;
  slotTierName?: string;
  slotDifficulty?: string;
  slotConditionPassed?: boolean;
  slotUnmetReason?: string;
  logs: AutoGridLogItem[];
}
