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

    const getChartThemeColors = () => {
      switch (theme) {
        case 'alpine':
          return { bg: '#ffffff', text: '#0f172a', grid: '#f1f5f9', border: '#e2e8f0' };
        case 'ivory':
          return { bg: '#faf8f5', text: '#1c1917', grid: '#f4efe6', border: '#e8e0d5' };
        case 'nordic':
          return { bg: '#f4f4f7', text: '#18181b', grid: '#ebebf0', border: '#e2e2e8' };
        case 'azure':
          return { bg: '#f0f7ff', text: '#0c4a6e', grid: '#e0f0fe', border: '#bae6fd' };
        case 'sage':
          return { bg: '#f2f7f4', text: '#064e3b', grid: '#e2f1e8', border: '#a7f3d0' };
        default:
          return { bg: '#ffffff', text: '#0f172a', grid: '#f1f5f9', border: '#e2e8f0' };
      }
    };

    const colors = getChartThemeColors();

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
        color: '#26a69a',
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
      });
      candlestickSeriesRef.current = candleSeries as any;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: asset.category === 'gold' ? '#f59e0b' : '#3b82f6',
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
  }, [theme, isLight, chartType, showVolume, asset.category]);

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
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
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
      className={`rounded-2xl p-4 flex flex-col h-[580px] sm:h-[620px] shadow-lg border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
      }`}
    >
      {/* Chart Header Controls */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b text-xs ${
          isLight ? 'border-slate-200' : 'border-neutral-800'
        }`}
      >
        {/* Pair Title & Real-time Quote */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold text-base font-mono tracking-tight ${
                isLight ? 'text-slate-900' : 'text-neutral-100'
              }`}
            >
              {asset.symbol}/USDT
            </span>
            <span className={`font-medium hidden sm:inline ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              {asset.name}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ${asset.price.toLocaleString('en-US', {
                minimumFractionDigits: asset.price < 10 ? 4 : 2,
                maximumFractionDigits: asset.price < 10 ? 4 : 2,
              })}
            </span>
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                asset.change24h >= 0
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/20 text-emerald-400'
                  : isLight
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-rose-500/20 text-rose-400'
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
            className={`flex items-center p-0.5 rounded-lg border text-[11px] font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <button
              onClick={() => setChartType('candles')}
              className={`px-2 py-1 rounded transition-all font-semibold ${
                chartType === 'candles'
                  ? isLight ? 'bg-white text-emerald-600 shadow-sm' : 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : isLight ? 'text-slate-600' : 'text-neutral-400'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded transition-all font-semibold ${
                chartType === 'line'
                  ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-neutral-800 text-blue-400 shadow-sm'
                  : isLight ? 'text-slate-600' : 'text-neutral-400'
              }`}
            >
              Line
            </button>
          </div>

          {/* Indicators Toggle */}


          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded text-[11px] font-mono font-semibold border transition-all ${
              showVolume
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
            }`}
            title="Toggle Volume"
          >
            Vol
          </button>

          {/* Timeframe selector */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                  timeframe === tf
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-neutral-800 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={loadCandles}
            className={`p-1.5 rounded-lg border transition-all ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Refresh Chart Data"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* OHLCV Live Bar */}
      <div
        className={`flex flex-wrap items-center gap-4 px-2 py-1.5 text-[11px] font-mono border-b ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
        }`}
      >
        <span>
          O: <strong className={isLight ? 'text-slate-900' : 'text-neutral-200'}>${currentCandle.open.toFixed(2)}</strong>
        </span>
        <span>
          H: <strong className={isLight ? 'text-slate-900' : 'text-neutral-200'}>${currentCandle.high.toFixed(2)}</strong>
        </span>
        <span>
          L: <strong className={isLight ? 'text-slate-900' : 'text-neutral-200'}>${currentCandle.low.toFixed(2)}</strong>
        </span>
        <span>
          C:{' '}
          <strong
            className={
              currentCandle.close >= currentCandle.open
                ? 'text-emerald-500 font-bold'
                : 'text-rose-500 font-bold'
            }
          >
            ${currentCandle.close.toFixed(2)}
          </strong>
        </span>
        {showVolume && (
          <span>
            Vol: <strong className={isLight ? 'text-slate-700' : 'text-neutral-300'}>{Math.round(currentCandle.volume)}</strong>
          </span>
        )}
        {symbolPositions.length > 0 && (
          <span
            className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-amber-950/40 border-amber-600/30 text-amber-400'
            }`}
          >
            {symbolPositions.length} Active Position(s)
          </span>
        )}
      </div>

      {/* Official TradingView Lightweight Chart Container */}
      <div className="relative flex-1 w-full min-h-0 h-full pt-1">
        <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />

        {/* Gold Badge */}
        {asset.category === 'gold' && (
          <div
            className={`absolute bottom-3 left-3 pointer-events-none backdrop-blur px-3 py-1.5 rounded-lg text-xs border ${
              isLight
                ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-sm'
                : 'bg-neutral-950/80 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Real Live Physical Gold Feed (PAX Gold 1:1 London Good Delivery)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
