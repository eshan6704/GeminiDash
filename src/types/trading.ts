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
  goldMaxLeverage: 75, // 75x for Gold
  btcMaxLeverage: 150, // 150x for BTC
  restMaxLeverage: 25, // 25x for rest like SOL, ETH, etc.
};

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
  upsideMultiplier: number; // multiplier for upside gap (default: 0.5 -> G * 0.5 = 25 pts)
  downsideMultiplier: number; // multiplier for downside gap (default: 1.0 -> G * 1.0 = 50 pts)
  stepMultiplier: number; // editable step multiplier for geometric scaling (default: 2 -> 1x, 2x, 4x...)
  downsideGapMultiplier?: number; // legacy alias for downsideMultiplier
  gridStructure?: 'BIDIRECTIONAL' | 'UP_ONLY' | 'DOWN_ONLY'; // default: BIDIRECTIONAL
  // Point-based Grid & Entry parameters
  gridSpacing: number; // e.g. 50 points
  entryOffset: number; // e.g. +2.5 points from base anchor
  initialSlOffset: number; // e.g. -50 points on start
  // Chase high & Trailing Dynamic SL
  trailingDistance: number; // e.g. 10 points (peak - 10)
  pullbackTrigger: number; // e.g. 5 points (pullback from peak to lock SL)
  // Step 1: Activation & Initial Profit Lock ("Once price > +25, SL will be entry +15, then start chasing")
  profitActivationThreshold: number; // e.g. +25 points (once price > +25 from entry)
  lockedProfitSlOffset: number; // e.g. +15 points (SL ratchets to entry + 15)
  // Guaranteed Minimum Profit Exit
  minExitProfitOffset: number; // e.g. +15 or +25 points (minimum exit threshold)
  // Execution & Sizing
  lotSize: number; // e.g. 0.1 for XAUT, 0.002 for BTC
  leverage: number; // e.g. 75x for Gold, 50x for BTC
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
