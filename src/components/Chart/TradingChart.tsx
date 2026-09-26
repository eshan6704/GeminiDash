import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MarketAsset, Candle, Position } from '../../types/trading';
import { fetchCandles, ChartInterval } from '../../services/marketData';
import { useTheme } from '../../context/ThemeContext';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CandlestickData,
  HistogramData,
  LineData,
} from 'lightweight-charts';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  RefreshCcw,
} from 'lucide-react';

interface TradingChartProps {
  asset: MarketAsset;
  activePositions: Position[];
}

export const TradingChart: React.FC<TradingChartProps> = ({
  asset,
  activePositions,
}) => {
  const { theme, isLight } = useTheme();

  const [timeframe, setTimeframe] = useState<ChartInterval>('15m');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Filter positions on this symbol
  const symbolPositions = useMemo(() => {
    return activePositions.filter((p) => p.assetSymbol === asset.symbol);
  }, [activePositions, asset.symbol]);

  // Load candles
  const loadCandles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCandles(asset.symbol, timeframe);
      setCandles(data);
    } catch (err) {
      console.warn('Failed to load chart data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandles();
  }, [asset.symbol, timeframe]);

  // Update latest candle with current live price
  useEffect(() => {
    if (candles.length === 0) return;
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast: Candle = {
        ...last,
        close: asset.price,
        high: Math.max(last.high, asset.price),
        low: Math.min(last.low, asset.price),
      };
      return [...prev.slice(0, prev.length - 1), updatedLast];
    });
  }, [asset.price]);

  // Initialize TradingView lightweight-chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    // Fixed Quickstack colors for the chart
    const colors = {
      bg: '#0F1113', // Matches --theme-bg-main/card roughly
      text: '#A1A1AA',
      grid: '#1D1F23',
      border: '#2A2D32'
    };

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 450,
      layout: {
        background: { type: ColorType.Solid, color: colors.bg },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: colors.border,
        timeVisible: true,
        secondsVisible: timeframe === '1s',
      },
      rightPriceScale: {
        borderColor: colors.border,
      },
    });

    chartInstanceRef.current = chart;

    // Add Volume Series
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        color: '#10b981', // Emerald 500
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // Overlay at bottom
      });
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volSeries as any;
    }

    // Add Main Price Series (Candles or Line)
    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        candleStyle: {
          borderColor: '#2A2D32'
        }
      } as any);
      candlestickSeriesRef.current = candleSeries as any;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: asset.category === 'gold' ? '#f59e0b' : '#10b981',
        lineWidth: 2,
      });
      lineSeriesRef.current = lineSeries as any;
    }

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {
          // Ignore if already disposed
        }
        chartInstanceRef.current = null;
      }
    };
  }, [theme, chartType, showVolume, asset.category, timeframe]);

  // Update chart data when candles change
  useEffect(() => {
    if (!chartInstanceRef.current || candles.length === 0) return;

    const formattedCandles: CandlestickData[] = candles.map((c) => ({
      time: (c.time / 1000) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const formattedVolume: HistogramData[] = candles.map((c) => ({
      time: (c.time / 1000) as any,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
    }));

    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(formattedCandles);
    }
    if (lineSeriesRef.current) {
      const lineData: LineData[] = candles.map((c) => ({
        time: (c.time / 1000) as any,
        value: c.close,
      }));
      lineSeriesRef.current.setData(lineData);
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(formattedVolume);
    }

    chartInstanceRef.current.timeScale().fitContent();
  }, [candles]);

  const timeframes: ChartInterval[] = ['1s', '1m', '5m', '15m', '1h', '4h', '1d'];
  const currentCandle = candles[candles.length - 1] || {
    open: asset.price,
    high: asset.price,
    low: asset.price,
    close: asset.price,
    volume: 0,
  };

  return (
    <div
      className="rounded-md p-4 flex flex-col h-[580px] sm:h-[620px] border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
    >
      {/* Chart Header Controls */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)] text-xs"
      >
        {/* Pair Title & Real-time Quote */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-base font-mono tracking-tight text-[var(--theme-text-primary)]"
            >
              {asset.symbol}/USDT
            </span>
            <span className="font-medium hidden sm:inline text-[var(--theme-text-muted)]">
              {asset.name}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-base font-bold text-[var(--theme-text-primary)]">
              ${asset.price.toLocaleString('en-US', {
                minimumFractionDigits: asset.price < 10 ? 4 : 2,
                maximumFractionDigits: asset.price < 10 ? 4 : 2,
              })}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border transition-colors ${
                asset.change24h >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {asset.change24h >= 0 ? '+' : ''}
              {asset.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Chart Options & Timeframes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div
            className="flex items-center p-0.5 rounded-md border text-[10px] font-mono bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]"
          >
            <button
              onClick={() => setChartType('candles')}
              className={`px-2 py-1 rounded-sm transition-all font-bold ${
                chartType === 'candles'
                  ? 'bg-[var(--theme-accent)] text-black'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              CANDLES
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded-sm transition-all font-bold ${
                chartType === 'line'
                  ? 'bg-[var(--theme-accent)] text-black'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              LINE
            </button>
          </div>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all ${
              showVolume
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)]'
            }`}
            title="Toggle Volume"
          >
            VOL
          </button>

          {/* Timeframe selector */}
          <div
            className="flex items-center p-0.5 rounded-md border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]"
          >
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-[var(--theme-border-subtle)] text-[var(--theme-text-primary)]'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={loadCandles}
            className="p-1.5 rounded-md border transition-all bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
            title="Refresh Chart Data"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* OHLCV Live Bar */}
      <div
        className="flex flex-wrap items-center gap-4 px-2 py-1.5 text-[10px] font-mono border-b bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)]"
      >
        <span>
          O: <strong className="text-[var(--theme-text-secondary)]">${currentCandle.open.toFixed(2)}</strong>
        </span>
        <span>
          H: <strong className="text-[var(--theme-text-secondary)]">${currentCandle.high.toFixed(2)}</strong>
        </span>
        <span>
          L: <strong className="text-[var(--theme-text-secondary)]">${currentCandle.low.toFixed(2)}</strong>
        </span>
        <span>
          C:{' '}
          <strong
            className={
              currentCandle.close >= currentCandle.open
                ? 'text-emerald-500'
                : 'text-rose-500'
            }
          >
            ${currentCandle.close.toFixed(2)}
          </strong>
        </span>
        {showVolume && (
          <span>
            VOL: <strong className="text-[var(--theme-text-secondary)]">{Math.round(currentCandle.volume)}</strong>
          </span>
        )}
        {symbolPositions.length > 0 && (
          <span
            className="font-bold px-2 py-0.5 rounded-sm border text-[9px] bg-amber-500/10 border-amber-500/20 text-amber-500"
          >
            {symbolPositions.length} ACTIVE POSITION(S)
          </span>
        )}
      </div>

      {/* Official TradingView Lightweight Chart Container */}
      <div className="relative flex-1 w-full min-h-0 h-full pt-1">
        <div ref={containerRef} className="w-full h-full overflow-hidden" />

        {/* Gold Badge */}
        {asset.category === 'gold' && (
          <div
            className="absolute bottom-3 left-3 pointer-events-none backdrop-blur-md px-3 py-1.5 rounded-sm text-[10px] border bg-[var(--theme-bg-card-subtle)]/80 border-amber-500/20 text-amber-400 font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>REAL LIVE PHYSICAL GOLD FEED</span>
            </div>
          </div>
        )}
      </div>
    </div>

  );
};
