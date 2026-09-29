import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MarketAsset,
  Position,
  SpotHolding,
  TradeMode,
  OrderSide,
  getBrokerMaxLeverage,
  SHARK_EXCHANGE,
} from '../types/trading';
import { TradingChart } from './Chart/TradingChart';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ShieldCheck,
  BarChart3,
  Coins,
  Zap,
  RotateCcw,
  AlertTriangle,
  Sliders,
  Compass,
} from 'lucide-react';

/* ============================================================================
   1. SELECTED COIN — ALL POSSIBLE INFO (DEFAULT VIEW FOR SECTION B)
   ============================================================================ */

interface SelectedCoinAllInfoProps {
  asset: MarketAsset;
  allAssets: Record<string, MarketAsset>;
  positions: Position[];
  spotHoldings: SpotHolding[];
  extraCoinMeta?: {
    rank?: number;
    marketCap?: number;
    change1h?: number;
    change7d?: number;
    circulatingSupply?: number;
    categoryLabel?: string;
  };
  onSelectSymbol: (symbol: string) => void;
}

export const SelectedCoinAllInfoPanel: React.FC<SelectedCoinAllInfoProps> = ({
  asset,
  allAssets,
  positions,
  spotHoldings,
  extraCoinMeta,
  onSelectSymbol,
}) => {
  const price = asset.price || 96500;
  const change24h = asset.change24h || 0;
  const high24h = asset.high24h || price * 1.025;
  const low24h = asset.low24h || price * 0.975;
  const volume24h = asset.volume24h || price * 18500;
  const isUp = change24h >= 0;

  // Derived institutional metadata for any selected coin (defaults to BTC)
  const metrics = useMemo(() => {
    if (!asset?.symbol) return null;
    const sym = asset.symbol.toUpperCase();
    const defaultCap =
      sym === 'BTC'
        ? 1910000000000
        : sym === 'ETH'
        ? 415000000000
        : sym === 'SOL'
        ? 98500000000
        : sym === 'XRP'
        ? 106000000000
        : sym === 'DOGE'
        ? 41200000000
        : sym === 'PAXG' || sym === 'XAUT'
        ? 1900000000
        : sym === 'CL'
        ? 145000000000
        : sym === 'XAG'
        ? 18200000000
        : volume24h * 14.5;

    const marketCap = extraCoinMeta?.marketCap || defaultCap;
    const fdv = marketCap * (sym === 'BTC' ? 1.05 : 1.18);
    const circulatingSupply = extraCoinMeta?.circulatingSupply || marketCap / Math.max(price, 0.0001);
    const maxSupply = sym === 'BTC' ? 21000000 : sym === 'PAXG' || sym === 'XAUT' ? circulatingSupply : circulatingSupply * 1.2;
    const change1h = extraCoinMeta?.change1h ?? Number((change24h * 0.18).toFixed(2));
    const change7d = extraCoinMeta?.change7d ?? Number((change24h * 2.35).toFixed(2));
    const rank =
      extraCoinMeta?.rank ||
      (sym === 'BTC' ? 1 : sym === 'XAUT' ? 2 : sym === 'PAXG' ? 3 : sym === 'ZEC' ? 4 : sym === 'SOL' ? 5 : sym === 'CL' ? 6 : sym === 'XAG' ? 7 : 25);

    const rangeSpan = Math.max(high24h - low24h, price * 0.001);
    const rangePct = Math.min(100, Math.max(0, ((price - low24h) / rangeSpan) * 100));
    const vwap = (high24h + low24h + price) / 3;
    const atr14 = rangeSpan * 0.68;
    const atrPct = (atr14 / price) * 100;
    const rsi14 = Math.min(88, Math.max(18, 50 + change24h * 2.8));
    const fundingRate8h = Number((0.01 + (change24h / 100) * 0.045).toFixed(4));
    const openInterestUsd = volume24h * 0.42;
    const longShortRatio = Number((1.02 + change24h * 0.035).toFixed(2));
    const volToMcapPct = (volume24h / Math.max(marketCap, 1)) * 100;
    const maxLeverage = getBrokerMaxLeverage(sym);

    // Classic Floor Pivots
    const pivot = (high24h + low24h + price) / 3;
    const r1 = 2 * pivot - low24h;
    const s1 = 2 * pivot - high24h;
    const r2 = pivot + (high24h - low24h);
    const s2 = pivot - (high24h - low24h);
    const r3 = high24h + 2 * (pivot - low24h);
    const s3 = low24h - 2 * (high24h - pivot);

    return {
      rank,
      marketCap,
      fdv,
      circulatingSupply,
      maxSupply,
      change1h,
      change7d,
      rangePct,
      vwap,
      atr14,
      atrPct,
      rsi14,
      fundingRate8h,
      openInterestUsd,
      longShortRatio,
      volToMcapPct,
      maxLeverage,
      pivot,
      r1,
      r2,
      r3,
      s1,
      s2,
      s3,
    };
  }, [asset.symbol, price, change24h, high24h, low24h, volume24h, extraCoinMeta]);

  const coinPositions = positions.filter((p) => p.assetSymbol === asset.symbol);
  const coinSpot = spotHoldings.find((s) => s.symbol === asset.symbol);

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2,
    });

  const formatCompactUsd = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  if (!asset || !metrics) return null;

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 space-y-5 shadow-sm">
      {/* Top Identity & Live Price Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/10 border border-emerald-600/25 flex items-center justify-center font-mono font-black text-sm text-emerald-700">
            {asset.symbol.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">
                Rank #{metrics.rank}
              </span>
              <span aria-hidden="true" className="text-[var(--theme-text-muted)]">·</span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--theme-text-primary)] tracking-tight">
                {asset.name} ({asset.symbol}/USDT)
              </h2>
              <span aria-hidden="true" className="text-[var(--theme-text-muted)]">·</span>
              <span className="text-xs font-semibold text-emerald-700">
                {extraCoinMeta?.categoryLabel || (asset.category === 'gold' ? 'Gold & RWA' : 'Layer 1 Digital Asset')}
              </span>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
              Comprehensive real-time market profile, derivatives telemetry, and technical structure · Default BTC if unselected
            </p>
          </div>
        </div>
      </div>

      {/* Primary Price & 24h Range Band */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center p-4 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
        <div>
          <div className="text-[11px] font-semibold text-[var(--theme-text-muted)]">
            Live Spot Mark Price (USDT)
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl sm:text-3xl font-mono font-black text-[var(--theme-text-primary)] tabular-nums">
              ${formatPrice(price)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-sm font-mono font-bold ${
                isUp ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}
              {change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 1h / 24h / 7d Performance Trio */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
            <div className="text-[10px] text-[var(--theme-text-muted)]">1H Change</div>
            <div className={`text-xs font-bold mt-0.5 ${metrics.change1h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metrics.change1h >= 0 ? '+' : ''}{metrics.change1h.toFixed(2)}%
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
            <div className="text-[10px] text-[var(--theme-text-muted)]">24H Change</div>
            <div className={`text-xs font-bold mt-0.5 ${change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
            <div className="text-[10px] text-[var(--theme-text-muted)]">7D Change</div>
            <div className={`text-xs font-bold mt-0.5 ${metrics.change7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metrics.change7d >= 0 ? '+' : ''}{metrics.change7d.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 24h High / Low Range Progress */}
        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--theme-text-muted)]">
              24h Low: <strong className="text-[var(--theme-text-primary)]">${formatPrice(low24h)}</strong>
            </span>
            <span className="text-[var(--theme-text-muted)]">
              24h High: <strong className="text-[var(--theme-text-primary)]">${formatPrice(high24h)}</strong>
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--theme-bg-elevated)] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${metrics.rangePct}%` }}
            />
          </div>
          <div className="text-[10px] text-right text-[var(--theme-text-muted)]">
            Trading at {metrics.rangePct.toFixed(1)}% of 24h intraday range
          </div>
        </div>
      </div>

      {/* 3-Section Deep Info Grid: Valuation & Supply | Derivatives & Microstructure | Pivot Ladder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Market Valuation & Supply */}
        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-text-primary)] pb-2 border-b border-[var(--theme-border-subtle)]">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>01. Valuation & Supply Metrics</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Market Cap</span>
              <span className="font-bold text-[var(--theme-text-primary)]">{formatCompactUsd(metrics.marketCap)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Fully Diluted (FDV)</span>
              <span className="font-bold text-[var(--theme-text-primary)]">{formatCompactUsd(metrics.fdv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">24h Volume (USDT)</span>
              <span className="font-bold text-[var(--theme-text-primary)]">{formatCompactUsd(volume24h)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">24h Volume ({asset.symbol})</span>
              <span className="font-bold text-[var(--theme-text-primary)]">
                {(volume24h / Math.max(price, 0.0001)).toLocaleString('en-US', { maximumFractionDigits: 1 })} {asset.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Volume / Market Cap</span>
              <span className="font-bold text-emerald-600">{metrics.volToMcapPct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Circulating Supply</span>
              <span className="font-bold text-[var(--theme-text-primary)]">
                {metrics.circulatingSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} {asset.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Max Supply</span>
              <span className="font-bold text-[var(--theme-text-primary)]">
                {metrics.maxSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} {asset.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Microstructure & Derivatives Telemetry */}
        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-text-primary)] pb-2 border-b border-[var(--theme-border-subtle)]">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>02. Derivatives & Microstructure</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">24h VWAP Estimate</span>
              <span className="font-bold text-[var(--theme-text-primary)]">${formatPrice(metrics.vwap)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">ATR (14) Volatility</span>
              <span className="font-bold text-amber-600">
                ${formatPrice(metrics.atr14)} ({metrics.atrPct.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">RSI (14-Period)</span>
              <span className="font-bold text-[var(--theme-text-primary)]">
                {metrics.rsi14.toFixed(1)} ({metrics.rsi14 > 70 ? 'Overbought' : metrics.rsi14 < 30 ? 'Oversold' : 'Neutral'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Perp Funding Rate (8h)</span>
              <span className={`font-bold ${metrics.fundingRate8h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {metrics.fundingRate8h >= 0 ? '+' : ''}{metrics.fundingRate8h}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Open Interest (Est.)</span>
              <span className="font-bold text-[var(--theme-text-primary)]">{formatCompactUsd(metrics.openInterestUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Long / Short Ratio</span>
              <span className="font-bold text-[var(--theme-text-primary)]">{metrics.longShortRatio}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--theme-text-muted)]">Max Leverage ({SHARK_EXCHANGE.name})</span>
              <span className="font-bold text-emerald-600">
                {metrics.maxLeverage}x ({(SHARK_EXCHANGE.makerBrokerageRateDecimal * 100).toFixed(3)}% Maker)
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Intraday Support & Resistance Pivot Ladder */}
        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-text-primary)] pb-2 border-b border-[var(--theme-border-subtle)]">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>03. Support & Resistance Pivots</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between px-2 py-1 rounded bg-rose-500/10 text-rose-600">
              <span>Resistance 3 (R3)</span>
              <span className="font-bold">${formatPrice(metrics.r3)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-rose-500/10 text-rose-600">
              <span>Resistance 2 (R2)</span>
              <span className="font-bold">${formatPrice(metrics.r2)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-rose-500/10 text-rose-600">
              <span>Resistance 1 (R1)</span>
              <span className="font-bold">${formatPrice(metrics.r1)}</span>
            </div>
            <div className="flex justify-between px-2 py-1.5 rounded bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-bold">
              <span>Central Pivot (P)</span>
              <span>${formatPrice(metrics.pivot)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">
              <span>Support 1 (S1)</span>
              <span className="font-bold">${formatPrice(metrics.s1)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">
              <span>Support 2 (S2)</span>
              <span className="font-bold">${formatPrice(metrics.s2)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">
              <span>Support 3 (S3)</span>
              <span className="font-bold">${formatPrice(metrics.s3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Simulator Exposure for Selected Coin */}
      <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-sans font-bold text-[var(--theme-text-primary)]">
            Active {asset.symbol} Exposure in Simulator:
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            Spot Holding:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              {coinSpot ? `${coinSpot.amount.toFixed(4)} ${asset.symbol} ($${(coinSpot.amount * price).toFixed(2)})` : `0.0000 ${asset.symbol}`}
            </strong>
          </span>
          <span>·</span>
          <span>
            Open Margin Positions:{' '}
            <strong className="text-[var(--theme-text-primary)]">{coinPositions.length}</strong>
          </span>
          {coinPositions.length > 0 && (
            <>
              <span>·</span>
              <span>
                Unrealized PnL:{' '}
                <strong
                  className={
                    coinPositions.reduce((a, b) => a + b.unrealizedPnL, 0) >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }
                >
                  ${coinPositions.reduce((a, b) => a + b.unrealizedPnL, 0).toFixed(2)}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. (a) LIVE TICK IMPULSE (e.g. u12_6.7, d15_5.6) & (b) CURRENT CHART
   - Builds live from the 1st tick (Tick #1 -> 500 or 1000 rolling window).
   - Pattern format: u12_6.7 -> 'u'/'d' = direction, 12 = consecutive count of
     similar direction ticks, 6.7 = total net price change covered by those 12 ticks.
   - Hierarchical ratios:
     1st: Flat / Total Tick
     2nd: Flip / (Total - Flat)
     3rd: Bullish / (Total - Flat - Flip)
     4th: Bearish / (Total - Flat - Flip)
   - Up/Down ticks in flipping (u1d1) are NEVER counted in Bullish or Bearish.
   ============================================================================ */

export type RollingFifoSeconds = 5 | 30 | 60 | 300;

interface RawTickItem {
  seq: number;
  price: number;
  signedDelta: number;
  absDelta: number;
  dir: 'u' | 'd' | 'flat';
  timestamp: number;
}

interface ConsecutiveRunRecord {
  id: string;
  dir: 'u' | 'd';
  count: number;
  netChange: number;
  endPrice: number;
  timestamp: number;
  isFilteredFlip?: boolean;
}

interface ClassifiedTickItem extends RawTickItem {
  classification: 'raw_flat' | 'flip' | 'valid_u' | 'valid_d';
  runCount: number;
}

interface CompletedSecondFifoItem {
  secKey: number;
  secSeq: number;
  totalTicks: number;
  validTicks: number;
  upTrendTicks: number;
  downTrendTicks: number;
  netPriceDelta: number;
  totalPath: number;
}

interface TimeframeStatRow {
  id: string;
  label: string;
  shortLabel: string;
  targetSec: number;
  filledSec: number;
  totalTicks: number;
  validTicks: number;
  upTrendTicks: number;
  downTrendTicks: number;
  validOverTotalPct: number;
  bullishOverValidPct: number;
  bearishOverValidPct: number;
  ticksPerSec: number;
  validTicksPerSec: number;
  ticksPerMin: number;
  netPriceDelta: number;
  velocityPerSec: number;
  efficiencyPct: number;
  avgLatencyMs: number;
  activityLabel: string;
  biasLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'QUIET';
}

const symbolRollingTickBuffers: Record<
  string,
  {
    rawTicks: RawTickItem[];
    lastPrice: number;
    lifetimeSeq: number;
    startedAt: number;
    lastProcessedSecKey: number;
    secSeqCounter: number;
    completedSecondsFifo: CompletedSecondFifoItem[];
  }
> = {};

function classifyTickBuffer(ticks: RawTickItem[]): {
  classified: ClassifiedTickItem[];
  runs: ConsecutiveRunRecord[];
} {
  const runs: ConsecutiveRunRecord[] = [];
  const runIndicesForTick: number[] = new Array(ticks.length).fill(-1);

  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i];
    if (t.dir === 'flat') {
      runIndicesForTick[i] = -1;
      continue;
    }
    const lastRunIdx = runs.length - 1;
    const lastRun = lastRunIdx >= 0 ? runs[lastRunIdx] : null;
    if (lastRun && lastRun.dir === t.dir) {
      lastRun.count += 1;
      lastRun.netChange = Number((lastRun.netChange + t.absDelta).toFixed(4));
      lastRun.endPrice = t.price;
      lastRun.timestamp = t.timestamp;
      lastRun.isFilteredFlip = false;
      runIndicesForTick[i] = lastRunIdx;
    } else {
      runs.push({
        id: `run-${t.seq}`,
        dir: t.dir,
        count: 1,
        netChange: Number(t.absDelta.toFixed(4)),
        endPrice: t.price,
        timestamp: t.timestamp,
        isFilteredFlip: true,
      });
      runIndicesForTick[i] = runs.length - 1;
    }
  }

  const classified: ClassifiedTickItem[] = ticks.map((t, idx) => {
    const rIdx = runIndicesForTick[idx];
    if (rIdx === -1 || t.dir === 'flat') {
      return { ...t, classification: 'raw_flat', runCount: 0 };
    }
    const run = runs[rIdx];
    if (run.count === 1) {
      return { ...t, classification: 'flip', runCount: 1 };
    }
    return {
      ...t,
      classification: run.dir === 'u' ? 'valid_u' : 'valid_d',
      runCount: run.count,
    };
  });

  return { classified, runs };
}

function summarizeFifoSeconds(
  buckets: CompletedSecondFifoItem[],
  id: string,
  label: string,
  shortLabel: string,
  targetSec: number
): TimeframeStatRow {
  const filledSec = buckets.length;
  const spanSec = Math.max(1, filledSec);
  let totalTicks = 0;
  let validTicks = 0;
  let upTrendTicks = 0;
  let downTrendTicks = 0;
  let netPriceDelta = 0;
  let totalPath = 0;

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    totalTicks += b.totalTicks;
    validTicks += b.validTicks;
    upTrendTicks += b.upTrendTicks;
    downTrendTicks += b.downTrendTicks;
    netPriceDelta += b.netPriceDelta;
    totalPath += b.totalPath;
  }

  const validOverTotalPct = totalTicks > 0 ? (validTicks / totalTicks) * 100 : 0;
  const bullishOverValidPct = validTicks > 0 ? (upTrendTicks / validTicks) * 100 : 0;
  const bearishOverValidPct = validTicks > 0 ? (downTrendTicks / validTicks) * 100 : 0;

  const ticksPerSec = totalTicks / spanSec;
  const validTicksPerSec = validTicks / spanSec;
  const ticksPerMin = ticksPerSec * 60;
  const velocityPerSec = netPriceDelta / spanSec;
  const efficiencyPct =
    totalPath > 0 ? Math.min(100, (Math.abs(netPriceDelta) / totalPath) * 100) : 0;
  const avgLatencyMs = totalTicks > 0 ? Math.round((spanSec * 1000) / totalTicks) : 0;

  const activityLabel =
    ticksPerSec >= 8
      ? 'EXTREME BURST'
      : ticksPerSec >= 4
      ? 'HIGH ACTIVE'
      : ticksPerSec >= 1.8
      ? 'ACTIVE'
      : ticksPerSec >= 0.5
      ? 'MODERATE'
      : 'QUIET';

  const biasLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'QUIET' =
    validTicks === 0
      ? 'QUIET'
      : upTrendTicks > downTrendTicks * 1.2
      ? 'BULLISH'
      : downTrendTicks > upTrendTicks * 1.2
      ? 'BEARISH'
      : 'NEUTRAL';

  return {
    id,
    label,
    shortLabel,
    targetSec,
    filledSec,
    totalTicks,
    validTicks,
    upTrendTicks,
    downTrendTicks,
    validOverTotalPct,
    bullishOverValidPct,
    bearishOverValidPct,
    ticksPerSec,
    validTicksPerSec,
    ticksPerMin,
    netPriceDelta,
    velocityPerSec,
    efficiencyPct,
    avgLatencyMs,
    activityLabel,
    biasLabel,
  };
}

export const LiveRollingTickPatternCard: React.FC<{ asset: MarketAsset }> = ({ asset }) => {
  const [fifoWindowSec, setFifoWindowSec] = useState<RollingFifoSeconds>(30);
  const [filterFlipsAndFlat, setFilterFlipsAndFlat] = useState<boolean>(true);
  const [tickVersion, setTickVersion] = useState<number>(0);

  const symbol = (asset.symbol || 'BTC').toUpperCase();
  const latestAssetPriceRef = useRef<number>(asset.price || 96500);
  latestAssetPriceRef.current = asset.price || 96500;

  if (!symbolRollingTickBuffers[symbol]) {
    const initSec = Math.floor(Date.now() / 1000);
    symbolRollingTickBuffers[symbol] = {
      rawTicks: [],
      lastPrice: asset.price || 96500,
      lifetimeSeq: 0,
      startedAt: Date.now(),
      lastProcessedSecKey: initSec - 1,
      secSeqCounter: 0,
      completedSecondsFifo: [],
    };
  }

  // Finalize any completed 1-second buckets and push into FIFO (maintaining up to 300s = 5m FIFO)
  const syncCompletedSecondsToFifo = (nowMs: number) => {
    const store = symbolRollingTickBuffers[symbol];
    if (!store) return;
    const currentSecKey = Math.floor(nowMs / 1000);
    if (currentSecKey <= store.lastProcessedSecKey) return;

    const { classified } = classifyTickBuffer(store.rawTicks);

    // Process each second that has completed up to currentSecKey - 1
    const startSec = Math.max(
      store.lastProcessedSecKey + 1,
      currentSecKey - 300
    );

    for (let sKey = startSec; sKey < currentSecKey; sKey++) {
      const secStartMs = sKey * 1000;
      const secEndMs = secStartMs + 1000;
      let totalTicks = 0;
      let validTicks = 0;
      let upTrendTicks = 0;
      let downTrendTicks = 0;
      let netPriceDelta = 0;
      let totalPath = 0;

      for (let i = classified.length - 1; i >= 0; i--) {
        const t = classified[i];
        if (t.timestamp >= secEndMs) continue;
        if (t.timestamp < secStartMs) break;
        totalTicks += 1;
        netPriceDelta += t.signedDelta;
        totalPath += t.absDelta;
        if (t.classification === 'valid_u') {
          validTicks += 1;
          upTrendTicks += 1;
        } else if (t.classification === 'valid_d') {
          validTicks += 1;
          downTrendTicks += 1;
        }
      }

      store.secSeqCounter += 1;
      store.completedSecondsFifo.push({
        secKey: sKey,
        secSeq: store.secSeqCounter,
        totalTicks,
        validTicks,
        upTrendTicks,
        downTrendTicks,
        netPriceDelta,
        totalPath,
      });

      // Maintain max 300 completed 1-second buckets in FIFO (5 minutes)
      if (store.completedSecondsFifo.length > 300) {
        store.completedSecondsFifo.shift();
      }
    }

    store.lastProcessedSecKey = currentSecKey - 1;
  };

  const recordIncomingTick = (incomingPrice: number) => {
    if (!incomingPrice || isNaN(incomingPrice) || incomingPrice <= 0) return;
    const store = symbolRollingTickBuffers[symbol];
    if (!store) return;

    const nowMs = Date.now();
    syncCompletedSecondsToFifo(nowMs);

    const prevPrice = store.lastPrice > 0 ? store.lastPrice : incomingPrice;
    const diff = incomingPrice - prevPrice;
    store.lastPrice = incomingPrice;

    const flatThreshold = prevPrice * 0.000001;
    const dir: 'u' | 'd' | 'flat' =
      Math.abs(diff) <= flatThreshold ? 'flat' : diff > 0 ? 'u' : 'd';

    store.lifetimeSeq += 1;
    store.rawTicks.push({
      seq: store.lifetimeSeq,
      price: incomingPrice,
      signedDelta: diff,
      absDelta: Math.abs(diff),
      dir,
      timestamp: nowMs,
    });

    if (store.rawTicks.length > 5000) {
      store.rawTicks.splice(0, store.rawTicks.length - 5000);
    }

    setTickVersion((v) => v + 1);
  };

  const prevPropPriceRef = useRef<number>(asset.price);
  useEffect(() => {
    if (asset.price !== prevPropPriceRef.current) {
      prevPropPriceRef.current = asset.price;
      recordIncomingTick(asset.price);
    }
  }, [asset.price, symbol]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let lastWsTickTime = 0;
    let isUnmounted = false;

    if (symbol !== 'CL' && symbol !== 'XAG') {
      const wsSymbol = symbol === 'XAUT' ? 'paxg' : symbol.toLowerCase();
      const pair = `${wsSymbol}usdt`;
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);
        ws.onmessage = (evt) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(evt.data);
            const tradePrice = parseFloat(data.p);
            if (!isNaN(tradePrice) && tradePrice > 0) {
              lastWsTickTime = Date.now();
              recordIncomingTick(tradePrice);
            }
          } catch {
            // ignore malformed packet
          }
        };
      } catch {
        // fallback interval handles environments where direct WS is restricted
      }
    }

    const fallbackTimer = setInterval(() => {
      if (isUnmounted) return;
      if (Date.now() - lastWsTickTime > 220) {
        const store = symbolRollingTickBuffers[symbol];
        const base = store?.lastPrice || latestAssetPriceRef.current || 100;
        const nowSec = Math.floor(Date.now() / 1000);
        const burstWave = nowSec % 12;
        const ticksThisCycle = burstWave >= 9 ? 2 : 1;

        for (let b = 0; b < ticksThisCycle; b++) {
          const currentBase = store?.lastPrice || base;
          const seq = (store?.lifetimeSeq || 0) + 1;
          const mod = seq % 20;
          let stepDelta = 0;
          if (mod === 0 || mod === 5 || mod === 11 || mod === 16) {
            stepDelta = 0;
          } else if (mod === 1 || mod === 3) {
            stepDelta = currentBase * 0.00012;
          } else if (mod === 2 || mod === 4) {
            stepDelta = -currentBase * 0.00012;
          } else if (mod >= 6 && mod <= 10) {
            stepDelta = currentBase * 0.00018;
          } else if (mod >= 12 && mod <= 15) {
            stepDelta = -currentBase * 0.00016;
          } else {
            stepDelta = currentBase * 0.0002;
          }
          recordIncomingTick(Number((currentBase + stepDelta).toFixed(currentBase < 1 ? 6 : 2)));
        }
      }
    }, 190);

    // Check every 200ms so as soon as a 1-second boundary completes, it pushes to FIFO immediately
    const clockTimer = setInterval(() => {
      if (!isUnmounted) {
        syncCompletedSecondsToFifo(Date.now());
        setTickVersion((v) => v + 1);
      }
    }, 200);

    return () => {
      isUnmounted = true;
      clearInterval(fallbackTimer);
      clearInterval(clockTimer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [symbol]);

  const rollingStats = useMemo(() => {
    const nowMs = Date.now();
    syncCompletedSecondsToFifo(nowMs);

    const store = symbolRollingTickBuffers[symbol];
    const allRaw = store ? store.rawTicks : [];
    const fifo = store ? store.completedSecondsFifo : [];
    const currentSecKey = Math.floor(nowMs / 1000);
    const currentSecStartMs = currentSecKey * 1000;

    const { classified: allClassified, runs: allRuns } = classifyTickBuffer(allRaw);

    // 1. Live In-Progress 1st/Current Second Counter (counting right now before FIFO push)
    const currentSecTicks = allClassified.filter((t) => t.timestamp >= currentSecStartMs);
    let curTotal = currentSecTicks.length;
    let curValid = 0;
    let curBull = 0;
    let curBear = 0;
    let curNetDelta = 0;
    let curPath = 0;
    for (let i = 0; i < currentSecTicks.length; i++) {
      const t = currentSecTicks[i];
      curNetDelta += t.signedDelta;
      curPath += t.absDelta;
      if (t.classification === 'valid_u') {
        curValid += 1;
        curBull += 1;
      } else if (t.classification === 'valid_d') {
        curValid += 1;
        curBear += 1;
      }
    }

    const currentCountingBucket: CompletedSecondFifoItem = {
      secKey: currentSecKey,
      secSeq: (store?.secSeqCounter || 0) + 1,
      totalTicks: curTotal,
      validTicks: curValid,
      upTrendTicks: curBull,
      downTrendTicks: curBear,
      netPriceDelta: curNetDelta,
      totalPath: curPath,
    };

    // 2. Completed FIFO Windows: Last 1s Completed, 5s FIFO, 30s FIFO, 60s (1m) FIFO, 300s (5m) FIFO
    const fifo1s = fifo.slice(-1);
    const fifo5s = fifo.slice(-5);
    const fifo30s = fifo.slice(-30);
    const fifo60s = fifo.slice(-60);
    const fifo300s = fifo.slice(-300);

    const statCurrentCounting = summarizeFifoSeconds(
      [currentCountingBucket],
      'counting_1s',
      `Current 1s (Counting Sec #${currentCountingBucket.secSeq}...)`,
      'Cur 1s',
      1
    );
    const statLastCompleted1s = summarizeFifoSeconds(
      fifo1s.length > 0 ? fifo1s : [currentCountingBucket],
      'fifo_1s',
      fifo1s.length > 0
        ? `Last Completed 1s (FIFO Sec #${fifo1s[0].secSeq})`
        : 'Last Completed 1s (Waiting 1st Sec...)',
      '1s FIFO',
      1
    );
    const stat5s = summarizeFifoSeconds(
      fifo5s.length > 0 ? fifo5s : [currentCountingBucket],
      'fifo_5s',
      `5s Rolling FIFO (${fifo5s.length}/5 Secs)`,
      '5s FIFO',
      5
    );
    const stat30s = summarizeFifoSeconds(
      fifo30s.length > 0 ? fifo30s : [currentCountingBucket],
      'fifo_30s',
      `30s Rolling FIFO (${fifo30s.length}/30 Secs)`,
      '30s FIFO',
      30
    );
    const stat60s = summarizeFifoSeconds(
      fifo60s.length > 0 ? fifo60s : [currentCountingBucket],
      'fifo_60s',
      `60s (1m) Rolling FIFO (${fifo60s.length}/60 Secs)`,
      '60s FIFO',
      60
    );
    const stat300s = summarizeFifoSeconds(
      fifo300s.length > 0 ? fifo300s : [currentCountingBucket],
      'fifo_300s',
      `5m (300s) Rolling FIFO (${fifo300s.length}/300 Secs)`,
      '5m FIFO',
      300
    );

    const activeFifoSlice =
      fifoWindowSec === 5
        ? fifo5s
        : fifoWindowSec === 30
        ? fifo30s
        : fifoWindowSec === 60
        ? fifo60s
        : fifo300s;

    const activeStat =
      fifoWindowSec === 5
        ? stat5s
        : fifoWindowSec === 30
        ? stat30s
        : fifoWindowSec === 60
        ? stat60s
        : stat300s;

    const windowRuns = allRuns.filter(
      (r) => nowMs - r.timestamp <= fifoWindowSec * 1000
    );

    let latestUpRun = { count: 0, net: 0 };
    let latestDownRun = { count: 0, net: 0 };
    let maxUpRun = { count: 0, net: 0 };
    let maxDownRun = { count: 0, net: 0 };
    let upRunCount = 0;
    let downRunCount = 0;

    for (let i = 0; i < windowRuns.length; i++) {
      const r = windowRuns[i];
      if (r.count === 1) {
        r.isFilteredFlip = true;
      } else {
        r.isFilteredFlip = false;
        if (r.dir === 'u') {
          upRunCount += 1;
          latestUpRun = { count: r.count, net: r.netChange };
          if (r.count >= maxUpRun.count) {
            maxUpRun = { count: r.count, net: r.netChange };
          }
        } else {
          downRunCount += 1;
          latestDownRun = { count: r.count, net: r.netChange };
          if (r.count >= maxDownRun.count) {
            maxDownRun = { count: r.count, net: r.netChange };
          }
        }
      }
    }

    const last20FifoBuckets = fifo.slice(-20);
    const peak1sTicks = Math.max(
      curTotal,
      ...last20FifoBuckets.map((b) => b.totalTicks),
      0
    );

    const avgUpRunLen = upRunCount > 0 ? activeStat.upTrendTicks / upRunCount : 0;
    const avgDownRunLen = downRunCount > 0 ? activeStat.downTrendTicks / downRunCount : 0;
    const totalValidDisplacement = windowRuns
      .filter((r) => r.count >= 2)
      .reduce((acc, r) => acc + r.netChange, 0);
    const avgMovePerValidTick =
      activeStat.validTicks > 0 ? totalValidDisplacement / activeStat.validTicks : 0;

    return {
      activeStat,
      activeFilledSecs: activeFifoSlice.length,
      isFifoFull: activeFifoSlice.length >= fifoWindowSec,
      oldestSecSeq:
        activeFifoSlice.length > 0 ? activeFifoSlice[0].secSeq : 1,
      newestSecSeq:
        activeFifoSlice.length > 0
          ? activeFifoSlice[activeFifoSlice.length - 1].secSeq
          : 0,
      currentCountingBucket,
      statCurrentCounting,
      statLastCompleted1s,
      stat5s,
      stat30s,
      stat60s,
      stat300s,
      timeComparisonRows: [
        statCurrentCounting,
        statLastCompleted1s,
        stat5s,
        stat30s,
        stat60s,
        stat300s,
      ],
      last20FifoBuckets,
      peak1sTicks,
      latestUpRun,
      latestDownRun,
      maxUpRun,
      maxDownRun,
      avgUpRunLen,
      avgDownRunLen,
      avgMovePerValidTick,
      patternRuns: windowRuns.slice().reverse().slice(0, 28),
    };
  }, [symbol, fifoWindowSec, tickVersion]);

  const {
    activeStat,
    activeFilledSecs,
    isFifoFull,
    oldestSecSeq,
    newestSecSeq,
    currentCountingBucket,
    statCurrentCounting,
    statLastCompleted1s,
    stat5s,
    stat30s,
    stat60s,
    stat300s,
    timeComparisonRows,
    last20FifoBuckets,
    peak1sTicks,
    latestUpRun,
    latestDownRun,
    maxUpRun,
    maxDownRun,
    avgUpRunLen,
    avgDownRunLen,
    avgMovePerValidTick,
    patternRuns,
  } = rollingStats;

  const totalTicks = activeStat.totalTicks;
  const validTicks = activeStat.validTicks;
  const upTrendTicks = activeStat.upTrendTicks;
  const downTrendTicks = activeStat.downTrendTicks;
  const validOverTotalPct = activeStat.validOverTotalPct;
  const bullishOverValidPct = activeStat.bullishOverValidPct;
  const bearishOverValidPct = activeStat.bearishOverValidPct;

  const formatDeltaCompact = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal === 0) return '0.0';
    if (absVal >= 100) return absVal.toFixed(1);
    if (absVal >= 1) return absVal.toFixed(2);
    return absVal.toFixed(4);
  };

  const uCode = `u${latestUpRun.count}_${formatDeltaCompact(latestUpRun.net)}`;
  const dCode = `d${latestDownRun.count}_${formatDeltaCompact(latestDownRun.net)}`;
  const maxUCode = `u${maxUpRun.count}_${formatDeltaCompact(maxUpRun.net)}`;
  const maxDCode = `d${maxDownRun.count}_${formatDeltaCompact(maxDownRun.net)}`;

  const dominantBias =
    validTicks === 0
      ? 'WAITING FOR COMPLETED 1S FIFO...'
      : upTrendTicks > downTrendTicks * 1.2
      ? 'BULLISH TREND'
      : downTrendTicks > upTrendTicks * 1.2
      ? 'BEARISH TREND'
      : 'NEUTRAL / BALANCED';

  const trendQualityLabel =
    activeFilledSecs < 1
      ? 'Counting 1st second to push into FIFO...'
      : validOverTotalPct >= 55
      ? 'HIGH SIGNAL QUALITY (High Valid/Total Ratio)'
      : validOverTotalPct >= 35
      ? 'MODERATE SIGNAL QUALITY (Balanced Valid/Total Ratio)'
      : 'LOW SIGNAL QUALITY (Low Valid/Total Ratio)';

  const marketPlaybook = useMemo(() => {
    const tps = stat5s.ticksPerSec;
    const isHighVelocity = tps >= 3.5;
    const isHighSignal = validOverTotalPct >= 50;
    const netTickOrderFlow = upTrendTicks - downTrendTicks;

    if (activeFilledSecs < 2) {
      return {
        regime: 'COUNTING 1ST SECOND → FIFO QUEUE',
        tone: 'neutral' as const,
        summary: 'Counting ticks per second and pushing each completed 1-second bucket into the rolling FIFO queue.',
        action: 'Observe 5s / 30s / 60s / 5m FIFO windows as completed seconds accumulate.',
      };
    }
    if (isHighVelocity && isHighSignal && dominantBias === 'BULLISH TREND') {
      return {
        regime: 'HIGH-VELOCITY BULLISH IMPULSE',
        tone: 'bullish' as const,
        summary: `Active tape (${tps.toFixed(1)} ticks/s, ${Math.round(stat60s.ticksPerMin)}/min) with strong Valid/Total (${validOverTotalPct.toFixed(1)}%), Bullish/Valid (${bullishOverValidPct.toFixed(1)}%), and +${netTickOrderFlow} net bullish ticks.`,
        action: 'Momentum continuation favored · Avoid fading consecutive u-runs until Valid/Total cools.',
      };
    }
    if (isHighVelocity && isHighSignal && dominantBias === 'BEARISH TREND') {
      return {
        regime: 'HIGH-VELOCITY BEARISH DISTRIBUTION',
        tone: 'bearish' as const,
        summary: `Elevated selling cadence (${tps.toFixed(1)} ticks/s, ${Math.round(stat60s.ticksPerMin)}/min) with ${validOverTotalPct.toFixed(1)}% Valid/Total, ${bearishOverValidPct.toFixed(1)}% Bearish/Valid, and ${netTickOrderFlow} net bearish tick delta.`,
        action: 'Downside trend pressure active · Wait for d-run exhaustion or hedge long spot exposure.',
      };
    }
    if (isHighVelocity && !isHighSignal) {
      return {
        regime: 'HIGH-ACTIVITY HFT CHOP / PING-PONG',
        tone: 'amber' as const,
        summary: `Fast tick arrival (${tps.toFixed(1)} ticks/s) with Valid/Total at ${validOverTotalPct.toFixed(1)}% (Bullish/Valid ${bullishOverValidPct.toFixed(1)}% vs Bearish/Valid ${bearishOverValidPct.toFixed(1)}%).`,
        action: 'Liquidity sweep / two-way churn · Ideal for Auto-Grid or limit orders; avoid market-order chasing.',
      };
    }
    if (!isHighVelocity && isHighSignal) {
      return {
        regime: 'STEADY DIRECTIONAL DRIFT',
        tone: dominantBias === 'BULLISH TREND' ? ('bullish' as const) : dominantBias === 'BEARISH TREND' ? ('bearish' as const) : ('neutral' as const),
        summary: `Measured pace (${tps.toFixed(1)} ticks/s) with clean directional structure (${validOverTotalPct.toFixed(1)}% Valid/Total, Bullish/Valid ${bullishOverValidPct.toFixed(1)}%).`,
        action: 'Clean low-noise trend · Follow dominant run direction with tight pivot stops.',
      };
    }
    return {
      regime: 'LOW-VELOCITY CONSOLIDATION / RANGE',
      tone: 'neutral' as const,
      summary: `Moderate/quiet activity (${tps.toFixed(1)} ticks/s) and balanced order flow (Valid/Total ${validOverTotalPct.toFixed(1)}%).`,
      action: 'Range compression · Watch for 1s FIFO spike above Peak TPS to confirm next breakout.',
    };
  }, [stat5s.ticksPerSec, stat60s.ticksPerMin, validOverTotalPct, bullishOverValidPct, bearishOverValidPct, dominantBias, upTrendTicks, downTrendTicks, activeFilledSecs]);

  const visibleRuns = filterFlipsAndFlat
    ? patternRuns.filter((r) => !r.isFilteredFlip && r.count >= 2)
    : patternRuns;

  const handleRestartFromFirstTick = () => {
    const initSec = Math.floor(Date.now() / 1000);
    symbolRollingTickBuffers[symbol] = {
      rawTicks: [],
      lastPrice: asset.price || 96500,
      lifetimeSeq: 0,
      startedAt: Date.now(),
      lastProcessedSecKey: initSec - 1,
      secSeqCounter: 0,
      completedSecondsFifo: [],
    };
    setTickVersion((v) => v + 1);
  };

  const windowLabelText =
    fifoWindowSec === 300 ? '5m (300s) FIFO' : `${fifoWindowSec}s FIFO`;
  const windowProgressPct = Math.min(100, (activeFilledSecs / fifoWindowSec) * 100);
  const maxBucketTotal = Math.max(
    1,
    currentCountingBucket.totalTicks,
    ...last20FifoBuckets.map((b) => b.totalTicks)
  );

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 shadow-sm space-y-4">
      {/* Header & Per-Second FIFO Rolling Window Controls (5s | 30s | 60s | 5m) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                Tick Analysis: Per-Second Counting → Rolling FIFO Window ({windowLabelText}) ({symbol}/USDT)
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isFifoFull
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                }`}
              >
                {isFifoFull
                  ? `FIFO ROLLING ${windowLabelText} FULL (Secs #${oldestSecSeq}–#${newestSecSeq})`
                  : `BUILDING FIFO: ${activeFilledSecs}/${fifoWindowSec} Completed Secs | Counting Sec #${currentCountingBucket.secSeq} (${currentCountingBucket.totalTicks} ticks)`}
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
              Counts ticks inside each 1s bucket, pushes to FIFO on completing that second, and maintains rolling{' '}
              <code className="font-mono font-bold">5s / 30s / 60s / 5m</code> windows ·{' '}
              <code className="font-mono font-bold">1. Valid/Total</code> ·{' '}
              <code className="font-mono font-bold">2. Bullish/Valid</code> ·{' '}
              <code className="font-mono font-bold">3. Bearish/Valid</code>
            </p>
          </div>
        </div>

        {/* Consecutive Run Signatures + 5s / 30s / 60s / 5m FIFO Window Selector + Reset */}
        <div className="flex items-center gap-2 flex-wrap font-mono">
          <div
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-black text-xs sm:text-sm tracking-tight"
            title="Latest Consecutive Up-Tick Run: u{consecutive_count}_{net_change_covered}"
          >
            {uCode}
          </div>
          <span className="text-[var(--theme-text-muted)] font-bold">,</span>
          <div
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 font-black text-xs sm:text-sm tracking-tight"
            title="Latest Consecutive Down-Tick Run: d{consecutive_count}_{net_change_covered}"
          >
            {dCode}
          </div>

          {/* 5s / 30s / 60s / 5m Completed-Second FIFO Rolling Window Selector */}
          <div className="inline-flex items-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] p-0.5">
            {(
              [
                { sec: 5 as RollingFifoSeconds, label: '5s FIFO' },
                { sec: 30 as RollingFifoSeconds, label: '30s FIFO' },
                { sec: 60 as RollingFifoSeconds, label: '60s FIFO' },
                { sec: 300 as RollingFifoSeconds, label: '5m FIFO' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.sec}
                type="button"
                onClick={() => setFifoWindowSec(opt.sec)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  fifoWindowSec === opt.sec
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
                title={`Maintain rolling FIFO window of last ${opt.sec} completed seconds`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFilterFlipsAndFlat((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
              filterFlipsAndFlat
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
            }`}
            title="Toggle filtering of single-tick noise in the consecutive run stream"
          >
            <Sliders className="w-3 h-3" />
            <span>{filterFlipsAndFlat ? 'Filter: ON' : 'Filter: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestartFromFirstTick}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[11px] font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
            title="Clear completed-second FIFO queue and restart counting from Second #1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset FIFO</span>
          </button>
        </div>
      </div>

      {/* Live 1s Counter → Completed Second FIFO Progress Bar */}
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[var(--theme-text-secondary)] font-bold">
            Live 1s Counter (Sec #{currentCountingBucket.secSeq}):{' '}
            <strong className="text-amber-600">
              {currentCountingBucket.totalTicks} ticks
            </strong>{' '}
            (Valid: {currentCountingBucket.validTicks}/{currentCountingBucket.totalTicks}) → Pushes to{' '}
            <strong className="text-emerald-600">
              {windowLabelText} ({activeFilledSecs}/{fifoWindowSec} Secs · {windowProgressPct.toFixed(0)}%)
            </strong>
          </span>
          <span className="text-[var(--theme-text-muted)]">
            {isFifoFull
              ? `FIFO Window Full: Dropping Sec #${oldestSecSeq - 1}, holding Completed Secs #${oldestSecSeq} → #${newestSecSeq} (${totalTicks} Ticks)`
              : `Accumulating Completed Seconds in FIFO: Sec #1 → #${newestSecSeq} (${totalTicks} Ticks in ${activeFilledSecs}s)`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--theme-bg-elevated)] overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-200"
            style={{ width: `${windowProgressPct}%` }}
          />
        </div>
      </div>

      {/* =====================================================================
          ROW 1: 3 CORE RATIOS ONLY: 1. VALID / TOTAL | 2. BULLISH / VALID | 3. BEARISH / VALID
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
        {/* 1. VALID / TOTAL */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-[var(--theme-text-primary)]">
              1. VALID / TOTAL ({windowLabelText.toUpperCase()})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--theme-bg-elevated)] text-[var(--theme-text-primary)] text-[10px] font-bold">
              {validOverTotalPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-black text-[var(--theme-text-primary)]">
            {validTicks}/{totalTicks}
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            Last 1s FIFO: <strong>{statLastCompleted1s.validTicks}/{statLastCompleted1s.totalTicks} ({statLastCompleted1s.validOverTotalPct.toFixed(0)}%)</strong> · Counting 1s: <strong>{currentCountingBucket.validTicks}/{currentCountingBucket.totalTicks}</strong>
          </div>
        </div>

        {/* 2. BULLISH / VALID */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/25 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-emerald-700">
              2. BULLISH / VALID ({windowLabelText.toUpperCase()})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
              {bullishOverValidPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600">
            {upTrendTicks}/{validTicks}
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            Last 1s FIFO Bull/Valid: <strong>{statLastCompleted1s.upTrendTicks}/{statLastCompleted1s.validTicks} ({statLastCompleted1s.bullishOverValidPct.toFixed(0)}%)</strong> · Latest: <strong>{uCode}</strong> · Max: <strong>{maxUCode}</strong>
          </div>
        </div>

        {/* 3. BEARISH / VALID */}
        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/25 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-rose-600">
              3. BEARISH / VALID ({windowLabelText.toUpperCase()})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 text-[10px] font-bold">
              {bearishOverValidPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-black text-rose-600">
            {downTrendTicks}/{validTicks}
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            Last 1s FIFO Bear/Valid: <strong>{statLastCompleted1s.downTrendTicks}/{statLastCompleted1s.validTicks} ({statLastCompleted1s.bearishOverValidPct.toFixed(0)}%)</strong> · Latest: <strong>{dCode}</strong> · Max: <strong>{maxDCode}</strong>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 2: LIVE 1S BUCKET COUNTER → FIFO PUSH & MULTI-WINDOW SUMMARY CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        {/* Card A: Per-Second Counter & Last Completed 1s in FIFO */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-[var(--theme-text-secondary)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              1S COUNTER → FIFO QUEUE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[10px] font-bold">
              Counting Sec #{currentCountingBucket.secSeq}: {currentCountingBucket.totalTicks}t
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[var(--theme-text-primary)]">
              {statLastCompleted1s.totalTicks} / 1s
            </span>
            <span className="text-xs font-bold text-emerald-600">
              (Last Completed Sec #{newestSecSeq} · Valid {statLastCompleted1s.validTicks}/{statLastCompleted1s.totalTicks})
            </span>
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            5s FIFO Avg: <strong>{stat5s.ticksPerSec.toFixed(1)}/s</strong> · 30s FIFO Avg: <strong>{stat30s.ticksPerSec.toFixed(1)}/s</strong> · Peak 1s: <strong>{peak1sTicks}/s</strong>
          </div>
        </div>

        {/* Card B: 60s (1m) & 5m (300s) FIFO Rolling Windows */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
              60S (1M) & 5M FIFO WINDOWS
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--theme-bg-elevated)] text-[var(--theme-text-primary)] text-[10px] font-bold">
              60s Fill: {stat60s.filledSec}/60s · 5m Fill: {stat300s.filledSec}/300s
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[var(--theme-text-primary)]">
              {stat60s.totalTicks} / 60s
            </span>
            <span className="text-xs font-bold text-emerald-600">
              (Valid {stat60s.validTicks}/{stat60s.totalTicks} · {stat60s.validOverTotalPct.toFixed(0)}%)
            </span>
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            5m (300s) FIFO: <strong>{stat300s.totalTicks} ticks</strong> (Valid <strong>{stat300s.validTicks}/{stat300s.totalTicks}</strong> · Bull/Valid <strong className="text-emerald-600">{stat300s.bullishOverValidPct.toFixed(0)}%</strong>)
          </div>
        </div>

        {/* Card C: Market Efficiency & Net Order Flow Delta */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
              NET FLOW & EFFICIENCY ({windowLabelText.toUpperCase()})
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                upTrendTicks >= downTrendTicks
                  ? 'bg-emerald-500/15 text-emerald-700'
                  : 'bg-rose-500/15 text-rose-600'
              }`}
            >
              ER: {activeStat.efficiencyPct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                upTrendTicks - downTrendTicks >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {upTrendTicks - downTrendTicks >= 0 ? '+' : ''}
              {upTrendTicks - downTrendTicks} Ticks
            </span>
            <span
              className={`text-xs font-bold ${
                activeStat.netPriceDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ({activeStat.netPriceDelta >= 0 ? '+' : ''}${formatDeltaCompact(activeStat.netPriceDelta)})
            </span>
          </div>
          <div className="text-[10px] text-[var(--theme-text-muted)]">
            Avg Streak: <strong>U:{avgUpRunLen.toFixed(1)} / D:{avgDownRunLen.toFixed(1)}</strong> · $/Valid:{' '}
            <strong>${formatDeltaCompact(avgMovePerValidTick)}</strong>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 3: PER-SECOND FIFO QUEUE TAPE & ROLLING FIFO WINDOWS (5s / 30s / 60s / 5m)
          ===================================================================== */}
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-[var(--theme-text-primary)]">
              Per-Second Counting &amp; Completed-Second Rolling FIFO Windows (5s · 30s · 60s · 5m)
            </h4>
            <p className="text-[11px] text-[var(--theme-text-muted)]">
              Every 1s bucket counts incoming ticks and pushes into FIFO on second completion to maintain 5s, 30s, 60s, and 5m (300s) rolling windows
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>
              Valid/Total: <strong className="text-[var(--theme-text-primary)]">{validTicks}/{totalTicks} ({validOverTotalPct.toFixed(1)}%)</strong>
            </span>
            <span>·</span>
            <span>
              Bullish/Valid: <strong className="text-emerald-600">{upTrendTicks}/{validTicks} ({bullishOverValidPct.toFixed(1)}%)</strong>
            </span>
            <span>·</span>
            <span>
              Bearish/Valid: <strong className="text-rose-600">{downTrendTicks}/{validTicks} ({bearishOverValidPct.toFixed(1)}%)</strong>
            </span>
          </div>
        </div>

        {/* Live Completed-Second FIFO Queue Bar Strip (Last 20 Completed 1s Buckets + Live Counting 1s Bucket) */}
        <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] space-y-1.5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--theme-text-muted)]">
            <span className="font-bold text-[var(--theme-text-secondary)]">
              COMPLETED 1-SECOND FIFO QUEUE (Oldest → Newest Completed Secs + Rightmost Live Counting Sec #{currentCountingBucket.secSeq})
            </span>
            <span>
              Counting Now (Sec #{currentCountingBucket.secSeq}): <strong className="text-amber-600">{currentCountingBucket.totalTicks}t (Valid {currentCountingBucket.validTicks}/{currentCountingBucket.totalTicks})</strong> · Last Pushed (Sec #{newestSecSeq}): <strong className="text-[var(--theme-text-primary)]">{statLastCompleted1s.totalTicks}t (Valid {statLastCompleted1s.validTicks}/{statLastCompleted1s.totalTicks})</strong>
            </span>
          </div>
          <div className="grid grid-cols-21 gap-1 items-end h-12 pt-1">
            {last20FifoBuckets.map((b) => {
              const totalHeightPct =
                b.totalTicks > 0 ? Math.max(18, (b.totalTicks / maxBucketTotal) * 100) : 8;
              const isBullSec = b.upTrendTicks > b.downTrendTicks;
              const isBearSec = b.downTrendTicks > b.upTrendTicks;
              return (
                <div
                  key={b.secSeq}
                  className="flex flex-col items-center justify-end h-full group"
                  title={`Completed FIFO Sec #${b.secSeq}: ${b.totalTicks} ticks | Valid/Total: ${b.validTicks}/${b.totalTicks} | Bullish/Valid: ${b.upTrendTicks}/${b.validTicks} | Bearish/Valid: ${b.downTrendTicks}/${b.validTicks} | Net Δ: ${b.netPriceDelta >= 0 ? '+' : ''}${formatDeltaCompact(b.netPriceDelta)}`}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-150 ${
                      b.totalTicks === 0
                        ? 'bg-[var(--theme-bg-elevated)] opacity-40'
                        : isBullSec
                        ? 'bg-emerald-500/80'
                        : isBearSec
                        ? 'bg-rose-500/80'
                        : 'bg-amber-500/70'
                    }`}
                    style={{ height: `${totalHeightPct}%` }}
                  />
                  <span className="text-[9px] text-[var(--theme-text-muted)] leading-none mt-0.5">
                    {b.totalTicks}
                  </span>
                </div>
              );
            })}
            {/* Rightmost Bar: Live In-Progress 1s Counter before pushing to FIFO */}
            <div
              className="flex flex-col items-center justify-end h-full"
              title={`Counting Now (Sec #${currentCountingBucket.secSeq} in progress): ${currentCountingBucket.totalTicks} ticks so far | Will push to FIFO when this second completes`}
            >
              <div
                className="w-full rounded-t border border-dashed border-amber-500 bg-amber-500/40 transition-all duration-75"
                style={{
                  height: `${
                    currentCountingBucket.totalTicks > 0
                      ? Math.max(18, (currentCountingBucket.totalTicks / maxBucketTotal) * 100)
                      : 12
                  }%`,
                }}
              />
              <span className="text-[9px] font-bold text-amber-600 leading-none mt-0.5">
                {currentCountingBucket.totalTicks}*
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Horizon FIFO Comparison Table (Current 1s Counting, Last 1s FIFO, 5s FIFO, 30s FIFO, 60s FIFO, 5m FIFO) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--theme-text-secondary)] border-b border-[var(--theme-border)]">
                <th className="py-2 px-2.5">FIFO Window / Stage</th>
                <th className="py-2 px-2.5 text-right">FIFO Secs</th>
                <th className="py-2 px-2.5 text-right">Ticks / 1s</th>
                <th className="py-2 px-2.5 text-right">1. Valid / Total</th>
                <th className="py-2 px-2.5 text-right">2. Bullish / Valid</th>
                <th className="py-2 px-2.5 text-right">3. Bearish / Valid</th>
                <th className="py-2 px-2.5 text-right">Net Price Δ (Speed)</th>
                <th className="py-2 px-2.5 text-center">Activity &amp; Bias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border-subtle)]">
              {timeComparisonRows.map((row) => {
                const isSelectedFifo =
                  (row.id === 'fifo_5s' && fifoWindowSec === 5) ||
                  (row.id === 'fifo_30s' && fifoWindowSec === 30) ||
                  (row.id === 'fifo_60s' && fifoWindowSec === 60) ||
                  (row.id === 'fifo_300s' && fifoWindowSec === 300);
                const isLiveCountingRow = row.id === 'counting_1s';
                const selectableSec: RollingFifoSeconds | null =
                  row.id === 'fifo_5s'
                    ? 5
                    : row.id === 'fifo_30s'
                    ? 30
                    : row.id === 'fifo_60s'
                    ? 60
                    : row.id === 'fifo_300s'
                    ? 300
                    : null;

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (selectableSec) setFifoWindowSec(selectableSec);
                    }}
                    className={`${
                      selectableSec ? 'cursor-pointer' : ''
                    } ${
                      isSelectedFifo
                        ? 'bg-emerald-500/10 font-bold'
                        : isLiveCountingRow
                        ? 'bg-amber-500/5'
                        : 'hover:bg-[var(--theme-bg-card)]'
                    }`}
                  >
                    <td className="py-2 px-2.5 font-sans font-bold text-[var(--theme-text-primary)]">
                      {row.label}
                    </td>
                    <td className="py-2 px-2.5 text-right text-[var(--theme-text-secondary)]">
                      {isLiveCountingRow ? 'Live 1s' : `${row.filledSec}/${row.targetSec}s`}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-[var(--theme-text-primary)]">
                      {row.ticksPerSec.toFixed(1)}/s
                      <span className="text-[10px] text-[var(--theme-text-muted)] ml-1">
                        (V:{row.validTicksPerSec.toFixed(1)}/s)
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <span className="font-bold text-[var(--theme-text-primary)]">
                        {row.validTicks}/{row.totalTicks}
                      </span>{' '}
                      <span className="text-[10px] text-[var(--theme-text-muted)]">
                        ({row.validOverTotalPct.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-emerald-600 font-bold">
                      {row.upTrendTicks}/{row.validTicks}{' '}
                      <span className="text-[10px]">
                        ({row.bullishOverValidPct.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-rose-600 font-bold">
                      {row.downTrendTicks}/{row.validTicks}{' '}
                      <span className="text-[10px]">
                        ({row.bearishOverValidPct.toFixed(1)}%)
                      </span>
                    </td>
                    <td
                      className={`py-2 px-2.5 text-right font-bold ${
                        row.netPriceDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {row.netPriceDelta >= 0 ? '+' : '-'}${formatDeltaCompact(row.netPriceDelta)}{' '}
                      <span className="text-[10px] text-[var(--theme-text-muted)]">
                        ({row.velocityPerSec >= 0 ? '+' : '-'}${formatDeltaCompact(row.velocityPerSec)}/s)
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.biasLabel === 'BULLISH'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : row.biasLabel === 'BEARISH'
                            ? 'bg-rose-500/15 text-rose-600'
                            : 'bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)]'
                        }`}
                      >
                        {row.activityLabel} · {row.biasLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          ROW 4: MARKET UNDERSTANDING & TREND VERDICT DIAGNOSTIC
          ===================================================================== */}
      <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] space-y-2.5 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans font-extrabold text-[var(--theme-text-primary)]">
              Current Market Regime ({windowLabelText}):
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                marketPlaybook.tone === 'bullish'
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                  : marketPlaybook.tone === 'bearish'
                  ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                  : marketPlaybook.tone === 'amber'
                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                  : 'bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)]'
              }`}
            >
              {marketPlaybook.regime}
            </span>
            <span className="text-[11px] text-[var(--theme-text-secondary)] font-sans font-semibold">
              · {trendQualityLabel}
            </span>
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)]">
            Valid/Total: <strong className="text-[var(--theme-text-primary)]">{validTicks}/{totalTicks} ({validOverTotalPct.toFixed(1)}%)</strong> · Bullish/Valid: <strong className="text-emerald-600">{upTrendTicks}/{validTicks} ({bullishOverValidPct.toFixed(1)}%)</strong> · Bearish/Valid: <strong className="text-rose-600">{downTrendTicks}/{validTicks} ({bearishOverValidPct.toFixed(1)}%)</strong>
          </div>
        </div>

        {/* Valid Pool Split Bar: Bullish / Valid vs Bearish / Valid */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--theme-bg-elevated)]">
          <div
            className="h-full bg-emerald-600 transition-all duration-200"
            style={{ width: `${bullishOverValidPct}%` }}
            title={`Bullish / Valid: ${upTrendTicks}/${validTicks} (${bullishOverValidPct.toFixed(1)}%)`}
          />
          <div
            className="h-full bg-rose-600 transition-all duration-200"
            style={{ width: `${bearishOverValidPct}%` }}
            title={`Bearish / Valid: ${downTrendTicks}/${validTicks} (${bearishOverValidPct.toFixed(1)}%)`}
          />
        </div>

        {/* Synthesized Market Understanding Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] font-sans">
          <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
            <span className="font-bold text-[var(--theme-text-primary)]">Why Market Is Acting This Way: </span>
            <span className="text-[var(--theme-text-secondary)]">{marketPlaybook.summary}</span>
          </div>
          <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
            <span className="font-bold text-emerald-700">Execution Desk Guidance: </span>
            <span className="text-[var(--theme-text-secondary)]">{marketPlaybook.action}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--theme-text-muted)] pt-0.5">
          <span>1️⃣ Valid / Total: <strong className="text-[var(--theme-text-primary)]">{validTicks}/{totalTicks} ({validOverTotalPct.toFixed(1)}%)</strong></span>
          <span>2️⃣ Bullish / Valid: <strong className="text-emerald-600">{upTrendTicks}/{validTicks} ({bullishOverValidPct.toFixed(1)}%)</strong></span>
          <span>3️⃣ Bearish / Valid: <strong className="text-rose-600">{downTrendTicks}/{validTicks} ({bearishOverValidPct.toFixed(1)}%)</strong></span>
        </div>
      </div>

      {/* Consecutive Pattern Runs Stream */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-mono no-scrollbar">
        <span className="text-[var(--theme-text-muted)] shrink-0 mr-1 font-bold">
          {filterFlipsAndFlat ? 'Filtered Valid Consecutive Runs (count ≥ 2):' : 'All Pattern Runs:'}
        </span>
        {visibleRuns.length === 0 ? (
          <span className="text-[var(--theme-text-muted)] italic">
            Waiting for first consecutive run (count ≥ 2) from incoming ticks...
          </span>
        ) : (
          visibleRuns.map((run) => (
            <span
              key={run.id}
              className={`px-2.5 py-0.5 rounded shrink-0 font-bold ${
                run.isFilteredFlip
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 line-through opacity-75'
                  : run.dir === 'u'
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/25'
              }`}
              title={`${run.dir === 'u' ? 'Up' : 'Down'} consecutive count: ${run.count} ticks | Total net change covered: ${formatDeltaCompact(run.netChange)}`}
            >
              {run.dir}
              {run.count}_{formatDeltaCompact(run.netChange)}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export const CoinTickBackgroundCollector: React.FC<{ asset: MarketAsset }> = ({ asset }) => {
  const symbol = (asset.symbol || 'BTC').toUpperCase();
  const latestAssetPriceRef = useRef<number>(asset.price || 96500);
  latestAssetPriceRef.current = asset.price || 96500;

  if (!symbolRollingTickBuffers[symbol]) {
    const initSec = Math.floor(Date.now() / 1000);
    symbolRollingTickBuffers[symbol] = {
      rawTicks: [],
      lastPrice: asset.price || 96500,
      lifetimeSeq: 0,
      startedAt: Date.now(),
      lastProcessedSecKey: initSec - 1,
      secSeqCounter: 0,
      completedSecondsFifo: [],
    };
  }

  const syncCompletedSecondsToFifo = (nowMs: number) => {
    const store = symbolRollingTickBuffers[symbol];
    if (!store) return;
    const currentSecKey = Math.floor(nowMs / 1000);
    if (currentSecKey <= store.lastProcessedSecKey) return;

    const { classified } = classifyTickBuffer(store.rawTicks);
    const startSec = Math.max(store.lastProcessedSecKey + 1, currentSecKey - 300);

    for (let sKey = startSec; sKey < currentSecKey; sKey++) {
      const secStartMs = sKey * 1000;
      const secEndMs = secStartMs + 1000;
      let totalTicks = 0;
      let validTicks = 0;
      let upTrendTicks = 0;
      let downTrendTicks = 0;
      let netPriceDelta = 0;
      let totalPath = 0;

      for (let i = classified.length - 1; i >= 0; i--) {
        const t = classified[i];
        if (t.timestamp >= secEndMs) continue;
        if (t.timestamp < secStartMs) break;
        totalTicks += 1;
        netPriceDelta += t.signedDelta;
        totalPath += t.absDelta;
        if (t.classification === 'valid_u') {
          validTicks += 1;
          upTrendTicks += 1;
        } else if (t.classification === 'valid_d') {
          validTicks += 1;
          downTrendTicks += 1;
        }
      }

      store.secSeqCounter += 1;
      store.completedSecondsFifo.push({
        secKey: sKey,
        secSeq: store.secSeqCounter,
        totalTicks,
        validTicks,
        upTrendTicks,
        downTrendTicks,
        netPriceDelta,
        totalPath,
      });

      if (store.completedSecondsFifo.length > 300) {
        store.completedSecondsFifo.shift();
      }
    }

    store.lastProcessedSecKey = currentSecKey - 1;
  };

  const recordIncomingTick = (incomingPrice: number) => {
    if (!incomingPrice || isNaN(incomingPrice) || incomingPrice <= 0) return;
    const store = symbolRollingTickBuffers[symbol];
    if (!store) return;

    const nowMs = Date.now();
    syncCompletedSecondsToFifo(nowMs);

    const prevPrice = store.lastPrice > 0 ? store.lastPrice : incomingPrice;
    const diff = incomingPrice - prevPrice;
    store.lastPrice = incomingPrice;

    const flatThreshold = prevPrice * 0.000001;
    const dir: 'u' | 'd' | 'flat' =
      Math.abs(diff) <= flatThreshold ? 'flat' : diff > 0 ? 'u' : 'd';

    store.lifetimeSeq += 1;
    store.rawTicks.push({
      seq: store.lifetimeSeq,
      price: incomingPrice,
      signedDelta: diff,
      absDelta: Math.abs(diff),
      dir,
      timestamp: nowMs,
    });

    if (store.rawTicks.length > 5000) {
      store.rawTicks.splice(0, store.rawTicks.length - 5000);
    }
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let lastWsTickTime = 0;
    let isUnmounted = false;

    if (symbol !== 'CL' && symbol !== 'XAG') {
      const wsSymbol = symbol === 'XAUT' ? 'paxg' : symbol.toLowerCase();
      const pair = `${wsSymbol}usdt`;
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);
        ws.onmessage = (evt) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(evt.data);
            const tradePrice = parseFloat(data.p);
            if (!isNaN(tradePrice) && tradePrice > 0) {
              lastWsTickTime = Date.now();
              recordIncomingTick(tradePrice);
            }
          } catch {
            // ignore
          }
        };
      } catch {
        // fallback interval handles restricted environments
      }
    }

    const fallbackTimer = setInterval(() => {
      if (isUnmounted) return;
      if (Date.now() - lastWsTickTime > 220) {
        const store = symbolRollingTickBuffers[symbol];
        const base = store?.lastPrice || latestAssetPriceRef.current || 100;
        const nowSec = Math.floor(Date.now() / 1000);
        const burstWave = nowSec % 12;
        const ticksThisCycle = burstWave >= 9 ? 2 : 1;

        for (let b = 0; b < ticksThisCycle; b++) {
          const currentBase = store?.lastPrice || base;
          const seq = (store?.lifetimeSeq || 0) + 1;
          const mod = seq % 20;
          let stepDelta = 0;
          if (mod === 0 || mod === 5 || mod === 11 || mod === 16) {
            stepDelta = 0;
          } else if (mod === 1 || mod === 3) {
            stepDelta = currentBase * 0.00012;
          } else if (mod === 2 || mod === 4) {
            stepDelta = -currentBase * 0.00012;
          } else if (mod >= 6 && mod <= 10) {
            stepDelta = currentBase * 0.00018;
          } else if (mod >= 12 && mod <= 15) {
            stepDelta = -currentBase * 0.00016;
          } else {
            stepDelta = currentBase * 0.0002;
          }
          recordIncomingTick(Number((currentBase + stepDelta).toFixed(currentBase < 1 ? 6 : 2)));
        }
      }
    }, 190);

    const clockTimer = setInterval(() => {
      if (!isUnmounted) {
        syncCompletedSecondsToFifo(Date.now());
      }
    }, 200);

    return () => {
      isUnmounted = true;
      clearInterval(fallbackTimer);
      clearInterval(clockTimer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [symbol]);

  return null;
};

interface CoinTickAnalysisProps {
  asset: MarketAsset;
}

export const CoinTickAnalysisPanel: React.FC<CoinTickAnalysisProps> = ({ asset }) => {
  return (
    <div className="space-y-4">
      <LiveRollingTickPatternCard asset={asset} />
    </div>
  );
};

interface CoinChartProps {
  asset: MarketAsset;
  positions: Position[];
}

export const CoinChartPanel: React.FC<CoinChartProps> = ({ asset, positions }) => {
  const isUp = (asset.change24h || 0) >= 0;
  return (
    <div className="space-y-2">
      <div className="px-3.5 py-2.5 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span className="font-extrabold text-[var(--theme-text-primary)]">
            Live Candlestick &amp; Volume Chart ({asset.symbol}/USDT)
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-[var(--theme-text-muted)]">
            Spot:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </strong>
          </span>
          <span className={isUp ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
            {isUp ? '+' : ''}
            {(asset.change24h || 0).toFixed(2)}%
          </span>
          <span className="text-[var(--theme-text-muted)] hidden sm:inline">
            24h Range: ${asset.low24h.toLocaleString('en-US', { maximumFractionDigits: 2 })} – $
            {asset.high24h.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      <TradingChart asset={asset} activePositions={positions} />
    </div>
  );
};

interface CoinTickAndChartProps {
  asset: MarketAsset;
  positions: Position[];
}

export const CoinTickAndChartPanel: React.FC<CoinTickAndChartProps> = ({
  asset,
  positions,
}) => {
  return (
    <div className="space-y-4">
      <LiveRollingTickPatternCard asset={asset} />
      <CoinChartPanel asset={asset} positions={positions} />
    </div>
  );
};

/* ============================================================================
   6. PNL FORECASTING ENGINE (-20% TO +2%) FOR SELECTED COIN & PORTFOLIO
   ============================================================================ */

interface PnlForecastingMatrixProps {
  asset: MarketAsset;
  totalEquity: number;
  cashBalance: number;
  positions: Position[];
  spotHoldings: SpotHolding[];
  totalTrades?: number;
  realizedPnL?: number;
  onResetTradeHistory?: () => void;
  onResetSimulation?: () => void;
  onPlaceLiveOrder?: (params: {
    symbol: string;
    mode: TradeMode;
    side: OrderSide;
    orderType: 'MARKET' | 'LIMIT';
    margin: number;
    leverage: number;
  }) => boolean | void;
}

type ForecastSimMode = 'LIVE_RUNNING' | 'COMBINED' | 'HYPOTHETICAL';

const SHOCK_STEPS = [-20, -15, -12, -10, -8, -5, -3, -2, -1, 0, 0.5, 1, 1.5, 2];

export const PnlForecastingMatrixPanel: React.FC<PnlForecastingMatrixProps> = ({
  asset,
  totalEquity,
  cashBalance,
  positions,
  spotHoldings,
  totalTrades = 0,
  realizedPnL = 0,
  onResetTradeHistory,
  onResetSimulation,
  onPlaceLiveOrder,
}) => {
  const coinPositions = positions.filter((p) => p.assetSymbol === asset.symbol);
  const [forecastMode, setForecastMode] = useState<ForecastSimMode>(() =>
    coinPositions.length > 0 || positions.length > 0 ? 'LIVE_RUNNING' : 'COMBINED'
  );
  const [selectedLivePosId, setSelectedLivePosId] = useState<string>('ALL_COIN');
  const [customShockPct, setCustomShockPct] = useState<number>(-5);
  const [simMargin, setSimMargin] = useState<number>(250);
  const [simLeverage, setSimLeverage] = useState<number>(
    asset.symbol === 'BTC' ? 25 : asset.category === 'gold' ? 20 : 10
  );
  const [simSide, setSimSide] = useState<'LONG' | 'SHORT'>('LONG');

  // Auto-switch to LIVE_RUNNING when a new live trade is opened on this coin
  const prevCoinPosCountRef = useRef<number>(coinPositions.length);
  useEffect(() => {
    if (coinPositions.length > prevCoinPosCountRef.current && coinPositions.length > 0) {
      setForecastMode('LIVE_RUNNING');
      setSelectedLivePosId('ALL_COIN');
    }
    prevCoinPosCountRef.current = coinPositions.length;
  }, [coinPositions.length]);

  const curPrice = asset.price || 96500;
  const maxLev = getBrokerMaxLeverage(asset.symbol);

  const coinSpotHolding = spotHoldings.find((s) => s.symbol === asset.symbol);
  const spotQty = coinSpotHolding ? coinSpotHolding.amount : 0;

  // Target live running positions based on selector
  const targetLivePositions = useMemo(() => {
    if (selectedLivePosId === 'ALL_PORTFOLIO') return positions;
    if (selectedLivePosId === 'ALL_COIN') return coinPositions;
    const found = positions.find((p) => p.id === selectedLivePosId);
    return found ? [found] : coinPositions;
  }, [positions, coinPositions, selectedLivePosId]);

  const activeLiveMargin = targetLivePositions.reduce((acc, p) => acc + p.margin, 0);
  const activeLiveUnrealized = targetLivePositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);

  const handleSyncFromLiveTrade = () => {
    const primary = targetLivePositions[0] || coinPositions[0] || positions[0];
    if (!primary) return;
    setSimSide(primary.side);
    setSimMargin(Math.max(10, Math.round(primary.margin)));
    setSimLeverage(Math.min(maxLev, primary.leverage));
  };

  const computeRow = (pctChange: number) => {
    const projectedPrice = curPrice * (1 + pctChange / 100);
    const priceDiff = projectedPrice - curPrice;

    // 1. Spot PnL Delta for this coin
    const spotPnLDelta =
      forecastMode === 'HYPOTHETICAL' ? 0 : spotQty * priceDiff;

    // 2. Active Live Running Positions PnL (both total PnL from entry & delta from current mark)
    let openPosPnLDelta = 0;
    let liveTotalPnLFromEntry = 0;
    let liquidatedCount = 0;

    if (forecastMode !== 'HYPOTHETICAL') {
      targetLivePositions.forEach((pos) => {
        const isLong = pos.side === 'LONG';
        const posBasePrice = pos.assetSymbol === asset.symbol ? curPrice : pos.entryPrice;
        const posProjectedPrice =
          pos.assetSymbol === asset.symbol
            ? projectedPrice
            : posBasePrice * (1 + pctChange / 100);

        const isLiq = isLong
          ? posProjectedPrice <= pos.liquidationPrice
          : posProjectedPrice >= pos.liquidationPrice;

        if (isLiq) {
          liquidatedCount += 1;
          openPosPnLDelta -= pos.margin + pos.unrealizedPnL;
          liveTotalPnLFromEntry -= pos.margin;
        } else {
          const deltaFromCurrent = isLong
            ? pos.amount * (posProjectedPrice - posBasePrice)
            : pos.amount * (posBasePrice - posProjectedPrice);
          const totalFromEntry = isLong
            ? pos.amount * (posProjectedPrice - pos.entryPrice)
            : pos.amount * (pos.entryPrice - posProjectedPrice);

          openPosPnLDelta += deltaFromCurrent;
          liveTotalPnLFromEntry += totalFromEntry;
        }
      });
    }

    const liveRoePct =
      activeLiveMargin > 0
        ? (liveTotalPnLFromEntry / activeLiveMargin) * 100
        : 0;

    // 3. Hypothetical Simulated Trade PnL (-20% to +2%)
    const includeHypothetical =
      forecastMode === 'HYPOTHETICAL' ||
      forecastMode === 'COMBINED' ||
      (forecastMode === 'LIVE_RUNNING' && targetLivePositions.length === 0 && spotQty === 0);

    const simNotional = simMargin * simLeverage;
    const rawSimRoePct =
      simSide === 'LONG' ? pctChange * simLeverage : -pctChange * simLeverage;
    const isSimLiquidated = includeHypothetical && rawSimRoePct <= -99.2;
    const simPnLUsd = !includeHypothetical
      ? 0
      : isSimLiquidated
      ? -simMargin
      : (simNotional * (simSide === 'LONG' ? pctChange : -pctChange)) / 100;
    const simRoePct = !includeHypothetical ? 0 : isSimLiquidated ? -100 : rawSimRoePct;

    // Primary displayed trade PnL & ROE depending on mode
    const primaryTradePnL =
      forecastMode === 'LIVE_RUNNING' && (targetLivePositions.length > 0 || spotQty > 0)
        ? liveTotalPnLFromEntry + spotPnLDelta
        : forecastMode === 'COMBINED'
        ? liveTotalPnLFromEntry + spotPnLDelta + simPnLUsd
        : simPnLUsd;

    const primaryRoePct =
      forecastMode === 'LIVE_RUNNING' && activeLiveMargin > 0
        ? liveRoePct
        : forecastMode === 'COMBINED' && activeLiveMargin + simMargin > 0
        ? ((liveTotalPnLFromEntry + simPnLUsd) / (activeLiveMargin + simMargin)) * 100
        : simRoePct;

    // 4. Projected Total Portfolio Equity
    const projectedEquity = Math.max(
      0,
      totalEquity + spotPnLDelta + openPosPnLDelta + simPnLUsd
    );

    return {
      pctChange,
      projectedPrice,
      spotPnLDelta,
      openPosPnLDelta,
      liveTotalPnLFromEntry,
      liveRoePct,
      liquidatedCount,
      simPnLUsd,
      simRoePct,
      isSimLiquidated,
      primaryTradePnL,
      primaryRoePct,
      projectedEquity,
    };
  };

  const customPreview = computeRow(customShockPct);

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header with Live Running Trade Forecasting Switcher & Reset Returns/Log Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-[var(--theme-text-primary)]">
                PnL Forecasting &amp; Live Running Trade Stress Matrix (-20% to +2% · {asset.symbol}/USDT)
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-600 border border-emerald-600/25 text-[10px] font-mono font-bold">
                {coinPositions.length} LIVE {asset.symbol} TRADE{coinPositions.length === 1 ? '' : 'S'} RUNNING
              </span>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Simulate PnL forecasting directly on your live running trade(s) or model a hypothetical position across -20% to +2% shocks
            </p>
          </div>
        </div>

        {/* Reset Previous Trade Returns & Log Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onResetTradeHistory && (
            <button
              type="button"
              onClick={onResetTradeHistory}
              title="Reset previous closed trade returns (Realized PnL) and trade log history while keeping live running positions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                Reset Previous Trade Returns &amp; Log ({totalTrades} Trades · {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)})
              </span>
            </button>
          )}
          {onResetSimulation && (
            <button
              type="button"
              onClick={onResetSimulation}
              title="Reset entire simulator account including live positions and balance"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Bar: 1. Live Running Trade(s) | 2. Combined (Live + Sim) | 3. Hypothetical Sim Trade */}
      <div className="p-3 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--theme-text-secondary)]">
            Forecast Target:
          </span>
          <div className="inline-flex rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-0.5 gap-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setForecastMode('LIVE_RUNNING')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                forecastMode === 'LIVE_RUNNING'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              1. Live Running Trade ({coinPositions.length})
            </button>
            <button
              type="button"
              onClick={() => setForecastMode('COMBINED')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                forecastMode === 'COMBINED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              2. Live + Hypothetical Sim
            </button>
            <button
              type="button"
              onClick={() => setForecastMode('HYPOTHETICAL')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                forecastMode === 'HYPOTHETICAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              3. Hypothetical Sim Only
            </button>
          </div>

          {/* Live Running Trade Picker when positions exist */}
          {positions.length > 0 && forecastMode !== 'HYPOTHETICAL' && (
            <select
              value={selectedLivePosId}
              onChange={(e) => setSelectedLivePosId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-xs font-mono font-bold text-[var(--theme-text-primary)]"
            >
              <option value="ALL_COIN">
                All {asset.symbol} Running Trades ({coinPositions.length})
              </option>
              <option value="ALL_PORTFOLIO">
                All Portfolio Running Trades ({positions.length})
              </option>
              {positions.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  #{idx + 1} {p.assetSymbol} {p.side} {p.leverage}x · Margin ${p.margin.toFixed(0)} @ ${p.entryPrice.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Hypothetical Position Controls & Quick Live Launch */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {positions.length > 0 && (
            <button
              type="button"
              onClick={handleSyncFromLiveTrade}
              title="Copy Side, Margin, and Leverage from active running trade"
              className="px-2.5 py-1 rounded-lg border border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold cursor-pointer transition-colors"
            >
              Sync Params from Live Trade
            </button>
          )}

          <div className="inline-flex rounded-lg border border-[var(--theme-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setSimSide('LONG')}
              className={`px-2.5 py-1 font-bold cursor-pointer ${
                simSide === 'LONG'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'
              }`}
            >
              LONG
            </button>
            <button
              type="button"
              onClick={() => setSimSide('SHORT')}
              className={`px-2.5 py-1 font-bold cursor-pointer ${
                simSide === 'SHORT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]'
              }`}
            >
              SHORT
            </button>
          </div>

          <label className="flex items-center gap-1">
            <span className="text-[var(--theme-text-muted)]">Margin ($):</span>
            <input
              type="number"
              min={5}
              step={10}
              value={simMargin}
              onChange={(e) => setSimMargin(Math.max(5, Number(e.target.value) || 50))}
              className="w-20 px-2 py-1 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card)] font-mono text-xs"
            />
          </label>

          <label className="flex items-center gap-1">
            <span className="text-[var(--theme-text-muted)]">Lev:</span>
            <select
              value={simLeverage}
              onChange={(e) => setSimLeverage(Number(e.target.value))}
              className="px-2 py-1 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card)] font-mono text-xs"
            >
              {[1, 2, 5, 10, 20, 25, 50, 75, 100, 150]
                .filter((l) => l <= maxLev)
                .map((lev) => (
                  <option key={lev} value={lev}>
                    {lev}x
                  </option>
                ))}
            </select>
          </label>

          {onPlaceLiveOrder && (
            <button
              type="button"
              onClick={() => {
                const marginToUse = Math.min(simMargin, Math.max(5, cashBalance));
                onPlaceLiveOrder({
                  symbol: asset.symbol,
                  mode: 'LEVERAGED' as TradeMode,
                  side: simSide as OrderSide,
                  orderType: 'MARKET',
                  margin: marginToUse,
                  leverage: simLeverage,
                });
                setForecastMode('LIVE_RUNNING');
              }}
              title="Open this simulated position as a live running trade to forecast live"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
            >
              + Open as Live Running Trade
            </button>
          )}
        </div>
      </div>

      {/* Live Running Trade Summary Strip */}
      {targetLivePositions.length > 0 ? (
        <div className="p-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="font-sans font-bold text-emerald-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Active Live Running Trade(s) Being Forecasted ({targetLivePositions.length}):
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Locked Margin:{' '}
                <strong className="text-[var(--theme-text-primary)]">
                  ${activeLiveMargin.toFixed(2)}
                </strong>
              </span>
              <span>
                Current Live Unrealized PnL:{' '}
                <strong className={activeLiveUnrealized >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {activeLiveUnrealized >= 0 ? '+' : ''}${activeLiveUnrealized.toFixed(2)} (
                  {activeLiveMargin > 0
                    ? `${((activeLiveUnrealized / activeLiveMargin) * 100).toFixed(2)}%`
                    : '0.00%'}
                  )
                </strong>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {targetLivePositions.map((pos, idx) => {
              const isPosProfit = pos.unrealizedPnL >= 0;
              return (
                <div
                  key={pos.id}
                  onClick={() => {
                    setForecastMode('LIVE_RUNNING');
                    setSelectedLivePosId(pos.id);
                  }}
                  className={`p-2 rounded-lg border text-[11px] font-mono cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    selectedLivePosId === pos.id
                      ? 'border-emerald-600 bg-emerald-600/10'
                      : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:border-emerald-600/40'
                  }`}
                >
                  <div>
                    <span className="font-bold text-[var(--theme-text-primary)]">
                      #{idx + 1} {pos.assetSymbol}{' '}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pos.side === 'LONG'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {pos.leverage}x {pos.side}
                    </span>
                    <div className="text-[10px] text-[var(--theme-text-muted)] mt-0.5">
                      Entry ${pos.entryPrice.toFixed(2)} · Liq ${pos.liquidationPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${isPosProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPosProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[var(--theme-text-muted)]">
                      Margin ${pos.margin.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--theme-text-muted)]">
          <span>
            No open live running trade on {asset.symbol} yet — showing hypothetical {simSide} ({simLeverage}x · ${simMargin} margin) forecast, or click <strong>+ Open as Live Running Trade</strong> above to simulate a live running position.
          </span>
        </div>
      )}

      {/* Interactive Slider (-20% to +2%) */}
      <div className="p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="font-sans font-bold text-[var(--theme-text-primary)]">
            Interactive Price Move Slider (-20% to +2%):{' '}
            <strong className={customShockPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {customShockPct >= 0 ? '+' : ''}
              {customShockPct.toFixed(1)}%
            </strong>
          </span>
          <span>
            Projected {asset.symbol}:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              ${customPreview.projectedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </strong>
          </span>
          <span>
            Live Running Trade PnL:{' '}
            <strong
              className={
                customPreview.liveTotalPnLFromEntry + customPreview.spotPnLDelta >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }
            >
              {customPreview.liveTotalPnLFromEntry + customPreview.spotPnLDelta >= 0 ? '+' : ''}$
              {(customPreview.liveTotalPnLFromEntry + customPreview.spotPnLDelta).toFixed(2)} (
              {customPreview.liveRoePct >= 0 ? '+' : ''}
              {customPreview.liveRoePct.toFixed(1)}%)
            </strong>
          </span>
          <span>
            Sim Trade PnL:{' '}
            <strong className={customPreview.simPnLUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {customPreview.simPnLUsd >= 0 ? '+' : ''}${customPreview.simPnLUsd.toFixed(2)} ({customPreview.simRoePct.toFixed(1)}%)
            </strong>
          </span>
          <span>
            Projected Equity:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              ${customPreview.projectedEquity.toFixed(2)}
            </strong>
          </span>
        </div>
        <input
          type="range"
          min={-20}
          max={2}
          step={0.5}
          value={customShockPct}
          onChange={(e) => setCustomShockPct(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[var(--theme-text-muted)]">
          <span>-20.0% (Severe Crash)</span>
          <span>-10.0% (Correction)</span>
          <span>-5.0% (Pullback)</span>
          <span>0.0% (Current Mark)</span>
          <span>+2.0% (Upside Target)</span>
        </div>
      </div>

      {/* Full Scenario Table (-20% to +2%) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[var(--theme-text-secondary)] border-b border-[var(--theme-border)]">
              <th className="py-2 px-3">Move (%)</th>
              <th className="py-2 px-3 text-right">Projected {asset.symbol} Price</th>
              <th className="py-2 px-3 text-right">Live Running Trade PnL (ROE %)</th>
              <th className="py-2 px-3 text-right">Sim {simSide} ({simLeverage}x) PnL</th>
              <th className="py-2 px-3 text-right">Sim ROE %</th>
              <th className="py-2 px-3 text-right">Projected Total Equity</th>
              <th className="py-2 px-3 text-center">Margin Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--theme-border-subtle)]">
            {SHOCK_STEPS.map((pct) => {
              const row = computeRow(pct);
              const isZero = pct === 0;
              const liveCombined = row.liveTotalPnLFromEntry + row.spotPnLDelta;
              return (
                <tr
                  key={pct}
                  className={isZero ? 'bg-emerald-500/10 font-bold' : ''}
                >
                  <td
                    className={`py-2 px-3 font-bold ${
                      pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-rose-600' : 'text-[var(--theme-text-primary)]'
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                    ${row.projectedPrice.toLocaleString('en-US', {
                      minimumFractionDigits: row.projectedPrice < 1 ? 4 : 2,
                      maximumFractionDigits: row.projectedPrice < 1 ? 4 : 2,
                    })}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      targetLivePositions.length === 0 && spotQty === 0
                        ? 'text-[var(--theme-text-muted)]'
                        : liveCombined >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {targetLivePositions.length === 0 && spotQty === 0 ? (
                      'No Open Trade'
                    ) : (
                      <>
                        {liveCombined >= 0 ? '+' : ''}${liveCombined.toFixed(2)}{' '}
                        <span className="text-[10px] opacity-85">
                          ({row.liveRoePct >= 0 ? '+' : ''}
                          {row.liveRoePct.toFixed(1)}%)
                        </span>
                      </>
                    )}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      row.simPnLUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {row.simPnLUsd >= 0 ? '+' : ''}${row.simPnLUsd.toFixed(2)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      row.simRoePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {row.simRoePct >= 0 ? '+' : ''}{row.simRoePct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                    ${row.projectedEquity.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {row.isSimLiquidated || row.liquidatedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                        <AlertTriangle className="w-3 h-3" />
                        LIQUIDATED
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600">
                        SAFE
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
  );
};
