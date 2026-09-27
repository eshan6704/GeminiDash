import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MarketAsset,
  Position,
  SpotHolding,
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
        ? 620000000
        : volume24h * 14.5;

    const marketCap = extraCoinMeta?.marketCap || defaultCap;
    const fdv = marketCap * (sym === 'BTC' ? 1.05 : 1.18);
    const circulatingSupply = extraCoinMeta?.circulatingSupply || marketCap / Math.max(price, 0.0001);
    const maxSupply = sym === 'BTC' ? 21000000 : sym === 'PAXG' ? circulatingSupply : circulatingSupply * 1.2;
    const change1h = extraCoinMeta?.change1h ?? Number((change24h * 0.18).toFixed(2));
    const change7d = extraCoinMeta?.change7d ?? Number((change24h * 2.35).toFixed(2));
    const rank =
      extraCoinMeta?.rank ||
      (sym === 'BTC' ? 1 : sym === 'ETH' ? 2 : sym === 'XRP' ? 4 : sym === 'SOL' ? 5 : sym === 'DOGE' ? 8 : sym === 'PAXG' ? 42 : 25);

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

        {/* Quick Coin Selector Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--theme-text-muted)] mr-1">
            Quick Switch:
          </span>
          {Object.keys(allAssets).map((sym) => {
            const active = sym === asset.symbol;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => onSelectSymbol(sym)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-elevated)]'
                }`}
              >
                {sym}
              </button>
            );
          })}
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
   - Pattern format: u12_6.7 -> 'u'/'d' = direction, 12 = consecutive count of
     similar direction ticks, 6.7 = total net price change covered by those 12 ticks.
   - Filters out 'u1d1' single-tick alternating flips and 'flat' (0-change) ticks
     from consecutive trend runs, while counting Flat & Flipping ticks out of total
     ticks (e.g. 500 ticks) to quantify Trend Quality.
   ============================================================================ */

interface ConsecutiveRunRecord {
  id: string;
  dir: 'u' | 'd';
  count: number; // 1st number: consecutive count of similar pattern
  netChange: number; // 2nd number after '_': total net change covered by count
  endPrice: number;
  timestamp: number;
  isFilteredFlip?: boolean; // true if count === 1 (u1d1 flip noise)
}

interface CoinTickAndChartProps {
  asset: MarketAsset;
  positions: Position[];
}

export const CoinTickAndChartPanel: React.FC<CoinTickAndChartProps> = ({
  asset,
  positions,
}) => {
  // Latest consecutive run signatures (e.g., u12_6.7 and d15_5.6)
  const [latestUpRun, setLatestUpRun] = useState<{ count: number; net: number }>({
    count: 12,
    net: 6.7,
  });
  const [latestDownRun, setLatestDownRun] = useState<{ count: number; net: number }>({
    count: 15,
    net: 5.6,
  });

  // 500-tick window distribution counters (seeded with the exact 500-tick benchmark example:
  // Up = 150/500, Down = 50/500, Flat = 200/500, Flip (u1d1) = 100/500)
  const [upTrendTicks, setUpTrendTicks] = useState<number>(150);
  const [downTrendTicks, setDownTrendTicks] = useState<number>(50);
  const [flatTicks, setFlatTicks] = useState<number>(200);
  const [flipTicks, setFlipTicks] = useState<number>(100);

  // Filter toggle: hide u1d1 single-tick flips & flat ticks from pattern tape
  const [filterFlipsAndFlat, setFilterFlipsAndFlat] = useState<boolean>(true);

  // Consecutive run history tape
  const [patternRuns, setPatternRuns] = useState<ConsecutiveRunRecord[]>([
    { id: 'seed-1', dir: 'u', count: 12, netChange: 6.7, endPrice: asset.price, timestamp: Date.now() - 25000 },
    { id: 'seed-2', dir: 'd', count: 15, netChange: 5.6, endPrice: asset.price, timestamp: Date.now() - 20000 },
    { id: 'seed-3', dir: 'u', count: 1, netChange: 0.2, endPrice: asset.price, timestamp: Date.now() - 18000, isFilteredFlip: true },
    { id: 'seed-4', dir: 'd', count: 1, netChange: 0.1, endPrice: asset.price, timestamp: Date.now() - 16000, isFilteredFlip: true },
    { id: 'seed-5', dir: 'u', count: 9, netChange: 4.8, endPrice: asset.price, timestamp: Date.now() - 12000 },
    { id: 'seed-6', dir: 'd', count: 6, netChange: 2.4, endPrice: asset.price, timestamp: Date.now() - 8000 },
    { id: 'seed-7', dir: 'u', count: 14, netChange: 8.1, endPrice: asset.price, timestamp: Date.now() - 3000 },
  ]);

  // Active ongoing run state ref for real-time incoming ticks
  const activeRunRef = useRef<{ dir: 'u' | 'd' | null; count: number; netChange: number }>({
    dir: 'u',
    count: 12,
    netChange: 6.7,
  });
  const prevPriceRef = useRef<number>(asset.price);
  const prevSymbolRef = useRef<string>(asset.symbol);

  // Reset baseline to 500-tick distribution & u12_6.7 / d15_5.6 when switching coins
  useEffect(() => {
    if (prevSymbolRef.current !== asset.symbol) {
      prevSymbolRef.current = asset.symbol;
      prevPriceRef.current = asset.price;
      setLatestUpRun({ count: 12, net: 6.7 });
      setLatestDownRun({ count: 15, net: 5.6 });
      setUpTrendTicks(150);
      setDownTrendTicks(50);
      setFlatTicks(200);
      setFlipTicks(100);
      activeRunRef.current = { dir: 'u', count: 12, netChange: 6.7 };
      setPatternRuns([
        { id: `${asset.symbol}-1`, dir: 'u', count: 12, netChange: 6.7, endPrice: asset.price, timestamp: Date.now() - 15000 },
        { id: `${asset.symbol}-2`, dir: 'd', count: 15, netChange: 5.6, endPrice: asset.price, timestamp: Date.now() - 10000 },
        { id: `${asset.symbol}-3`, dir: 'u', count: 9, netChange: 4.8, endPrice: asset.price, timestamp: Date.now() - 5000 },
      ]);
    }
  }, [asset.symbol, asset.price]);

  // Process incoming live price ticks into consecutive runs, flat ticks, and u1d1 flips
  useEffect(() => {
    const diff = asset.price - prevPriceRef.current;
    prevPriceRef.current = asset.price;

    // Flat threshold: 0 price change or ultra-micro noise (< 0.00001% of price)
    const flatThreshold = asset.price * 0.000005;
    if (Math.abs(diff) <= flatThreshold) {
      setFlatTicks((f) => f + 1);
      return;
    }

    const dir: 'u' | 'd' = diff > 0 ? 'u' : 'd';
    const absDelta = Math.abs(diff);
    const currentRun = activeRunRef.current;

    if (currentRun.dir === dir) {
      // Continues the same consecutive pattern run!
      const newCount = currentRun.count + 1;
      const newNet = Number((currentRun.netChange + absDelta).toFixed(4));
      activeRunRef.current = { dir, count: newCount, netChange: newNet };

      if (dir === 'u') {
        setLatestUpRun({ count: newCount, net: newNet });
        // If this just transitioned from 1 tick to 2 consecutive ticks, count both as trend ticks
        setUpTrendTicks((u) => u + (newCount === 2 ? 2 : 1));
      } else {
        setLatestDownRun({ count: newCount, net: newNet });
        setDownTrendTicks((d) => d + (newCount === 2 ? 2 : 1));
      }

      // Update or prepend the active consecutive run in the tape
      setPatternRuns((prev) => {
        const updated: ConsecutiveRunRecord = {
          id: prev[0] && prev[0].dir === dir && !prev[0].isFilteredFlip ? prev[0].id : `${Date.now()}-${Math.random()}`,
          dir,
          count: newCount,
          netChange: newNet,
          endPrice: asset.price,
          timestamp: Date.now(),
          isFilteredFlip: false,
        };
        if (prev[0] && prev[0].dir === dir && !prev[0].isFilteredFlip) {
          return [updated, ...prev.slice(1, 24)];
        }
        return [updated, ...prev.slice(0, 24)];
      });
    } else {
      // Direction flipped! Check if the previous run was a single-tick flip (u1 or d1 -> u1d1 pattern)
      if (currentRun.dir !== null && currentRun.count === 1) {
        // Previous run only lasted 1 tick before flipping -> classify as u1d1 Flipping tick!
        setFlipTicks((fl) => fl + 1);
        setPatternRuns((prev) => [
          {
            id: `${Date.now()}-flip`,
            dir: currentRun.dir!,
            count: 1,
            netChange: currentRun.netChange,
            endPrice: asset.price,
            timestamp: Date.now(),
            isFilteredFlip: true,
          },
          ...prev.slice(0, 24),
        ]);
      }

      // Start new run with count = 1
      activeRunRef.current = { dir, count: 1, netChange: Number(absDelta.toFixed(4)) };
    }
  }, [asset.price]);

  // Format net change cleanly (e.g. u12_6.7, d15_5.6)
  const formatDeltaCompact = (val: number) => {
    if (val >= 100) return val.toFixed(1);
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(3);
  };

  const uCode = `u${latestUpRun.count}_${formatDeltaCompact(latestUpRun.net)}`;
  const dCode = `d${latestDownRun.count}_${formatDeltaCompact(latestDownRun.net)}`;

  // Mutually exclusive tick buckets:
  // - flatTicks: 0-change ticks
  // - flipTicks: u1d1 single-tick alternating flips (NEVER counted in upTrendTicks or downTrendTicks)
  // - upTrendTicks: consecutive up runs (count >= 2 only)
  // - downTrendTicks: consecutive down runs (count >= 2 only)
  const totalTicks = flatTicks + flipTicks + upTrendTicks + downTrendTicks;
  const safeTotalTicks = Math.max(1, totalTicks);

  // Step 1: Flat / Total Tick
  const flatOverTotalPct = (flatTicks / safeTotalTicks) * 100;

  // Step 2: Flip / (Total - Flat)
  const totalMinusFlat = Math.max(0, totalTicks - flatTicks);
  const safeTotalMinusFlat = Math.max(1, totalMinusFlat);
  const flipOverNonFlatPct = totalMinusFlat > 0 ? (flipTicks / safeTotalMinusFlat) * 100 : 0;

  // Step 3 & 4: Bullish / (Total - Flat - Flip) & Bearish / (Total - Flat - Flip)
  // Since up/down ticks in u1d1 flipping are never counted in Bullish/Bearish,
  // (Total - Flat - Flip) equals pure consecutive trend ticks (upTrendTicks + downTrendTicks).
  const totalMinusFlatMinusFlip = Math.max(0, totalTicks - flatTicks - flipTicks);
  const safePureTrendTicks = Math.max(1, totalMinusFlatMinusFlip);
  const bullishOverTrendPct =
    totalMinusFlatMinusFlip > 0 ? (upTrendTicks / safePureTrendTicks) * 100 : 0;
  const bearishOverTrendPct =
    totalMinusFlatMinusFlip > 0 ? (downTrendTicks / safePureTrendTicks) * 100 : 0;

  // Overall noise vs pure trend for verdict
  const noiseTicks = flatTicks + flipTicks;
  const noisePct = (noiseTicks / safeTotalTicks) * 100;

  const netDirectionalTicks = upTrendTicks - downTrendTicks;
  const dominantBias =
    upTrendTicks > downTrendTicks * 1.25
      ? 'BULLISH TREND'
      : downTrendTicks > upTrendTicks * 1.25
      ? 'BEARISH TREND'
      : 'NEUTRAL / BALANCED';

  const trendQualityLabel =
    flatOverTotalPct <= 35 && flipOverNonFlatPct <= 30
      ? 'HIGH TREND QUALITY (Low Flat & Low Flip Ratio)'
      : flatOverTotalPct <= 50 && flipOverNonFlatPct <= 45
      ? 'MODERATE TREND QUALITY (Filtered u1d1 & Flat)'
      : 'LOW TREND QUALITY (High Flat / Flipping Chop)';

  const visibleRuns = filterFlipsAndFlat
    ? patternRuns.filter((r) => !r.isFilteredFlip && r.count >= 2)
    : patternRuns;

  const handleResetBenchmark500 = () => {
    setLatestUpRun({ count: 12, net: 6.7 });
    setLatestDownRun({ count: 15, net: 5.6 });
    setUpTrendTicks(150);
    setDownTrendTicks(50);
    setFlatTicks(200);
    setFlipTicks(100);
    activeRunRef.current = { dir: 'u', count: 12, netChange: 6.7 };
  };

  const handleZeroReset = () => {
    setLatestUpRun({ count: 0, net: 0 });
    setLatestDownRun({ count: 0, net: 0 });
    setUpTrendTicks(0);
    setDownTrendTicks(0);
    setFlatTicks(0);
    setFlipTicks(0);
    setPatternRuns([]);
    activeRunRef.current = { dir: null, count: 0, netChange: 0 };
  };

  return (
    <div className="space-y-4">
      {/* (a) LIVE CONSECUTIVE TICK PATTERN & HIERARCHICAL TREND QUALITY ANALYZER */}
      <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 shadow-sm space-y-4">
        {/* Header & Active Consecutive Pattern Signatures (u12_6.7, d15_5.6) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                (a) Consecutive Tick Pattern & Hierarchical Trend Filter ({asset.symbol}/USDT)
              </h3>
              <p className="text-[11px] text-[var(--theme-text-muted)]">
                1st: <code className="font-mono font-bold">Flat / Total</code> · 2nd: <code className="font-mono font-bold">Flip / (Total - Flat)</code> · 3rd: <code className="font-mono font-bold">Bullish / (Total - Flat - Flip)</code> · 4th: <code className="font-mono font-bold">Bearish / (Total - Flat - Flip)</code> · Up/Down in flipping never counted in Bullish/Bearish
              </p>
            </div>
          </div>

          {/* Primary Consecutive Run Badges + Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <div
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-black text-sm tracking-tight"
              title="Consecutive Up-Tick Run: u{consecutive_count}_{net_change_covered}"
            >
              {uCode}
            </div>
            <span className="text-[var(--theme-text-muted)] font-bold">,</span>
            <div
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 font-black text-sm tracking-tight"
              title="Consecutive Down-Tick Run: d{consecutive_count}_{net_change_covered}"
            >
              {dCode}
            </div>

            <button
              type="button"
              onClick={() => setFilterFlipsAndFlat((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                filterFlipsAndFlat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
              }`}
              title="Toggle filtering of u1d1 single-tick flipping noise and flat ticks"
            >
              <Sliders className="w-3 h-3" />
              <span>{filterFlipsAndFlat ? 'u1d1 & Flat Filtered: ON' : 'Showing Raw u1d1 Flips'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetBenchmark500}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[11px] font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
              title="Load 500-Tick Benchmark (200 Flat, 100 Flip, 150 Bullish, 50 Bearish)"
            >
              <span>500-Tick Sample</span>
            </button>

            <button
              type="button"
              onClick={handleZeroReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[11px] font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
              title="Clear all tick counters to zero"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* 4-Card Hierarchical Tick Score Breakdown:
            1. Flat / Total Tick
            2. Flip / (Total - Flat)
            3. Bullish / (Total - Flat - Flip)
            4. Bearish / (Total - Flat - Flip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* 1st: FLAT / TOTAL TICK */}
          <div className="p-3 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
                1. FLAT / TOTAL TICK
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--theme-bg-elevated)] text-[var(--theme-text-primary)] text-[10px] font-bold">
                {flatOverTotalPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-black text-[var(--theme-text-primary)]">
              {flatTicks}/{totalTicks}
            </div>
            <div className="text-[10px] text-[var(--theme-text-muted)]">
              Formula: <strong>Flat / Total</strong> · Remaining active (Total - Flat): <strong>{totalMinusFlat}</strong>
            </div>
          </div>

          {/* 2nd: FLIP / (TOTAL - FLAT) */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold text-amber-600">
                2. FLIP / (TOTAL - FLAT)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[10px] font-bold">
                {flipOverNonFlatPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-black text-amber-600">
              {flipTicks}/{totalMinusFlat}
            </div>
            <div className="text-[10px] text-[var(--theme-text-muted)]">
              <code className="font-mono">u1d1</code> flips out of ({totalTicks} - {flatTicks}) · Pure trend left: <strong>{totalMinusFlatMinusFlip}</strong>
            </div>
          </div>

          {/* 3rd: BULLISH / (TOTAL - FLAT - FLIP) */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold text-emerald-700">
                3. BULLISH / (TOTAL - FLAT - FLIP)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
                {bullishOverTrendPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-black text-emerald-600">
              {upTrendTicks}/{totalMinusFlatMinusFlip}
            </div>
            <div className="text-[10px] text-[var(--theme-text-muted)]">
              Excludes <code className="font-mono">u1</code> flips · Latest: <strong>{uCode}</strong> (+{formatDeltaCompact(latestUpRun.net)} net)
            </div>
          </div>

          {/* 4th: BEARISH / (TOTAL - FLAT - FLIP) */}
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/25 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold text-rose-600">
                4. BEARISH / (TOTAL - FLAT - FLIP)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 text-[10px] font-bold">
                {bearishOverTrendPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-black text-rose-600">
              {downTrendTicks}/{totalMinusFlatMinusFlip}
            </div>
            <div className="text-[10px] text-[var(--theme-text-muted)]">
              Excludes <code className="font-mono">d1</code> flips · Latest: <strong>{dCode}</strong> (-{formatDeltaCompact(latestDownRun.net)} net)
            </div>
          </div>
        </div>

        {/* Hierarchical Ratio Bar & Trend Quality Verdict */}
        <div className="p-3 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] space-y-2 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-extrabold text-[var(--theme-text-primary)]">
                Trend Verdict:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  dominantBias === 'BULLISH TREND'
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                    : dominantBias === 'BEARISH TREND'
                    ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    : 'bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)]'
                }`}
              >
                {dominantBias} (Bullish {upTrendTicks}/{totalMinusFlatMinusFlip} vs Bearish {downTrendTicks}/{totalMinusFlatMinusFlip})
              </span>
              <span className="text-[11px] text-[var(--theme-text-secondary)] font-sans font-semibold">
                · {trendQualityLabel}
              </span>
            </div>
            <div className="text-[11px] text-[var(--theme-text-muted)]">
              Pure Trend Pool (Total - Flat - Flip): <strong className="text-emerald-600">{totalMinusFlatMinusFlip} ticks</strong> · Up/Down in Flipping (<strong className="text-amber-600">{flipTicks}</strong>) never counted in Bullish/Bearish
            </div>
          </div>

          {/* Pure Trend Split Bar: Bullish / (Total - Flat - Flip) vs Bearish / (Total - Flat - Flip) */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--theme-bg-elevated)]">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${bullishOverTrendPct}%` }}
              title={`Bullish / (Total - Flat - Flip): ${upTrendTicks}/${totalMinusFlatMinusFlip} (${bullishOverTrendPct.toFixed(1)}%)`}
            />
            <div
              className="h-full bg-rose-600 transition-all duration-300"
              style={{ width: `${bearishOverTrendPct}%` }}
              title={`Bearish / (Total - Flat - Flip): ${downTrendTicks}/${totalMinusFlatMinusFlip} (${bearishOverTrendPct.toFixed(1)}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--theme-text-muted)]">
            <span>1️⃣ Flat / Total: <strong>{flatTicks}/{totalTicks} ({flatOverTotalPct.toFixed(1)}%)</strong></span>
            <span>2️⃣ Flip / (Total - Flat): <strong>{flipTicks}/{totalMinusFlat} ({flipOverNonFlatPct.toFixed(1)}%)</strong></span>
            <span>3️⃣ Bullish / (Total - Flat - Flip): <strong className="text-emerald-600">{upTrendTicks}/{totalMinusFlatMinusFlip} ({bullishOverTrendPct.toFixed(1)}%)</strong></span>
            <span>4️⃣ Bearish / (Total - Flat - Flip): <strong className="text-rose-600">{downTrendTicks}/{totalMinusFlatMinusFlip} ({bearishOverTrendPct.toFixed(1)}%)</strong></span>
          </div>
        </div>

        {/* Consecutive Pattern Runs Stream (Filtered of u1d1 & Flat by default) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-mono no-scrollbar">
          <span className="text-[var(--theme-text-muted)] shrink-0 mr-1 font-bold">
            {filterFlipsAndFlat ? 'Filtered Consecutive Runs (count ≥ 2):' : 'All Pattern Runs (incl. u1d1 flips):'}
          </span>
          {visibleRuns.map((run) => (
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
          ))}
        </div>
      </div>

      {/* (b) CURRENT CHART */}
      <div className="space-y-1.5">
        <div className="px-1 flex items-center justify-between text-xs font-bold text-[var(--theme-text-secondary)]">
          <span>(b) Live Candlestick & Volume Chart ({asset.symbol}/USDT)</span>
          <span className="font-mono text-[11px] text-[var(--theme-text-muted)]">
            Spot: ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </div>
        <TradingChart asset={asset} activePositions={positions} />
      </div>
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
}

const SHOCK_STEPS = [-20, -15, -12, -10, -8, -5, -3, -2, -1, 0, 0.5, 1, 1.5, 2];

export const PnlForecastingMatrixPanel: React.FC<PnlForecastingMatrixProps> = ({
  asset,
  totalEquity,
  positions,
  spotHoldings,
}) => {
  const [customShockPct, setCustomShockPct] = useState<number>(-5);
  const [simMargin, setSimMargin] = useState<number>(250);
  const [simLeverage, setSimLeverage] = useState<number>(
    asset.symbol === 'BTC' ? 25 : asset.category === 'gold' ? 20 : 10
  );
  const [simSide, setSimSide] = useState<'LONG' | 'SHORT'>('LONG');

  const curPrice = asset.price || 96500;
  const maxLev = getBrokerMaxLeverage(asset.symbol);

  const coinSpotHolding = spotHoldings.find((s) => s.symbol === asset.symbol);
  const spotQty = coinSpotHolding ? coinSpotHolding.amount : 0;
  const coinPositions = positions.filter((p) => p.assetSymbol === asset.symbol);

  const computeRow = (pctChange: number) => {
    const projectedPrice = curPrice * (1 + pctChange / 100);
    const priceDiff = projectedPrice - curPrice;

    // 1. Spot PnL Delta for this coin
    const spotPnLDelta = spotQty * priceDiff;

    // 2. Active Open Leveraged Positions PnL & Liquidation check
    let openPosPnLDelta = 0;
    let liquidatedCount = 0;
    coinPositions.forEach((pos) => {
      const isLong = pos.side === 'LONG';
      const isLiq = isLong
        ? projectedPrice <= pos.liquidationPrice
        : projectedPrice >= pos.liquidationPrice;
      if (isLiq) {
        liquidatedCount += 1;
        openPosPnLDelta -= pos.margin + pos.unrealizedPnL;
      } else {
        const delta = isLong
          ? pos.amount * (projectedPrice - curPrice)
          : pos.amount * (curPrice - projectedPrice);
        openPosPnLDelta += delta;
      }
    });

    // 3. Hypothetical Simulated Trade PnL (-20% to +2%)
    const simNotional = simMargin * simLeverage;
    const rawSimRoePct =
      simSide === 'LONG' ? pctChange * simLeverage : -pctChange * simLeverage;
    const isSimLiquidated = rawSimRoePct <= -99.2;
    const simPnLUsd = isSimLiquidated
      ? -simMargin
      : (simNotional * (simSide === 'LONG' ? pctChange : -pctChange)) / 100;
    const simRoePct = isSimLiquidated ? -100 : rawSimRoePct;

    // 4. Projected Total Portfolio Equity
    const projectedEquity = Math.max(0, totalEquity + spotPnLDelta + openPosPnLDelta + simPnLUsd);

    return {
      pctChange,
      projectedPrice,
      spotPnLDelta,
      openPosPnLDelta,
      liquidatedCount,
      simPnLUsd,
      simRoePct,
      isSimLiquidated,
      projectedEquity,
    };
  };

  const customPreview = computeRow(customShockPct);

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-[var(--theme-text-primary)]">
              PnL Forecasting & Stress Matrix (-20% to +2% Range · {asset.symbol}/USDT)
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Models downside drawdown shocks (-20% to 0%) and upside scalping targets (0% to +2%)
            </p>
          </div>
        </div>

        {/* Hypothetical Position Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="inline-flex rounded-lg border border-[var(--theme-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setSimSide('LONG')}
              className={`px-2.5 py-1 font-bold cursor-pointer ${
                simSide === 'LONG'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)]'
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
                  : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)]'
              }`}
            >
              SHORT
            </button>
          </div>

          <label className="flex items-center gap-1">
            <span className="text-[var(--theme-text-muted)]">Sim Margin ($):</span>
            <input
              type="number"
              min={10}
              step={50}
              value={simMargin}
              onChange={(e) => setSimMargin(Math.max(10, Number(e.target.value) || 100))}
              className="w-20 px-2 py-1 rounded font-mono text-xs"
            />
          </label>

          <label className="flex items-center gap-1">
            <span className="text-[var(--theme-text-muted)]">Lev:</span>
            <select
              value={simLeverage}
              onChange={(e) => setSimLeverage(Number(e.target.value))}
              className="px-2 py-1 rounded font-mono text-xs"
            >
              {[1, 2, 5, 10, 20, 25, 50, 100]
                .filter((l) => l <= maxLev)
                .map((lev) => (
                  <option key={lev} value={lev}>
                    {lev}x
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

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
          onChange={(e) => setCustomShockPct( parseFloat(e.target.value) )}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[var(--theme-text-muted)]">
          <span>-20.0% (Severe Crash)</span>
          <span>-10.0% (Correction)</span>
          <span>-5.0% (Pullback)</span>
          <span>0.0% (Spot)</span>
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
              <th className="py-2 px-3 text-right">Sim {simSide} ({simLeverage}x) PnL</th>
              <th className="py-2 px-3 text-right">Sim ROE %</th>
              <th className="py-2 px-3 text-right">Active Spot + Open Pos PnL</th>
              <th className="py-2 px-3 text-right">Projected Total Equity</th>
              <th className="py-2 px-3 text-center">Margin Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--theme-border-subtle)]">
            {SHOCK_STEPS.map((pct) => {
              const row = computeRow(pct);
              const isZero = pct === 0;
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
                  <td
                    className={`py-2 px-3 text-right ${
                      row.spotPnLDelta + row.openPosPnLDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {row.spotPnLDelta + row.openPosPnLDelta >= 0 ? '+' : ''}$
                    {(row.spotPnLDelta + row.openPosPnLDelta).toFixed(2)}
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
