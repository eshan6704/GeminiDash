import React, { useState, useMemo } from 'react';
import {
  MarketAsset,
  GridLadderLevel,
  OrderSide,
} from '../../types/trading';
import {
  calculateGridLadderLevels,
  calculateDownsideLadderLevels,
} from '../../utils/gridLadderCalculator';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Zap,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Activity,
  Table,
  Coins,
} from 'lucide-react';

interface GridDcaPreviewChartProps {
  assets: Record<string, MarketAsset>;
  defaultSymbol?: string;
  onApplyConfigToBot?: (params: {
    symbol: string;
    side: OrderSide;
    gridSpacing: number;
    entryOffset: number;
    upsideMultiplier: number;
    downsideMultiplier: number;
    basePriceAnchor: number;
    spacingMode?: any;
    stepMultiplier?: number;
    downsideGapMultiplier?: number;
  }) => void;
  onClose?: () => void;
}

export const GridDcaPreviewChart: React.FC<GridDcaPreviewChartProps> = ({
  assets,
  defaultSymbol = 'XAUT',
  onApplyConfigToBot,
  onClose,
}) => {
  // Selected asset
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const currentAsset = assets[selectedSymbol] || assets.XAUT || Object.values(assets)[0];
  const livePrice = currentAsset?.price || 4500;

  // Grid configuration state
  const [side, setSide] = useState<OrderSide>('BUY');
  const [basePrice, setBasePrice] = useState<number>(livePrice);
  const [gridSpacing, setGridSpacing] = useState<number>(selectedSymbol === 'BTC' ? 500 : 50);
  const [entryOffset, setEntryOffset] = useState<number>(selectedSymbol === 'BTC' ? 25 : 2.5);
  // Multipliers: default upside 0.5 (gap = 0.5*G = 25 pts), default downside 1.0 (gap = 1.0*G = 50 pts)
  const [upsideMultiplier, setUpsideMultiplier] = useState<number>(0.5);
  const [downsideMultiplier, setDownsideMultiplier] = useState<number>(1.0);
  const [lotSize, setLotSize] = useState<number>(selectedSymbol === 'BTC' ? 0.002 : 0.1);
  const [leverage, setLeverage] = useState<number>(selectedSymbol === 'BTC' ? 100 : 75);
  const [maxLevels, setMaxLevels] = useState<number>(5); // 1 to 10 levels
  const [viewMode, setViewMode] = useState<'BOTH' | 'DOWNSIDE' | 'UPSIDE'>('BOTH');
  const [summaryTab, setSummaryTab] = useState<'DOWNSIDE_DCA' | 'UPSIDE_PYRAMID'>('DOWNSIDE_DCA');
  const [hoveredLevel, setHoveredLevel] = useState<GridLadderLevel | null>(null);

  // "What-If Price Slider" state
  const [simulatedPrice, setSimulatedPrice] = useState<number>(livePrice);

  const isLong = side === 'BUY';
  const isGold = currentAsset?.category === 'gold' || currentAsset?.symbol === 'XAUT';

  // Quick reset base price to live price when symbol changes
  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    const newAsset = assets[sym];
    const newPrice = newAsset?.price || 4500;
    setBasePrice(newPrice);
    setSimulatedPrice(newPrice);
    if (sym === 'BTC') {
      setGridSpacing(500);
      setEntryOffset(25);
      setLotSize(0.002);
      setLeverage(100);
    } else if (sym === 'ETH') {
      setGridSpacing(50);
      setEntryOffset(2.5);
      setLotSize(0.05);
      setLeverage(75);
    } else {
      setGridSpacing(50);
      setEntryOffset(2.5);
      setLotSize(0.1);
      setLeverage(75);
    }
  };

  // 1. Calculate Upside Ladder
  const upsideLevels: GridLadderLevel[] = useMemo(() => {
    return calculateGridLadderLevels({
      basePrice,
      gridSpacing,
      entryOffset,
      isLong,
      upsideMultiplier,
      downsideMultiplier,
      currentPrice: simulatedPrice,
      currentActiveLevel: 1,
    }).slice(0, maxLevels);
  }, [basePrice, gridSpacing, entryOffset, isLong, upsideMultiplier, downsideMultiplier, simulatedPrice, maxLevels]);

  // 2. Calculate Downside DCA Ladder
  const downsideLevels: GridLadderLevel[] = useMemo(() => {
    return calculateDownsideLadderLevels({
      basePrice,
      gridSpacing,
      entryOffset,
      isLong,
      upsideMultiplier,
      downsideMultiplier,
      currentPrice: simulatedPrice,
      currentActiveLevel: 1,
    }).slice(0, maxLevels);
  }, [basePrice, gridSpacing, entryOffset, isLong, upsideMultiplier, downsideMultiplier, simulatedPrice, maxLevels]);

  // 3. Combined list of distinct orders (avoid duplicate base entry)
  const allOrders = useMemo(() => {
    const list: (GridLadderLevel & { orderLabel: string; isDownside: boolean })[] = [];

    // Base level (#1)
    if (upsideLevels.length > 0) {
      list.push({
        ...upsideLevels[0],
        orderLabel: `Order #1 (Base ${side})`,
        isDownside: false,
      });
    }

    // Downside DCA levels (#2..N)
    for (let i = 1; i < downsideLevels.length; i++) {
      const lvl = downsideLevels[i];
      list.push({
        ...lvl,
        orderLabel: `DCA #${lvl.level} (${isLong ? 'Buy Low' : 'Sell High'})`,
        isDownside: true,
      });
    }

    // Upside Pyramiding levels (#2..N)
    for (let i = 1; i < upsideLevels.length; i++) {
      const lvl = upsideLevels[i];
      list.push({
        ...lvl,
        orderLabel: `Trend #${lvl.level} (${isLong ? 'Pyramid High' : 'Pyramid Low'})`,
        isDownside: false,
      });
    }

    // Sort by target entry price
    return list.sort((a, b) => (isLong ? b.targetEntryPrice - a.targetEntryPrice : a.targetEntryPrice - b.targetEntryPrice));
  }, [upsideLevels, downsideLevels, side, isLong]);

  // 4. Dedicated Next 5 Levels Summary Table Data (DCA & Upside)
  const next5LevelsSummary = useMemo(() => {
    const targetLadder = summaryTab === 'DOWNSIDE_DCA' ? downsideLevels : upsideLevels;
    const next5 = targetLadder.slice(0, 5);

    let runningCumUnits = 0;
    let runningCumCost = 0;
    let runningCumMargin = 0;

    const rows = next5.map((lvl) => {
      const isBase = lvl.level === 1;
      const units = lotSize;
      const notional = lvl.targetEntryPrice * units;
      const marginReq = notional / leverage;

      runningCumUnits += units;
      runningCumCost += notional;
      runningCumMargin += marginReq;

      const projectedAvgPrice = runningCumUnits > 0 ? runningCumCost / runningCumUnits : lvl.targetEntryPrice;
      const distancePts = Math.abs(lvl.targetEntryPrice - basePrice);
      const distancePct = basePrice > 0 ? (distancePts / basePrice) * 100 : 0;

      let tierName = `Level ${lvl.level}: Base Entry`;
      if (!isBase) {
        if (summaryTab === 'DOWNSIDE_DCA') {
          tierName = `Level ${lvl.level}: DCA Scale-In #${lvl.level - 1}`;
        } else {
          tierName = `Level ${lvl.level}: Trend Pyramid #${lvl.level - 1}`;
        }
      }

      return {
        level: lvl.level,
        tierName,
        isBase,
        milestonePrice: lvl.milestoneTriggerPrice,
        predictedPrice: lvl.targetEntryPrice,
        gapFromPrev: lvl.gapFromPrev,
        multiplierLabel: lvl.multiplierLabel,
        distancePts,
        distancePct,
        orderVolume: units,
        notionalValue: notional,
        marginRequired: marginReq,
        cumVolume: runningCumUnits,
        cumCost: runningCumCost,
        cumMargin: runningCumMargin,
        projectedAvgPrice,
      };
    });

    const firstPrice = rows[0]?.predictedPrice || 0;
    const lastPrice = rows[rows.length - 1]?.predictedPrice || 0;
    const priceRangeSpan = Math.abs(firstPrice - lastPrice);
    const priceRangePct = firstPrice > 0 ? (priceRangeSpan / firstPrice) * 100 : 0;

    return {
      rows,
      totalVolume: runningCumUnits,
      totalNotional: runningCumCost,
      totalMargin: runningCumMargin,
      finalAvgPrice: runningCumUnits > 0 ? runningCumCost / runningCumUnits : 0,
      priceRangeSpan,
      priceRangePct,
    };
  }, [summaryTab, downsideLevels, upsideLevels, lotSize, leverage, basePrice]);

  // 5. "What If" Simulation Fill Calculations
  const simulationResults = useMemo(() => {
    let filledCount = 0;
    let totalFilledUnits = 0;
    let totalCost = 0;
    let totalMargin = 0;
    const filledOrders: (typeof allOrders[0])[] = [];

    allOrders.forEach((order) => {
      const isFilled = isLong
        ? simulatedPrice <= order.targetEntryPrice
        : simulatedPrice >= order.targetEntryPrice;

      if (isFilled) {
        filledCount++;
        totalFilledUnits += lotSize;
        totalCost += order.targetEntryPrice * lotSize;
        totalMargin += (order.targetEntryPrice * lotSize) / leverage;
        filledOrders.push(order);
      }
    });

    const avgEntryPrice = totalFilledUnits > 0 ? totalCost / totalFilledUnits : 0;
    const unrealizedPnL = totalFilledUnits > 0
      ? (isLong ? (simulatedPrice - avgEntryPrice) : (avgEntryPrice - simulatedPrice)) * totalFilledUnits
      : 0;

    const pnlPercent = totalMargin > 0 ? (unrealizedPnL / totalMargin) * 100 : 0;

    return {
      filledCount,
      totalOrders: allOrders.length,
      totalFilledUnits,
      avgEntryPrice,
      totalCost,
      totalMargin,
      unrealizedPnL,
      pnlPercent,
      filledOrders,
    };
  }, [allOrders, simulatedPrice, isLong, lotSize, leverage]);

  // 6. Chart Dimensions and Coordinate Mapping
  const chartHeight = 360;
  const chartWidth = 620;
  const paddingY = 40;
  const paddingX = 70;

  const minPrice = useMemo(() => {
    const allPrices = [
      ...allOrders.map((o) => o.targetEntryPrice),
      ...allOrders.map((o) => o.milestoneTriggerPrice),
      simulatedPrice,
      livePrice,
      basePrice,
    ];
    const min = Math.min(...allPrices);
    return min - gridSpacing * 0.5;
  }, [allOrders, simulatedPrice, livePrice, basePrice, gridSpacing]);

  const maxPrice = useMemo(() => {
    const allPrices = [
      ...allOrders.map((o) => o.targetEntryPrice),
      ...allOrders.map((o) => o.milestoneTriggerPrice),
      simulatedPrice,
      livePrice,
      basePrice,
    ];
    const max = Math.max(...allPrices);
    return max + gridSpacing * 0.5;
  }, [allOrders, simulatedPrice, livePrice, basePrice, gridSpacing]);

  const priceToY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    const ratio = (price - minPrice) / range;
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const simPriceY = priceToY(simulatedPrice);
  const livePriceY = priceToY(livePrice);
  const basePriceY = priceToY(basePrice);

  return (
    <div className="space-y-4">
      {/* Top Controls Grid */}
      <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
        {/* Row A: Asset & Direction Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Asset Select */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Asset & Live Price
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            >
              {Object.values(assets).map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} (${a.price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Toggle */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Grid Order Direction
            </label>
            <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  side === 'BUY'
                    ? 'bg-emerald-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>BUY (Long)</span>
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  side === 'SELL'
                    ? 'bg-rose-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>SELL (Short)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row B: Multipliers & Key Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-neutral-900">
          {/* Base Anchor Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                Base ($P_0$)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBasePrice(livePrice);
                  setSimulatedPrice(livePrice);
                }}
                className="text-[9px] text-amber-400 hover:underline"
              >
                Live
              </button>
            </div>
            <input
              type="number"
              step="any"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || livePrice)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Grid Spacing (G) */}
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Grid Spacing ($G$)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={gridSpacing}
                onChange={(e) => setGridSpacing(parseFloat(e.target.value) || 50)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-1.5 top-1 text-[9px] text-neutral-500">pts</span>
            </div>
          </div>

          {/* Upside / Pyramiding Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Pyramiding Multiplier
              </label>
              <span className="text-[9px] text-emerald-400 font-mono">Def: 0.5x</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={upsideMultiplier}
                onChange={(e) => setUpsideMultiplier(parseFloat(e.target.value) || 0.5)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-1.5 top-1 text-[9px] text-neutral-500">x</span>
            </div>
            <span className="text-[9px] text-neutral-500 block mt-0.5">
              Trend gap: {isLong ? '+' : '-'}{(gridSpacing * upsideMultiplier).toFixed(1)} pts
            </span>
          </div>

          {/* Downside / Averaging Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                Averaging Multiplier
              </label>
              <span className="text-[9px] text-rose-400 font-mono">Def: 1.0x</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={downsideMultiplier}
                onChange={(e) => setDownsideMultiplier(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
              />
              <span className="absolute right-1.5 top-1 text-[9px] text-neutral-500">x</span>
            </div>
            <span className="text-[9px] text-neutral-500 block mt-0.5">
              Pullback gap: {isLong ? '-' : '+'}{(gridSpacing * downsideMultiplier).toFixed(1)} pts
            </span>
          </div>
        </div>

        {/* Row C: Levels Count, Offset, & Sizing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-neutral-900">
          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Entry Offset (±pts)
            </label>
            <input
              type="number"
              step="0.5"
              value={entryOffset}
              onChange={(e) => setEntryOffset(parseFloat(e.target.value) || 2.5)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Max Grid Levels ({maxLevels})
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={maxLevels}
              onChange={(e) => setMaxLevels(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 mt-1.5"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Size per Level ({selectedSymbol})
            </label>
            <input
              type="number"
              step="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.1)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
              Leverage Multiplier
            </label>
            <input
              type="number"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10) || 75)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPLICIT SUMMARY TABLE: Next 5 Levels Predicted Price & Estimated Volume */}
      {/* ========================================================================= */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
        {/* Table Header & Strategy Tab Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Table className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>Predicted Price Levels & Estimated Order Volume</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                  Next 5 Levels
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Formula: Pyramiding Gap = $G \times {upsideMultiplier}$ ({(gridSpacing * upsideMultiplier).toFixed(1)} pts) | Averaging Gap = $G \times {downsideMultiplier}$ ({(gridSpacing * downsideMultiplier).toFixed(1)} pts)
              </p>
            </div>
          </div>

          {/* Strategy Branch Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setSummaryTab('DOWNSIDE_DCA')}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                summaryTab === 'DOWNSIDE_DCA'
                  ? 'bg-rose-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Averaging DCA ({isLong ? 'Buy Dips -50pts' : 'Sell Rallies +50pts'})</span>
            </button>
            <button
              type="button"
              onClick={() => setSummaryTab('UPSIDE_PYRAMID')}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                summaryTab === 'UPSIDE_PYRAMID'
                  ? 'bg-emerald-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Pyramiding Trend ({isLong ? 'Pyramid Up +25pts' : 'Pyramid Down -25pts'})</span>
            </button>
          </div>
        </div>

        {/* 5-Level Summary Table */}
        <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-900/60">
          <table className="w-full text-left font-mono text-[11px] divide-y divide-neutral-800/80">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Grid Tier</th>
                <th className="py-2.5 px-3">Milestone</th>
                <th className="py-2.5 px-3 text-amber-300 font-bold">Predicted Trigger Price</th>
                <th className="py-2.5 px-3">Gap (pts)</th>
                <th className="py-2.5 px-3 text-white">Estimated Volume</th>
                <th className="py-2.5 px-3">Order Notional</th>
                <th className="py-2.5 px-3">Req. Margin ({leverage}x)</th>
                <th className="py-2.5 px-3 text-cyan-300 font-bold text-right">Projected Avg Price (P_avg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {next5LevelsSummary.rows.map((row, idx) => {
                const isBase = row.isBase;
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isBase ? 'bg-amber-950/15 font-medium' : ''
                    }`}
                  >
                    {/* Tier Name & Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBase
                              ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                              : summaryTab === 'DOWNSIDE_DCA'
                              ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.4)]'
                              : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                          }`}
                        />
                        <span className="font-bold text-white font-sans text-xs">
                          {row.tierName}
                        </span>
                      </div>
                    </td>

                    {/* Milestone Threshold */}
                    <td className="py-2 px-3 text-neutral-400 whitespace-nowrap">
                      ${row.milestonePrice.toFixed(2)}
                      <span className="text-[9px] text-neutral-500 block">
                        {row.multiplierLabel}
                      </span>
                    </td>

                    {/* Predicted Trigger Price */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-amber-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 inline-block">
                        ${row.predictedPrice.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">
                        {row.distancePts > 0
                          ? `${summaryTab === 'DOWNSIDE_DCA' ? (isLong ? '-' : '+') : (isLong ? '+' : '-')}${row.distancePts.toFixed(1)} pts (${row.distancePct.toFixed(2)}%)`
                          : 'Base Baseline'}
                      </span>
                    </td>

                    {/* Gap from Prev */}
                    <td className="py-2 px-3 text-neutral-300 whitespace-nowrap">
                      {row.gapFromPrev > 0 ? (
                        <span className="text-cyan-300 font-semibold">
                          {row.gapFromPrev.toFixed(1)} pts
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>

                    {/* Estimated Order Volume */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-white font-bold">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>{row.orderVolume.toFixed(3)} {selectedSymbol}</span>
                      </div>
                      <span className="text-[9px] text-neutral-500 block">
                        Cum: {row.cumVolume.toFixed(3)} {selectedSymbol}
                      </span>
                    </td>

                    {/* Order Notional */}
                    <td className="py-2 px-3 text-neutral-300 whitespace-nowrap">
                      ${row.notionalValue.toFixed(2)}
                      <span className="text-[9px] text-neutral-500 block">
                        Cum: ${row.cumCost.toFixed(0)}
                      </span>
                    </td>

                    {/* Margin Required */}
                    <td className="py-2 px-3 text-emerald-400 whitespace-nowrap font-medium">
                      ${row.marginRequired.toFixed(2)} USDT
                      <span className="text-[9px] text-neutral-500 block">
                        Cum: ${row.cumMargin.toFixed(2)}
                      </span>
                    </td>

                    {/* Projected Average Price */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-cyan-300 text-xs">
                        ${row.projectedAvgPrice.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-neutral-400 block">
                        {((row.projectedAvgPrice - basePrice) >= 0 ? '+' : '')}
                        {(row.projectedAvgPrice - basePrice).toFixed(1)} vs Base
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-neutral-950 font-bold border-t-2 border-neutral-800 text-xs">
                <td className="py-2.5 px-3 text-amber-400 font-sans uppercase">
                  5-Level Totals / Averages:
                </td>
                <td className="py-2.5 px-3 text-neutral-500">
                  5 Orders
                </td>
                <td className="py-2.5 px-3 text-neutral-300 text-[11px]">
                  Span: ±{next5LevelsSummary.priceRangeSpan.toFixed(1)} pts ({next5LevelsSummary.priceRangePct.toFixed(2)}%)
                </td>
                <td className="py-2.5 px-3 text-neutral-500">—</td>
                <td className="py-2.5 px-3 text-amber-300 font-bold">
                  {next5LevelsSummary.totalVolume.toFixed(3)} {selectedSymbol}
                </td>
                <td className="py-2.5 px-3 text-white">
                  ${next5LevelsSummary.totalNotional.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-emerald-400">
                  ${next5LevelsSummary.totalMargin.toFixed(2)} USDT
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                  ${next5LevelsSummary.finalAvgPrice.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 5-Level Strategy Insights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">
              Total 5-Level Capital Commitment
            </span>
            <span className="text-sm font-bold text-emerald-400">
              ${next5LevelsSummary.totalMargin.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              ${next5LevelsSummary.totalNotional.toFixed(0)} Notional @ {leverage}x
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">
              Total Order Volume Target
            </span>
            <span className="text-sm font-bold text-amber-300">
              {next5LevelsSummary.totalVolume.toFixed(3)} {selectedSymbol}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              Across 5 DCA grid levels
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">
              Projected 5-Level Avg Entry (P_avg)
            </span>
            <span className="text-sm font-bold text-cyan-300">
              ${next5LevelsSummary.finalAvgPrice.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              {(((next5LevelsSummary.finalAvgPrice - basePrice) / basePrice) * 100).toFixed(2)}% net displacement
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Preview Chart */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
        {/* Chart Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-neutral-200 text-sm">
              Visual Grid Order Preview Chart ({selectedSymbol})
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {allOrders.length} Planned Orders
            </span>
          </div>

          {/* View Filter buttons */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('BOTH')}
              className={`px-2 py-0.5 rounded ${viewMode === 'BOTH' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              All Levels
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DOWNSIDE')}
              className={`px-2 py-0.5 rounded ${viewMode === 'DOWNSIDE' ? 'bg-rose-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              DCA Pullback (Down)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('UPSIDE')}
              className={`px-2 py-0.5 rounded ${viewMode === 'UPSIDE' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
            >
              Pyramiding (Up)
            </button>
          </div>
        </div>

        {/* SVG Canvas Map */}
        <div className="relative bg-neutral-900/90 rounded-xl border border-neutral-800 overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-[320px] sm:h-[360px]"
            preserveAspectRatio="none"
          >
            {/* Background Grid Lines */}
            <defs>
              <linearGradient id="dcaZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="upZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Price axis background grid */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const y = chartHeight * ratio;
              return (
                <line
                  key={idx}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#262626"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* DCA Zone Shading (Below Base) */}
            <rect
              x="0"
              y={basePriceY}
              width={chartWidth}
              height={Math.max(0, chartHeight - basePriceY)}
              fill="url(#dcaZoneGrad)"
            />

            {/* Upside Momentum Zone Shading (Above Base) */}
            <rect
              x="0"
              y="0"
              width={chartWidth}
              height={Math.max(0, basePriceY)}
              fill="url(#upZoneGrad)"
            />

            {/* Render Horizontal Grid Order Lines */}
            {allOrders.map((order, idx) => {
              if (viewMode === 'DOWNSIDE' && !order.isDownside && order.level !== 1) return null;
              if (viewMode === 'UPSIDE' && order.isDownside) return null;

              const y = priceToY(order.targetEntryPrice);
              const isBase = order.level === 1;
              const isFilled = isLong
                ? simulatedPrice <= order.targetEntryPrice
                : simulatedPrice >= order.targetEntryPrice;

              const strokeColor = isBase
                ? '#f59e0b' // Amber for base
                : order.isDownside
                ? '#f43f5e' // Rose for DCA
                : '#10b981'; // Emerald for Pyramiding

              const isHovered = hoveredLevel?.targetEntryPrice === order.targetEntryPrice;

              return (
                <g
                  key={`ord-${idx}`}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredLevel(order)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  {/* Highlight bar on hover */}
                  {isHovered && (
                    <rect
                      x="0"
                      y={y - 12}
                      width={chartWidth}
                      height="24"
                      fill={strokeColor}
                      fillOpacity="0.15"
                    />
                  )}

                  {/* Level horizontal line */}
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - 10}
                    y2={y}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 2.5 : isBase ? 2 : 1.2}
                    strokeDasharray={isBase ? 'none' : '5 3'}
                  />

                  {/* Left-side Tag (Order # and Label) */}
                  <rect
                    x="8"
                    y={y - 9}
                    width={paddingX - 14}
                    height="18"
                    rx="4"
                    fill="#0a0a0a"
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  <text
                    x="12"
                    y={y + 3.5}
                    fill={strokeColor}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    #{order.level} {isBase ? 'BASE' : order.isDownside ? 'DCA' : 'UP'}
                  </text>

                  {/* Right-side Price Tag */}
                  <rect
                    x={chartWidth - 95}
                    y={y - 9}
                    width="88"
                    height="18"
                    rx="4"
                    fill={isFilled ? strokeColor : '#0a0a0a'}
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  <text
                    x={chartWidth - 51}
                    y={y + 3.5}
                    textAnchor="middle"
                    fill={isFilled ? '#000000' : strokeColor}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ${order.targetEntryPrice.toFixed(1)}
                  </text>

                  {/* Filled Checkmark Icon */}
                  {isFilled && (
                    <circle
                      cx={chartWidth - 102}
                      cy={y}
                      r="4"
                      fill="#10b981"
                    />
                  )}
                </g>
              );
            })}

            {/* Base Price Line Anchor Marker */}
            <line
              x1="0"
              y1={basePriceY}
              x2={chartWidth}
              y2={basePriceY}
              stroke="#eab308"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />

            {/* Live Current Price Line (Cyan Dashed) */}
            <line
              x1="0"
              y1={livePriceY}
              x2={chartWidth}
              y2={livePriceY}
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <rect
              x={chartWidth - 110}
              y={livePriceY - 8}
              width="100"
              height="16"
              rx="3"
              fill="#06b6d4"
            />
            <text
              x={chartWidth - 60}
              y={livePriceY + 3.5}
              textAnchor="middle"
              fill="#082f49"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              LIVE: ${livePrice.toFixed(1)}
            </text>

            {/* Simulated Test Price Line (Draggable Indicator) */}
            <line
              x1="0"
              y1={simPriceY}
              x2={chartWidth}
              y2={simPriceY}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="20" cy={simPriceY} r="5" fill="#ffffff" stroke="#000" strokeWidth="1.5" />
            <rect
              x="28"
              y={simPriceY - 9}
              width="105"
              height="18"
              rx="4"
              fill="#ffffff"
            />
            <text
              x="80"
              y={simPriceY + 3.5}
              textAnchor="middle"
              fill="#000000"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              TEST: ${simulatedPrice.toFixed(1)}
            </text>
          </svg>

          {/* Hover Details Card Overlay */}
          {hoveredLevel && (
            <div className="absolute top-3 left-3 bg-neutral-950/95 p-2.5 rounded-lg border border-neutral-700 shadow-xl text-xs font-mono max-w-xs pointer-events-none backdrop-blur-xs">
              <div className="font-bold text-amber-400 flex items-center justify-between border-b border-neutral-800 pb-1 mb-1">
                <span>{hoveredLevel.type === 'BASE' ? 'Base Order #1' : hoveredLevel.type === 'DCA_PULLBACK' ? `DCA Pullback Order #${hoveredLevel.level}` : `Pyramid Order #${hoveredLevel.level}`}</span>
                <span className="text-[10px] text-neutral-400">{hoveredLevel.direction}</span>
              </div>
              <div className="space-y-0.5 text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Milestone Threshold:</span>
                  <span className="font-bold text-white">${hoveredLevel.milestoneTriggerPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target Entry Trigger:</span>
                  <span className="font-bold text-amber-300">${hoveredLevel.targetEntryPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gap from Previous:</span>
                  <span className="text-cyan-300">{hoveredLevel.gapFromPrev > 0 ? `${hoveredLevel.gapFromPrev.toFixed(1)} pts` : 'Base (0 pts)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Offset from Base:</span>
                  <span className="text-neutral-200">{hoveredLevel.offsetFromBase > 0 ? `±${hoveredLevel.offsetFromBase.toFixed(1)} pts` : '0 pts'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-900 text-emerald-400">
                  <span>Margin Needed ({leverage}x):</span>
                  <span>${((hoveredLevel.targetEntryPrice * lotSize) / leverage).toFixed(2)} USDT</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive "What-If Price Slider" */}
        <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Market Price Movement: Drag to Test Order Fills</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-neutral-400">Simulated Price:</span>
              <strong className="text-white bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                ${simulatedPrice.toFixed(1)} ({(((simulatedPrice - basePrice) / basePrice) * 100).toFixed(2)}%)
              </strong>
              <button
                type="button"
                onClick={() => setSimulatedPrice(livePrice)}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={(maxPrice - minPrice) / 200}
            value={simulatedPrice}
            onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
          />

          {/* Quick Price Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-neutral-400">
            <span>Price Presets:</span>
            <div className="flex gap-1.5">
              {[-6, -3, 0, 3, 6].map((pct) => {
                const target = basePrice * (1 + pct / 100);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSimulatedPrice(target)}
                    className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
                  >
                    {pct > 0 ? `+${pct}%` : pct === 0 ? 'Base' : `${pct}%`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Simulation Outcome Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Fills Count */}
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">
              Orders Filled
            </span>
            <span className="text-base font-bold text-amber-300">
              {simulationResults.filledCount} / {simulationResults.totalOrders}
            </span>
            <span className="text-[10px] text-neutral-500 block">
              {(simulationResults.totalFilledUnits).toFixed(3)} {selectedSymbol} active
            </span>
          </div>

          {/* Weighted Avg Entry */}
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">
              Weighted Avg Entry (P_avg)
            </span>
            <span className="text-base font-bold text-white">
              {simulationResults.avgEntryPrice > 0 ? `$${simulationResults.avgEntryPrice.toFixed(2)}` : 'N/A'}
            </span>
            <span className="text-[10px] text-cyan-400 block">
              {simulationResults.avgEntryPrice > 0
                ? `${((simulatedPrice - simulationResults.avgEntryPrice) >= 0 ? '+' : '')}${(simulatedPrice - simulationResults.avgEntryPrice).toFixed(1)} pts diff`
                : 'No fills yet'}
            </span>
          </div>

          {/* Capital & Margin Locked */}
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono">
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">
              Margin Locked
            </span>
            <span className="text-base font-bold text-neutral-200">
              ${simulationResults.totalMargin.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-neutral-500 block">
              ${simulationResults.totalCost.toFixed(0)} Notional ({leverage}x)
            </span>
          </div>

          {/* Unrealized PnL at Simulated Price */}
          <div className={`p-2.5 rounded-xl border font-mono ${
            simulationResults.unrealizedPnL >= 0
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-950/20 border-rose-500/40 text-rose-400'
          }`}>
            <span className="text-[10px] text-neutral-400 uppercase block font-sans">
              Simulated Unrealized PnL
            </span>
            <span className="text-base font-bold">
              {simulationResults.unrealizedPnL >= 0 ? '+' : ''}${simulationResults.unrealizedPnL.toFixed(2)}
            </span>
            <span className="text-[10px] block">
              ROI: {simulationResults.unrealizedPnL >= 0 ? '+' : ''}{simulationResults.pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pre-Confirmation Grid Order Schedule Queue */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-neutral-200 text-sm">
              All Planned Order Tiers ({allOrders.length} Levels)
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Lot Size: <strong className="text-white">{lotSize} {selectedSymbol}</strong> | Spacing: <strong className="text-white">{gridSpacing} pts</strong>
          </span>
        </div>

        <div className="overflow-x-auto max-h-56 divide-y divide-neutral-800/80 border border-neutral-800 rounded-lg bg-neutral-900/50">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-900 text-neutral-400 text-[10px] uppercase sticky top-0">
              <tr>
                <th className="py-2 px-3">Tier</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Milestone</th>
                <th className="py-2 px-3 text-amber-300">Target Entry</th>
                <th className="py-2 px-3">Gap (pts)</th>
                <th className="py-2 px-3">Offset vs Base</th>
                <th className="py-2 px-3 text-right">Fill Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {allOrders.map((order, idx) => {
                const isBase = order.level === 1;
                const isFilled = isLong
                  ? simulatedPrice <= order.targetEntryPrice
                  : simulatedPrice >= order.targetEntryPrice;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-neutral-800/30 ${
                      isFilled ? 'bg-emerald-950/15' : isBase ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-1.5 px-3 font-bold text-white whitespace-nowrap">
                      {order.orderLabel}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isBase
                          ? 'bg-amber-500/20 text-amber-300'
                          : order.isDownside
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-neutral-400 whitespace-nowrap">
                      ${order.milestoneTriggerPrice.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-amber-300 whitespace-nowrap">
                      ${order.targetEntryPrice.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-cyan-300 whitespace-nowrap">
                      {order.gapFromPrev > 0 ? `${order.gapFromPrev.toFixed(1)} pts` : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-neutral-300 whitespace-nowrap">
                      {order.offsetFromBase > 0 ? `±${order.offsetFromBase.toFixed(1)} pts` : '0 pts'}
                    </td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      {isFilled ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          FILLED @ ${simulatedPrice.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Apply to Auto Grid Bot Button */}
      {onApplyConfigToBot && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Ready to Arm Grid with these Levels?</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
              Applies {selectedSymbol} {side} Grid (Upside: {upsideMultiplier}x [{(gridSpacing * upsideMultiplier).toFixed(1)} pts], Downside: {downsideMultiplier}x [{(gridSpacing * downsideMultiplier).toFixed(1)} pts], Spacing: {gridSpacing} pts) directly to the Auto Grid bot.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onApplyConfigToBot({
                  symbol: selectedSymbol,
                  side,
                  gridSpacing,
                  entryOffset,
                  upsideMultiplier,
                  downsideMultiplier,
                  basePriceAnchor: basePrice,
                });
                if (onClose) onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Apply to Auto Grid</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
