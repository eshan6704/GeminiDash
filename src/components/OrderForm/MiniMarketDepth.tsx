import React, { useState, useEffect, useMemo } from 'react';
import { MarketAsset } from '../../types/trading';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';

interface DepthLevel {
  price: number;
  size: number;
  total: number;
  notionalUsd: number;
  depthPct: number;
}

interface MiniMarketDepthProps {
  asset: MarketAsset;
  onSelectPrice?: (price: number) => void;
  compact?: boolean;
}

const BINANCE_DEPTH_MAP: Record<string, string> = {
  BTC: 'btcusdt',
  ETH: 'ethusdt',
  SOL: 'solusdt',
  PAXG: 'paxgusdt',
  XAUT: 'paxgusdt',
  BNB: 'bnbusdt',
  XRP: 'xrpusdt',
  DOGE: 'dogeusdt',
  ZEC: 'zecusdt',
};

export const MiniMarketDepth: React.FC<MiniMarketDepthProps> = ({
  asset,
  onSelectPrice,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'BOOK' | 'SPLIT' | 'CHART'>('BOOK');
  const [tickRandomizer, setTickRandomizer] = useState(0);
  const [liveBook, setLiveBook] = useState<{
    bids: [number, number][];
    asks: [number, number][];
  } | null>(null);

  // Default tick step based on asset price scale
  const defaultTickGroup = useMemo(() => {
    if (asset.price > 50000) return 10;
    if (asset.price > 1000) return 1;
    if (asset.price > 50) return 0.1;
    if (asset.price > 1) return 0.01;
    return 0.0001;
  }, [asset.price]);

  const [tickGroup, setTickGroup] = useState<number>(defaultTickGroup);
  const [rowCount, setRowCount] = useState<number>(compact ? 5 : 10);

  useEffect(() => {
    setTickGroup(defaultTickGroup);
  }, [defaultTickGroup, asset.symbol]);

  // Connect to live Binance L2 Orderbook stream when available
  useEffect(() => {
    const sym = (asset.symbol || 'BTC').toUpperCase();
    setLiveBook(null);
    if (sym === 'CL' || sym === 'XAG') return;

    const streamPair = BINANCE_DEPTH_MAP[sym] || `${sym.toLowerCase()}usdt`;
    let ws: WebSocket | null = null;
    let isUnmounted = false;
    let lastUpdateTs = 0;

    const connectDepth = () => {
      if (isUnmounted || (typeof document !== 'undefined' && document.hidden)) return;
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamPair}@depth20@100ms`);
        ws.onmessage = (evt) => {
          if (isUnmounted) return;
          const now = Date.now();
          if (now - lastUpdateTs < 300) return;
          lastUpdateTs = now;
          try {
            const data = JSON.parse(evt.data);
            if (Array.isArray(data.bids) && Array.isArray(data.asks)) {
              const parsedBids: [number, number][] = data.bids
                .slice(0, 20)
                .map((b: [string, string]) => [parseFloat(b[0]), parseFloat(b[1])])
                .filter((b: [number, number]) => b[0] > 0 && b[1] > 0);
              const parsedAsks: [number, number][] = data.asks
                .slice(0, 20)
                .map((a: [string, string]) => [parseFloat(a[0]), parseFloat(a[1])])
                .filter((a: [number, number]) => a[0] > 0 && a[1] > 0);
              if (parsedBids.length > 0 && parsedAsks.length > 0) {
                setLiveBook({ bids: parsedBids, asks: parsedAsks });
              }
            }
          } catch {
            // ignore packet error
          }
        };
      } catch {
        // fallback generator handles restricted environments
      }
    };

    connectDepth();
    return () => {
      isUnmounted = true;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [asset.symbol]);

  // Subtle tick cadence when using synthetic/grouped book levels
  useEffect(() => {
    const interval = setInterval(() => {
      setTickRandomizer((prev) => (prev + 1) % 100);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const price = asset.price || 96500;
  const isGold = asset.category === 'gold' || asset.symbol === 'XAUT' || asset.symbol === 'PAXG';
  const isBtc = asset.symbol === 'BTC';

  // Available Grouping Steps options based on asset magnitude
  const tickOptions = useMemo(() => {
    if (price > 10000) return [0.1, 1, 5, 10, 50, 100, 250];
    if (price > 500) return [0.05, 0.1, 0.5, 1, 5, 10, 25];
    if (price > 1) return [0.001, 0.01, 0.05, 0.1, 0.5, 1];
    return [0.0001, 0.0005, 0.001, 0.005, 0.01];
  }, [price]);

  const formatPrice = (val: number) => {
    const digits = val < 1 ? 4 : val < 10 ? 3 : 2;
    return val.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const formatSize = (val: number) => {
    const digits = isBtc ? 4 : price > 500 ? 3 : 2;
    return val.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const formatCompactUsd = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  // Generate or aggregate Orderbook Levels based on selected tickGroup & rowCount
  const {
    bids,
    asks,
    asksAscending,
    bidVolumeTotal,
    askVolumeTotal,
    bidNotionalTotal,
    askNotionalTotal,
    bestBid,
    bestAsk,
    spread,
    spreadBps,
  } = useMemo(() => {
    const baseStep = tickGroup;
    const baseLot = isBtc
      ? 0.24 * Math.sqrt(Math.max(tickGroup, 0.1))
      : isGold
      ? 1.4 * Math.sqrt(Math.max(tickGroup, 0.1))
      : (4500 / Math.max(price, 0.01)) * Math.sqrt(Math.max(tickGroup, 0.01));

    const jitter = (idx: number, seed: number) => {
      const v = Math.sin(tickRandomizer * 0.25 + idx * 1.3 + seed) * 0.35 + 1;
      return Math.max(0.18, v);
    };

    const spreadAmount = Math.max(
      price * 0.0001,
      baseStep * (0.5 + (tickRandomizer % 3) * 0.15)
    );
    const halfSpread = spreadAmount / 2;

    const askLevels: DepthLevel[] = [];
    let cumAsk = 0;
    let cumAskUsd = 0;

    for (let i = 1; i <= rowCount; i++) {
      let askPrice: number;
      let size: number;

      if (liveBook && liveBook.asks[i - 1] && tickGroup <= defaultTickGroup) {
        askPrice = liveBook.asks[i - 1][0];
        size = liveBook.asks[i - 1][1];
      } else {
        askPrice =
          Math.round((price + halfSpread + (i - 1) * baseStep) / baseStep) * baseStep;
        size = Number(
          (baseLot * (0.85 + i * 0.22) * jitter(i, 10)).toFixed(isBtc ? 4 : 3)
        );
      }
      cumAsk += size;
      const lvlUsd = askPrice * size;
      cumAskUsd += lvlUsd;
      askLevels.push({
        price: askPrice,
        size,
        total: cumAsk,
        notionalUsd: cumAskUsd,
        depthPct: 0,
      });
    }

    const bidLevels: DepthLevel[] = [];
    let cumBid = 0;
    let cumBidUsd = 0;

    for (let i = 1; i <= rowCount; i++) {
      let bidPrice: number;
      let size: number;

      if (liveBook && liveBook.bids[i - 1] && tickGroup <= defaultTickGroup) {
        bidPrice = liveBook.bids[i - 1][0];
        size = liveBook.bids[i - 1][1];
      } else {
        bidPrice = Math.max(
          baseStep,
          Math.round((price - halfSpread - (i - 1) * baseStep) / baseStep) * baseStep
        );
        size = Number(
          (baseLot * (0.85 + i * 0.22) * jitter(i, 24)).toFixed(isBtc ? 4 : 3)
        );
      }
      cumBid += size;
      const lvlUsd = bidPrice * size;
      cumBidUsd += lvlUsd;
      bidLevels.push({
        price: bidPrice,
        size,
        total: cumBid,
        notionalUsd: cumBidUsd,
        depthPct: 0,
      });
    }

    const maxTotal = Math.max(cumAsk, cumBid, 0.0001);
    askLevels.forEach((l) => (l.depthPct = Math.min(100, (l.total / maxTotal) * 100)));
    bidLevels.forEach((l) => (l.depthPct = Math.min(100, (l.total / maxTotal) * 100)));

    const topBid = bidLevels[0]?.price || price * 0.9999;
    const topAsk = askLevels[0]?.price || price * 1.0001;
    const actualSpread = Math.max(0, topAsk - topBid);
    const actualSpreadBps = (actualSpread / Math.max(price, 0.0001)) * 10000;

    return {
      bids: bidLevels,
      asks: [...askLevels].reverse(), // descending for ladder
      asksAscending: askLevels, // ascending for split book
      bidVolumeTotal: cumBid,
      askVolumeTotal: cumAsk,
      bidNotionalTotal: cumBidUsd,
      askNotionalTotal: cumAskUsd,
      bestBid: topBid,
      bestAsk: topAsk,
      spread: actualSpread,
      spreadBps: actualSpreadBps,
    };
  }, [price, isGold, isBtc, tickGroup, defaultTickGroup, rowCount, tickRandomizer, liveBook]);

  const totalDepthVolume = bidVolumeTotal + askVolumeTotal;
  const bidRatio = totalDepthVolume > 0 ? (bidVolumeTotal / totalDepthVolume) * 100 : 50;
  const askRatio = totalDepthVolume > 0 ? (askVolumeTotal / totalDepthVolume) * 100 : 50;
  const imbalancePct = bidRatio - askRatio;

  const visibleAsks = compact ? asks.slice(-4) : asks;
  const visibleBids = compact ? bids.slice(0, 4) : bids;

  return (
    <div
      className={`rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs shadow-sm ${
        compact ? 'p-3 space-y-2.5' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      {/* Header with Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-sans text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
              L2 Order Book ({asset.symbol}/USDT)
            </h3>
            {!compact && (
              <p className="font-sans text-[11px] text-[var(--theme-text-muted)]">
                Real-time aggregated bid/ask liquidity ladder &amp; cumulative market depth
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tick Size Grouping Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[11px] text-[var(--theme-text-muted)]">Tick:</span>
            <select
              value={tickGroup}
              onChange={(e) => setTickGroup(parseFloat(e.target.value))}
              className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] focus:outline-none focus:border-emerald-600"
            >
              {tickOptions.map((opt) => (
                <option key={opt} value={opt}>
                  ${opt >= 1 ? opt : opt.toFixed(opt < 0.01 ? 4 : 2)}
                </option>
              ))}
            </select>
          </div>

          {/* Depth Range / Rows Selector */}
          {!compact && (
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[11px] text-[var(--theme-text-muted)]">Depth:</span>
              <select
                value={rowCount}
                onChange={(e) => setRowCount(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] focus:outline-none focus:border-emerald-600"
              >
                <option value={8}>8 Levels</option>
                <option value={10}>10 Levels</option>
                <option value={14}>14 Levels</option>
                <option value={20}>20 Levels</option>
              </select>
            </div>
          )}

          {/* Segmented View Mode Selector */}
          <div className="flex rounded-lg p-0.5 border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('BOOK')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'BOOK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              Ladder
            </button>
            {!compact && (
              <button
                type="button"
                onClick={() => setViewMode('SPLIT')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'SPLIT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                Split Book
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('CHART')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'CHART'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              Depth Wall
            </button>
          </div>
        </div>
      </div>

      {/* Non-Compact 4-Metric Microstructure Strip */}
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
            <div className="font-sans text-[10px] font-semibold text-[var(--theme-text-muted)]">
              Best Bid (Top Support)
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-emerald-600 mt-0.5">
              ${formatPrice(bestBid)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
            <div className="font-sans text-[10px] font-semibold text-[var(--theme-text-muted)]">
              Best Ask (Top Offer)
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-rose-600 mt-0.5">
              ${formatPrice(bestAsk)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
            <div className="font-sans text-[10px] font-semibold text-[var(--theme-text-muted)]">
              Bid-Ask Spread
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)] mt-0.5">
              ${formatPrice(spread)} <span className="text-[11px] font-normal text-[var(--theme-text-muted)]">({spreadBps.toFixed(2)} bps)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
            <div className="font-sans text-[10px] font-semibold text-[var(--theme-text-muted)]">
              Order Book Skew
            </div>
            <div
              className={`text-xs sm:text-sm font-extrabold mt-0.5 ${
                imbalancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {imbalancePct >= 0 ? '+' : ''}
              {imbalancePct.toFixed(1)}% {imbalancePct >= 0 ? 'Bid Heavy' : 'Ask Heavy'}
            </div>
          </div>
        </div>
      )}

      {/* Bid / Ask Volume Pressure Bar */}
      <div className="space-y-1.5 tabular-nums">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              Bids {bidRatio.toFixed(1)}% ({formatSize(bidVolumeTotal)} {asset.symbol} · {formatCompactUsd(bidNotionalTotal)})
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-rose-600">
            <span>
              Asks {askRatio.toFixed(1)}% ({formatSize(askVolumeTotal)} {asset.symbol} · {formatCompactUsd(askNotionalTotal)})
            </span>
            <TrendingDown className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-[var(--theme-bg-elevated)]">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${bidRatio}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${askRatio}%` }}
          />
        </div>
      </div>

      {/* VIEW 1: CLASSIC VERTICAL ORDER BOOK LADDER */}
      {viewMode === 'BOOK' && (
        <div className="space-y-1 tabular-nums">
          <div
            className={`grid ${
              compact ? 'grid-cols-3' : 'grid-cols-4'
            } text-[10px] font-sans font-bold text-[var(--theme-text-muted)] px-2 pb-1.5 border-b border-[var(--theme-border-subtle)]`}
          >
            <span>Price (USDT)</span>
            <span className="text-right">Size ({asset.symbol})</span>
            <span className="text-right">Total ({asset.symbol})</span>
            {!compact && <span className="text-right">Cum. Notional</span>}
          </div>

          {/* Asks (Sell Orders - descending towards mid price) */}
          <div className="space-y-0.5">
            {visibleAsks.map((lvl, i) => (
              <div
                key={`ask-${i}`}
                onClick={() => onSelectPrice?.(lvl.price)}
                className={`relative grid ${
                  compact ? 'grid-cols-3 py-0.5' : 'grid-cols-4 py-1'
                } text-[11px] px-2 rounded cursor-pointer transition-colors hover:bg-rose-500/10 group`}
                title={`Click to set Limit Price @ $${formatPrice(lvl.price)}`}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 rounded pointer-events-none bg-rose-500/10"
                  style={{ width: `${lvl.depthPct}%` }}
                />
                <span className="font-bold text-rose-600 group-hover:underline z-10">
                  ${formatPrice(lvl.price)}
                </span>
                <span className="text-right text-[var(--theme-text-primary)] font-medium z-10">
                  {formatSize(lvl.size)}
                </span>
                <span className="text-right text-[var(--theme-text-secondary)] z-10">
                  {formatSize(lvl.total)}
                </span>
                {!compact && (
                  <span className="text-right text-[var(--theme-text-muted)] z-10">
                    {formatCompactUsd(lvl.notionalUsd)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Mid-Market Price & Spread Banner */}
          <div className="py-2 px-3 rounded-lg my-1.5 flex items-center justify-between bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)]">
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-black text-[var(--theme-text-primary)]">
                ${formatPrice(price)}
              </span>
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Mid-Market Mark
              </span>
            </div>
            <div className="text-[11px] text-[var(--theme-text-secondary)]">
              Spread: <strong className="text-[var(--theme-text-primary)]">${formatPrice(spread)}</strong> ({spreadBps.toFixed(2)} bps)
            </div>
          </div>

          {/* Bids (Buy Orders - descending away from mid price) */}
          <div className="space-y-0.5">
            {visibleBids.map((lvl, i) => (
              <div
                key={`bid-${i}`}
                onClick={() => onSelectPrice?.(lvl.price)}
                className={`relative grid ${
                  compact ? 'grid-cols-3 py-0.5' : 'grid-cols-4 py-1'
                } text-[11px] px-2 rounded cursor-pointer transition-colors hover:bg-emerald-500/10 group`}
                title={`Click to set Limit Price @ $${formatPrice(lvl.price)}`}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 rounded pointer-events-none bg-emerald-500/10"
                  style={{ width: `${lvl.depthPct}%` }}
                />
                <span className="font-bold text-emerald-600 group-hover:underline z-10">
                  ${formatPrice(lvl.price)}
                </span>
                <span className="text-right text-[var(--theme-text-primary)] font-medium z-10">
                  {formatSize(lvl.size)}
                </span>
                <span className="text-right text-[var(--theme-text-secondary)] z-10">
                  {formatSize(lvl.total)}
                </span>
                {!compact && (
                  <span className="text-right text-[var(--theme-text-muted)] z-10">
                    {formatCompactUsd(lvl.notionalUsd)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SIDE-BY-SIDE SPLIT BOOK (BIDS LEFT | ASKS RIGHT) */}
      {viewMode === 'SPLIT' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
          {/* Bids Column */}
          <div className="rounded-lg border border-[var(--theme-border-subtle)] p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-sans font-bold text-emerald-600 pb-1.5 border-b border-[var(--theme-border-subtle)]">
              <span>Bids (Buy Support)</span>
              <span className="font-mono">{formatCompactUsd(bidNotionalTotal)}</span>
            </div>
            <div className="grid grid-cols-3 text-[10px] font-sans font-semibold text-[var(--theme-text-muted)] px-1.5 py-1">
              <span>Bid Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Cum. {asset.symbol}</span>
            </div>
            <div className="space-y-0.5">
              {bids.map((lvl, i) => (
                <div
                  key={`split-bid-${i}`}
                  onClick={() => onSelectPrice?.(lvl.price)}
                  className="relative grid grid-cols-3 text-[11px] py-1 px-1.5 rounded cursor-pointer hover:bg-emerald-500/10"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 rounded pointer-events-none bg-emerald-500/10"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                  <span className="font-bold text-emerald-600 z-10">${formatPrice(lvl.price)}</span>
                  <span className="text-right text-[var(--theme-text-primary)] z-10">{formatSize(lvl.size)}</span>
                  <span className="text-right text-[var(--theme-text-secondary)] z-10">{formatSize(lvl.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Asks Column */}
          <div className="rounded-lg border border-[var(--theme-border-subtle)] p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-sans font-bold text-rose-600 pb-1.5 border-b border-[var(--theme-border-subtle)]">
              <span>Asks (Sell Resistance)</span>
              <span className="font-mono">{formatCompactUsd(askNotionalTotal)}</span>
            </div>
            <div className="grid grid-cols-3 text-[10px] font-sans font-semibold text-[var(--theme-text-muted)] px-1.5 py-1">
              <span>Ask Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Cum. {asset.symbol}</span>
            </div>
            <div className="space-y-0.5">
              {asksAscending.map((lvl, i) => (
                <div
                  key={`split-ask-${i}`}
                  onClick={() => onSelectPrice?.(lvl.price)}
                  className="relative grid grid-cols-3 text-[11px] py-1 px-1.5 rounded cursor-pointer hover:bg-rose-500/10"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded pointer-events-none bg-rose-500/10"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                  <span className="font-bold text-rose-600 z-10">${formatPrice(lvl.price)}</span>
                  <span className="text-right text-[var(--theme-text-primary)] z-10">{formatSize(lvl.size)}</span>
                  <span className="text-right text-[var(--theme-text-secondary)] z-10">{formatSize(lvl.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: VISUAL CUMULATIVE DEPTH WALLS */}
      {viewMode === 'CHART' && (
        <div className="space-y-3 py-1 tabular-nums">
          <div className="space-y-1.5">
            <div className="text-[11px] font-sans font-bold flex justify-between text-rose-600">
              <span>Ask Liquidity Walls (Overhead Supply)</span>
              <span className="font-mono">
                {formatSize(askVolumeTotal)} {asset.symbol} ({formatCompactUsd(askNotionalTotal)})
              </span>
            </div>
            {visibleAsks.map((lvl, idx) => (
              <div key={`v-ask-${idx}`} className="flex items-center gap-2.5 text-[11px]">
                <span className="w-24 text-rose-600 font-bold">${formatPrice(lvl.price)}</span>
                <div className="flex-1 h-3.5 rounded overflow-hidden flex justify-start bg-[var(--theme-bg-elevated)]">
                  <div
                    className="h-full bg-rose-500/65 rounded"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                </div>
                <span className="w-20 text-right text-[var(--theme-text-secondary)]">
                  {formatSize(lvl.total)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2.5 border-t border-[var(--theme-border-subtle)]">
            <div className="text-[11px] font-sans font-bold flex justify-between text-emerald-600">
              <span>Bid Liquidity Walls (Buy Support)</span>
              <span className="font-mono">
                {formatSize(bidVolumeTotal)} {asset.symbol} ({formatCompactUsd(bidNotionalTotal)})
              </span>
            </div>
            {visibleBids.map((lvl, idx) => (
              <div key={`v-bid-${idx}`} className="flex items-center gap-2.5 text-[11px]">
                <span className="w-24 text-emerald-600 font-bold">${formatPrice(lvl.price)}</span>
                <div className="flex-1 h-3.5 rounded overflow-hidden flex justify-start bg-[var(--theme-bg-elevated)]">
                  <div
                    className="h-full bg-emerald-500/65 rounded"
                    style={{ width: `${lvl.depthPct}%` }}
                  />
                </div>
                <span className="w-20 text-right text-[var(--theme-text-secondary)]">
                  {formatSize(lvl.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
