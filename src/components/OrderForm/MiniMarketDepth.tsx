import React, { useState, useEffect, useMemo } from 'react';
import { MarketAsset } from '../../types/trading';
import { Layers, TrendingUp, TrendingDown, ArrowUpDown, BarChart2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DepthLevel {
  price: number;
  size: number;
  total: number;
  depthPct: number;
}

interface MiniMarketDepthProps {
  asset: MarketAsset;
  onSelectPrice?: (price: number) => void;
  compact?: boolean;
}

export const MiniMarketDepth: React.FC<MiniMarketDepthProps> = ({
  asset,
  onSelectPrice,
  compact = false,
}) => {
  const { isLight } = useTheme();
  const [viewMode, setViewMode] = useState<'BOOK' | 'CHART'>('BOOK');
  const [tickRandomizer, setTickRandomizer] = useState(0);

  // Default tick step based on asset price scale
  const defaultTickGroup = useMemo(() => {
    if (asset.price > 50000) return 10;
    if (asset.price > 1000) return 1;
    if (asset.price > 50) return 0.1;
    return 0.01;
  }, [asset.price]);

  const [tickGroup, setTickGroup] = useState<number>(defaultTickGroup);
  const [rowCount, setRowCount] = useState<number>(compact ? 5 : 8);

  useEffect(() => {
    setTickGroup(defaultTickGroup);
  }, [defaultTickGroup]);

  // Subtle tick simulation to mimic live exchange orderbook fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickRandomizer((prev) => (prev + 1) % 100);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const price = asset.price;
  const isGold = asset.category === 'gold' || asset.symbol === 'XAUT' || asset.symbol === 'PAXG';
  const isBtc = asset.symbol === 'BTC';

  // Available Grouping Steps options based on asset magnitude
  const tickOptions = useMemo(() => {
    if (price > 10000) return [0.1, 1, 5, 10, 50, 100, 250];
    if (price > 500) return [0.05, 0.1, 0.5, 1, 5, 10, 25];
    return [0.001, 0.01, 0.05, 0.1, 0.5, 1];
  }, [price]);

  // Generate Grouped Orderbook Levels based on selected tickGroup & rowCount
  const { bids, asks, bidVolumeTotal, askVolumeTotal, spread, spreadPct } = useMemo(() => {
    const baseStep = tickGroup;
    const baseLot = isBtc ? 0.2 * Math.sqrt(tickGroup) : isGold ? 1.2 * Math.sqrt(tickGroup) : 15 * Math.sqrt(tickGroup);

    const jitter = (idx: number, seed: number) => {
      const v = Math.sin(tickRandomizer * 0.2 + idx + seed) * 0.25 + 1;
      return Math.max(0.2, v);
    };

    const spreadAmount = baseStep * (1 + (tickRandomizer % 2) * 0.1);
    const halfSpread = spreadAmount / 2;

    const askLevels: DepthLevel[] = [];
    let cumAsk = 0;
    for (let i = 1; i <= rowCount; i++) {
      const askPrice = Math.round((price + halfSpread + (i - 1) * baseStep) / baseStep) * baseStep;
      const size = Number((baseLot * (1 + i * 0.25) * jitter(i, 10)).toFixed(isBtc ? 4 : isGold ? 2 : 2));
      cumAsk += size;
      askLevels.push({ price: askPrice, size, total: cumAsk, depthPct: 0 });
    }

    const bidLevels: DepthLevel[] = [];
    let cumBid = 0;
    for (let i = 1; i <= rowCount; i++) {
      const bidPrice = Math.max(baseStep, Math.round((price - halfSpread - (i - 1) * baseStep) / baseStep) * baseStep);
      const size = Number((baseLot * (1 + i * 0.25) * jitter(i, 20)).toFixed(isBtc ? 4 : isGold ? 2 : 2));
      cumBid += size;
      bidLevels.push({ price: bidPrice, size, total: cumBid, depthPct: 0 });
    }

    const maxTotal = Math.max(cumAsk, cumBid, 1);
    askLevels.forEach((l) => (l.depthPct = Math.min(100, (l.total / maxTotal) * 100)));
    bidLevels.forEach((l) => (l.depthPct = Math.min(100, (l.total / maxTotal) * 100)));

    return {
      bids: bidLevels,
      asks: [...askLevels].reverse(),
      bidVolumeTotal: cumBid,
      askVolumeTotal: cumAsk,
      spread: spreadAmount,
      spreadPct: (spreadAmount / price) * 100,
    };
  }, [price, isGold, isBtc, tickGroup, rowCount, tickRandomizer]);

  const totalDepthVolume = bidVolumeTotal + askVolumeTotal;
  const bidRatio = totalDepthVolume > 0 ? (bidVolumeTotal / totalDepthVolume) * 100 : 50;
  const askRatio = totalDepthVolume > 0 ? (askVolumeTotal / totalDepthVolume) * 100 : 50;

  return (
    <div
      className={`rounded-xl border p-2.5 font-mono text-xs transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-neutral-950/90 border-neutral-800/80 text-neutral-100'
      }`}
    >
      {/* Header with Title & Imbalance Ratio */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-800/60">
        <div className={`flex items-center gap-1.5 font-semibold text-[11px] ${isLight ? 'text-slate-900' : 'text-neutral-300'}`}>
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>Market Depth ({asset.symbol})</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tick Size Grouping Selector */}
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Group:</span>
            <select
              value={tickGroup}
              onChange={(e) => setTickGroup(parseFloat(e.target.value))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border focus:outline-none focus:border-amber-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-amber-300 font-bold'
              }`}
            >
              {tickOptions.map((opt) => (
                <option key={opt} value={opt}>
                  ${opt >= 1 ? opt : opt.toFixed(opt < 0.01 ? 3 : 2)}
                </option>
              ))}
            </select>
          </div>

          {/* Depth Range / Rows Selector */}
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Range:</span>
            <select
              value={rowCount}
              onChange={(e) => setRowCount(parseInt(e.target.value, 10))}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border focus:outline-none focus:border-amber-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            >
              <option value={5}>5 Rows</option>
              <option value={8}>8 Rows</option>
              <option value={12}>12 Rows (Wide)</option>
              <option value={20}>20 Rows (Deep)</option>
            </select>
          </div>

          {/* Toggle Book / Depth Chart */}
          <div
            className={`flex rounded p-0.5 border text-[10px] ${
              isLight ? 'bg-white border-slate-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('BOOK')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                viewMode === 'BOOK'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                    : 'bg-neutral-800 text-amber-300 font-semibold'
                  : isLight
                  ? 'text-slate-500'
                  : 'text-neutral-500'
              }`}
            >
              Ladder
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CHART')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                viewMode === 'CHART'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                    : 'bg-neutral-800 text-amber-300 font-semibold'
                  : isLight
                  ? 'text-slate-500'
                  : 'text-neutral-500'
              }`}
            >
              Visual
            </button>
          </div>
        </div>
      </div>

      {/* Bid / Ask Volume Pressure Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span className={`flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            <TrendingUp className="w-3 h-3" />
            Bids: {bidRatio.toFixed(1)}% ({bidVolumeTotal.toFixed(isBtc ? 3 : 1)} {isGold ? 'oz' : ''})
          </span>
          <span className={`flex items-center gap-1 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
            Asks: {askRatio.toFixed(1)}% ({askVolumeTotal.toFixed(isBtc ? 3 : 1)} {isGold ? 'oz' : ''})
            <TrendingDown className="w-3 h-3" />
          </span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden flex ${isLight ? 'bg-slate-200' : 'bg-neutral-900'}`}>
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${bidRatio}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${askRatio}%` }}
          />
        </div>
      </div>

      {/* View 1: Order Book Ladder */}
      {viewMode === 'BOOK' ? (
        <div className="space-y-1">
          <div
            className={`grid grid-cols-3 text-[9px] font-semibold uppercase tracking-wider px-1 pb-1 border-b ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-neutral-800/60 text-neutral-500'
            }`}
          >
            <span>Price (USDT)</span>
            <span className="text-right">Size ({isGold ? 'oz' : 'lots'})</span>
            <span className="text-right">Total Depth</span>
          </div>

          {/* Asks (Sell Orders - descending) */}
          <div className="space-y-0.5">
            {asks.slice(compact ? 2 : 0).map((lvl, i) => (
              <div
                key={`ask-${i}`}
                onClick={() => onSelectPrice?.(lvl.price)}
                className={`relative grid grid-cols-3 text-[10px] py-0.5 px-1 rounded cursor-pointer transition-colors group ${
                  isLight ? 'hover:bg-rose-100/60' : 'hover:bg-rose-950/30'
                }`}
                title={`Click to set Limit Sell @ $${lvl.price.toFixed(price < 10 ? 4 : 2)}`}
              >
                <div
                  className={`absolute right-0 top-0 bottom-0 rounded pointer-events-none ${
                    isLight ? 'bg-rose-500/15' : 'bg-rose-500/10'
                  }`}
                  style={{ width: `${lvl.depthPct}%` }}
                />
                <span className={`font-semibold group-hover:underline z-10 ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                  ${lvl.price.toFixed(price < 10 ? 4 : 2)}
                </span>
                <span className={`text-right z-10 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>{lvl.size}</span>
                <span className={`text-right z-10 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>{lvl.total.toFixed(isBtc ? 3 : 1)}</span>
              </div>
            ))}
          </div>

          {/* Mid Market Spread Bar */}
          <div
            className={`py-1 px-1.5 rounded my-1 flex items-center justify-between text-[11px] font-bold border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>${price.toLocaleString('en-US', { minimumFractionDigits: price < 10 ? 4 : 2, maximumFractionDigits: price < 10 ? 4 : 2 })}</span>
              <span className={`text-[9px] font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Mid</span>
            </span>
            <span className="text-[10px] font-mono text-amber-600">
              Shark Match Engine
            </span>
          </div>

          {/* Bids (Buy Orders - ascending) */}
          <div className="space-y-0.5">
            {bids.slice(0, compact ? 3 : 5).map((lvl, i) => (
              <div
                key={`bid-${i}`}
                onClick={() => onSelectPrice?.(lvl.price)}
                className={`relative grid grid-cols-3 text-[10px] py-0.5 px-1 rounded cursor-pointer transition-colors group ${
                  isLight ? 'hover:bg-emerald-100/60' : 'hover:bg-emerald-950/30'
                }`}
                title={`Click to set Limit Buy @ $${lvl.price.toFixed(price < 10 ? 4 : 2)}`}
              >
                <div
                  className={`absolute right-0 top-0 bottom-0 rounded pointer-events-none ${
                    isLight ? 'bg-emerald-500/15' : 'bg-emerald-500/10'
                  }`}
                  style={{ width: `${lvl.depthPct}%` }}
                />
                <span className={`font-semibold group-hover:underline z-10 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  ${lvl.price.toFixed(price < 10 ? 4 : 2)}
                </span>
                <span className={`text-right z-10 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>{lvl.size}</span>
                <span className={`text-right z-10 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>{lvl.total.toFixed(isBtc ? 3 : 1)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* View 2: Visual Cumulative Depth Area Bars */
        <div className="space-y-2 py-1">
          <div className="space-y-1">
            <div className={`text-[10px] font-bold flex justify-between ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              <span>Ask Liquidity Walls (Resistance)</span>
              <span>{askVolumeTotal.toFixed(isBtc ? 3 : 1)} {asset.symbol}</span>
            </div>
            {asks.slice(compact ? 2 : 0).map((lvl, idx) => (
              <div key={`v-ask-${idx}`} className="flex items-center gap-2 text-[10px]">
                <span className={`w-16 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>${lvl.price.toFixed(1)}</span>
                <div className={`flex-1 h-3 rounded overflow-hidden flex justify-start ${isLight ? 'bg-slate-200' : 'bg-neutral-900'}`}>
                  <div
                    className="h-full bg-rose-500/60 transition-all duration-300 rounded"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                </div>
                <span className={`w-12 text-right ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{lvl.total.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-1 border-t border-dashed border-slate-300 dark:border-neutral-800">
            <div className={`text-[10px] font-bold flex justify-between ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <span>Bid Liquidity Walls (Support)</span>
              <span>{bidVolumeTotal.toFixed(isBtc ? 3 : 1)} {asset.symbol}</span>
            </div>
            {bids.slice(0, compact ? 3 : 5).map((lvl, idx) => (
              <div key={`v-bid-${idx}`} className="flex items-center gap-2 text-[10px]">
                <span className={`w-16 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>${lvl.price.toFixed(1)}</span>
                <div className={`flex-1 h-3 rounded overflow-hidden flex justify-start ${isLight ? 'bg-slate-200' : 'bg-neutral-900'}`}>
                  <div
                    className="h-full bg-emerald-500/60 transition-all duration-300 rounded"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                </div>
                <span className={`w-12 text-right ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{lvl.total.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`pt-1.5 mt-1 border-t flex items-center justify-between text-[9px] ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-500'
        }`}
      >
        <span>Click price level to populate Limit Order</span>
        <span>0.016% Maker / 0.064% Taker</span>
      </div>
    </div>
  );
};
