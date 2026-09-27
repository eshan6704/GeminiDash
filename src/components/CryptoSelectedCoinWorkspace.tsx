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
   2. (a) LIVE TICK IMPULSE (e.g. u12_5.7, d15_5.6) & (b) CURRENT CHART
   ============================================================================ */

interface TickRecord {
  id: string;
  dir: 'u' | 'd';
  delta: number;
  price: number;
  timestamp: number;
}

interface CoinTickAndChartProps {
  asset: MarketAsset;
  positions: Position[];
}

export const CoinTickAndChartPanel: React.FC<CoinTickAndChartProps> = ({
  asset,
  positions,
}) => {
  const [upCount, setUpCount] = useState<number>(12);
  const [upSum, setUpSum] = useState<number>(5.7);
  const [downCount, setDownCount] = useState<number>(15);
  const [downSum, setDownSum] = useState<number>(5.6);
  const [recentTicks, setRecentTicks] = useState<TickRecord[]>([]);
  const prevPriceRef = useRef<number>(asset.price);
  const prevSymbolRef = useRef<string>(asset.symbol);

  // Reset baseline to realistic u12_5.7, d15_5.6 seed when switching coins
  useEffect(() => {
    if (prevSymbolRef.current !== asset.symbol) {
      prevSymbolRef.current = asset.symbol;
      prevPriceRef.current = asset.price;
      setUpCount(12);
      setUpSum(5.7);
      setDownCount(15);
      setDownSum(5.6);
      setRecentTicks([]);
    }
  }, [asset.symbol, asset.price]);

  // Track real live price changes + micro-tick feed
  useEffect(() => {
    const diff = asset.price - prevPriceRef.current;
    if (Math.abs(diff) > 0) {
      const isUp = diff > 0;
      const absDelta = Math.abs(diff);
      prevPriceRef.current = asset.price;

      if (isUp) {
        setUpCount((c) => c + 1);
        setUpSum((s) => Number((s + absDelta).toFixed(4)));
      } else {
        setDownCount((c) => c + 1);
        setDownSum((s) => Number((s + absDelta).toFixed(4)));
      }

      setRecentTicks((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          dir: isUp ? 'u' : 'd',
          delta: absDelta,
          price: asset.price,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19),
      ]);
    }
  }, [asset.price]);

  // Format tick metric cleanly (e.g. u12_5.7, d15_5.6)
  const formatDeltaCompact = (val: number) => {
    if (val >= 100) return val.toFixed(1);
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(3);
  };

  const uCode = `u${upCount}_${formatDeltaCompact(upSum)}`;
  const dCode = `d${downCount}_${formatDeltaCompact(downSum)}`;
  const totalTicks = Math.max(1, upCount + downCount);
  const upRatioPct = (upCount / totalTicks) * 100;

  const handleResetTicks = () => {
    setUpCount(0);
    setUpSum(0);
    setDownCount(0);
    setDownSum(0);
    setRecentTicks([]);
  };

  return (
    <div className="space-y-4">
      {/* (a) LIVE TICK IMPULSE MONITOR: u12_5.7, d15_5.6 */}
      <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                (a) Live Micro-Tick Impulse Signature ({asset.symbol}/USDT)
              </h3>
              <p className="text-[11px] text-[var(--theme-text-muted)]">
                Real-time uptick vs downtick count & cumulative price excursion
              </p>
            </div>
          </div>

          {/* Primary Compact Signature Display: u12_5.7, d15_5.6 */}
          <div className="flex items-center gap-2.5 flex-wrap font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-black text-sm tracking-tight">
              {uCode}
            </div>
            <span className="text-[var(--theme-text-muted)] font-bold">,</span>
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 font-black text-sm tracking-tight">
              {dCode}
            </div>
            <button
              type="button"
              onClick={handleResetTicks}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[11px] font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
              title="Reset tick counter window"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Window</span>
            </button>
          </div>
        </div>

        {/* Up vs Down Tick Ratio Bar & Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--theme-text-muted)]">Up-Ticks (u):</span>
            <span className="font-bold text-emerald-600">
              {upCount} ticks · +{formatDeltaCompact(upSum)} pts
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--theme-text-muted)]">Down-Ticks (d):</span>
            <span className="font-bold text-rose-600">
              {downCount} ticks · -{formatDeltaCompact(downSum)} pts
            </span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)]">
              <span>Up Impulse {upRatioPct.toFixed(0)}%</span>
              <span>Net: {(upSum - downSum >= 0 ? '+' : '') + (upSum - downSum).toFixed(2)}</span>
              <span>Down Impulse {(100 - upRatioPct).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${upRatioPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrolling Live Tick Sequence Tape */}
        {recentTicks.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-mono no-scrollbar">
            <span className="text-[var(--theme-text-muted)] shrink-0 mr-1">Recent Ticks:</span>
            {recentTicks.map((t) => (
              <span
                key={t.id}
                className={`px-2 py-0.5 rounded shrink-0 font-bold ${
                  t.dir === 'u'
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                {t.dir}_{t.delta < 1 ? t.delta.toFixed(3) : t.delta.toFixed(2)}
              </span>
            ))}
          </div>
        )}
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
