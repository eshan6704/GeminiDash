import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Activity,
  BarChart3,
  Percent,
} from 'lucide-react';
import { TradeRecord, SHARK_EXCHANGE } from '../../types/trading';
import { useTheme } from '../../context/ThemeContext';

interface DailyPnLChartProps {
  tradeHistory: TradeRecord[];
  brokerName?: string;
}

interface DayDataPoint {
  dateKey: string;
  dateLabel: string;
  fullDate: string;
  realizedPnL: number;
  cumulativePnL: number;
  grossPnL: number;
  feesPaid: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  isToday: boolean;
}

// Generates 30 days of realistic demo baseline data if the user is new with 0 trades
function generateSample30DayData(): TradeRecord[] {
  const records: TradeRecord[] = [];
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Curated 30-day seed sequence with mixed wins and losses reflecting Shark Exchange execution
  const dailyPnLSeeds = [
    { dayOffset: 29, pnl: 84.5, fee: 1.8, count: 2, asset: 'PAXG' },
    { dayOffset: 28, pnl: -35.2, fee: 2.1, count: 3, asset: 'BTC' },
    { dayOffset: 27, pnl: 142.0, fee: 3.4, count: 4, asset: 'SOL' },
    { dayOffset: 26, pnl: 65.8, fee: 1.5, count: 2, asset: 'PAXG' },
    { dayOffset: 25, pnl: -12.4, fee: 0.8, count: 1, asset: 'ETH' },
    { dayOffset: 24, pnl: 210.3, fee: 4.2, count: 5, asset: 'PAXG' },
    { dayOffset: 23, pnl: 95.0, fee: 2.0, count: 2, asset: 'BTC' },
    { dayOffset: 22, pnl: -80.0, fee: 3.1, count: 3, asset: 'SOL' },
    { dayOffset: 21, pnl: 45.2, fee: 1.1, count: 2, asset: 'PAXG' },
    { dayOffset: 20, pnl: 112.6, fee: 2.7, count: 4, asset: 'PAXG' },
    { dayOffset: 19, pnl: -20.5, fee: 1.4, count: 2, asset: 'DOGE' },
    { dayOffset: 18, pnl: 78.4, fee: 1.9, count: 3, asset: 'BTC' },
    { dayOffset: 17, pnl: 165.2, fee: 3.8, count: 4, asset: 'PAXG' },
    { dayOffset: 16, pnl: 52.0, fee: 1.2, count: 2, asset: 'ETH' },
    { dayOffset: 15, pnl: -45.0, fee: 2.2, count: 3, asset: 'SOL' },
    { dayOffset: 14, pnl: 88.0, fee: 2.1, count: 3, asset: 'PAXG' },
    { dayOffset: 13, pnl: 130.5, fee: 3.0, count: 4, asset: 'BNB' },
    { dayOffset: 12, pnl: -15.0, fee: 0.9, count: 1, asset: 'BTC' },
    { dayOffset: 11, pnl: 92.4, fee: 2.3, count: 3, asset: 'PAXG' },
    { dayOffset: 10, pnl: 175.0, fee: 4.1, count: 5, asset: 'SOL' },
    { dayOffset: 9, pnl: -60.0, fee: 2.8, count: 3, asset: 'ETH' },
    { dayOffset: 8, pnl: 105.3, fee: 2.5, count: 3, asset: 'PAXG' },
    { dayOffset: 7, pnl: 48.0, fee: 1.3, count: 2, asset: 'XRP' },
    { dayOffset: 6, pnl: -25.0, fee: 1.5, count: 2, asset: 'BTC' },
    { dayOffset: 5, pnl: 140.2, fee: 3.2, count: 4, asset: 'PAXG' },
    { dayOffset: 4, pnl: 82.5, fee: 2.0, count: 3, asset: 'SOL' },
    { dayOffset: 3, pnl: -40.0, fee: 1.7, count: 2, asset: 'ETH' },
    { dayOffset: 2, pnl: 118.0, fee: 2.9, count: 4, asset: 'PAXG' },
    { dayOffset: 1, pnl: 65.0, fee: 1.6, count: 2, asset: 'BTC' },
    { dayOffset: 0, pnl: 92.0, fee: 2.2, count: 3, asset: 'PAXG' },
  ];

  dailyPnLSeeds.forEach((seed, idx) => {
    const timestamp = now - seed.dayOffset * oneDayMs;
    const isWin = seed.pnl >= 0;
    records.push({
      id: `sample-seed-${idx}`,
      assetSymbol: seed.asset,
      side: isWin ? 'LONG' : 'SHORT',
      mode: 'LEVERAGED',
      entryPrice: seed.asset === 'PAXG' ? 3040 : seed.asset === 'BTC' ? 88500 : 185,
      exitPrice: seed.asset === 'PAXG' ? 3050 : seed.asset === 'BTC' ? 89000 : 187,
      amount: seed.asset === 'PAXG' ? 0.2 : seed.asset === 'BTC' ? 0.005 : 1.5,
      leverage: 75,
      realizedPnL: seed.pnl,
      realizedPnLPercent: seed.pnl > 0 ? 5.2 : -2.1,
      fees: seed.fee,
      openTime: timestamp - 3600000,
      closeTime: timestamp,
      closeReason: seed.pnl > 0 ? 'TAKE_PROFIT' : 'STOP_LOSS',
    });
  });

  return records;
}

export const DailyPnLChart: React.FC<DailyPnLChartProps> = ({
  tradeHistory,
  brokerName = SHARK_EXCHANGE.name,
}) => {
  const { isLight } = useTheme();
  const [chartMode, setChartMode] = useState<'COMPOSED' | 'BARS' | 'CUMULATIVE'>('COMPOSED');
  const [useSampleDataIfEmpty, setUseSampleDataIfEmpty] = useState<boolean>(true);

  const isDemo = tradeHistory.length === 0 && useSampleDataIfEmpty;
  const activeRecords = useMemo(() => {
    if (tradeHistory.length > 0) return tradeHistory;
    if (useSampleDataIfEmpty) return generateSample30DayData();
    return [];
  }, [tradeHistory, useSampleDataIfEmpty]);

  // Aggregate trades into 30 calendar days
  const chartData: DayDataPoint[] = useMemo(() => {
    const now = new Date();
    const dayMap = new Map<string, {
      realizedPnL: number;
      grossPnL: number;
      feesPaid: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
    }>();

    // Group actual records
    activeRecords.forEach((trade) => {
      if (trade.realizedPnL === undefined) return;
      const d = new Date(trade.closeTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const existing = dayMap.get(key) || {
        realizedPnL: 0,
        grossPnL: 0,
        feesPaid: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
      };

      const pnl = trade.realizedPnL || 0;
      const fee = trade.fees || 0;

      existing.realizedPnL += pnl;
      existing.grossPnL += (pnl + fee);
      existing.feesPaid += fee;
      existing.tradeCount += 1;
      if (pnl > 0) existing.winCount += 1;
      else if (pnl < 0) existing.lossCount += 1;

      dayMap.set(key, existing);
    });

    const points: DayDataPoint[] = [];
    let runningCumulative = 0;

    // Fill last 30 days chronologically
    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);

      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      const label = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const dayStats = dayMap.get(key) || {
        realizedPnL: 0,
        grossPnL: 0,
        feesPaid: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
      };

      runningCumulative += dayStats.realizedPnL;

      points.push({
        dateKey: key,
        dateLabel: label,
        fullDate,
        realizedPnL: parseFloat(dayStats.realizedPnL.toFixed(2)),
        cumulativePnL: parseFloat(runningCumulative.toFixed(2)),
        grossPnL: parseFloat(dayStats.grossPnL.toFixed(2)),
        feesPaid: parseFloat(dayStats.feesPaid.toFixed(3)),
        tradeCount: dayStats.tradeCount,
        winCount: dayStats.winCount,
        lossCount: dayStats.lossCount,
        isToday: i === 0,
      });
    }

    return points;
  }, [activeRecords]);

  // Aggregate 30-day stats
  const metrics = useMemo(() => {
    let totalPnL = 0;
    let totalFees = 0;
    let winningDays = 0;
    let losingDays = 0;
    let neutralDays = 0;
    let bestDay = -Infinity;
    let worstDay = Infinity;
    let totalTrades = 0;

    chartData.forEach((d) => {
      totalPnL += d.realizedPnL;
      totalFees += d.feesPaid;
      totalTrades += d.tradeCount;

      if (d.realizedPnL > 0) winningDays++;
      else if (d.realizedPnL < 0) losingDays++;
      else neutralDays++;

      if (d.realizedPnL > bestDay) bestDay = d.realizedPnL;
      if (d.realizedPnL < worstDay) worstDay = d.realizedPnL;
    });

    const activeDays = winningDays + losingDays;
    const winRateDays = activeDays > 0 ? (winningDays / activeDays) * 100 : 0;
    const avgDailyPnL = totalPnL / 30;

    return {
      totalPnL,
      totalFees,
      winningDays,
      losingDays,
      neutralDays,
      bestDay: bestDay === -Infinity ? 0 : bestDay,
      worstDay: worstDay === Infinity ? 0 : worstDay,
      winRateDays,
      avgDailyPnL,
      totalTrades,
    };
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayDataPoint = payload[0].payload;
      const isPositive = data.realizedPnL >= 0;
      const isCumPositive = data.cumulativePnL >= 0;

      return (
        <div
          className={`p-3 rounded-xl shadow-xl border backdrop-blur-md text-xs font-mono min-w-[210px] space-y-1.5 z-50 ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-neutral-900/95 border-neutral-700/80 text-neutral-100 shadow-2xl'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-1.5 border-b text-[11px] ${
              isLight ? 'border-slate-100' : 'border-neutral-800'
            }`}
          >
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>{data.fullDate}</span>
            {data.isToday && (
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                Today
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className={isLight ? 'text-slate-600' : 'text-neutral-300'}>Daily Net PnL:</span>
            <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '+' : ''}${data.realizedPnL.toFixed(2)}
            </span>
          </div>

          <div className={`flex justify-between items-center text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            <span>30D Running Total:</span>
            <span className={`font-semibold ${isCumPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCumPositive ? '+' : ''}${data.cumulativePnL.toFixed(2)}
            </span>
          </div>

          <div className={`flex justify-between items-center text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            <span>Trades Executed:</span>
            <span className={isLight ? 'text-slate-900 font-medium' : 'text-neutral-200'}>
              {data.tradeCount > 0 ? (
                <span>
                  {data.tradeCount}{' '}
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                    ({data.winCount}W / {data.lossCount}L)
                  </span>
                </span>
              ) : (
                <span className={isLight ? 'text-slate-400' : 'text-neutral-500'}>None</span>
              )}
            </span>
          </div>

          <div className={`flex justify-between items-center text-[10px] pt-1 border-t ${isLight ? 'border-slate-100 text-slate-500' : 'border-neutral-800 text-neutral-400'}`}>
            <span>Brokerage Paid:</span>
            <span className="text-amber-600 font-semibold">${data.feesPaid.toFixed(3)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-xl p-3.5 space-y-3 border transition-colors ${
        isLight
          ? 'bg-slate-50/70 border-slate-200'
          : 'bg-neutral-950/70 border-neutral-800'
      }`}
    >
      {/* Chart Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b ${
          isLight ? 'border-slate-200' : 'border-neutral-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isLight
                ? 'bg-amber-100/60 text-amber-700 border-amber-300'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Daily Realized PnL (Last 30 Days)
              </h3>
              {isDemo && (
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${
                    isLight
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  Preview Baseline
                </span>
              )}
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Net realized returns after Shark Exchange brokerage (0.016% Maker / 0.064% Taker)
            </p>
          </div>
        </div>

        {/* Chart View Switches & Demo Toggle */}
        <div className="flex items-center gap-2">
          {tradeHistory.length === 0 && (
            <button
              type="button"
              onClick={() => setUseSampleDataIfEmpty(!useSampleDataIfEmpty)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle preview sample history"
            >
              {useSampleDataIfEmpty ? 'Hide Preview' : 'Show Sample 30D'}
            </button>
          )}

          <div
            className={`flex p-0.5 rounded-lg border text-[10px] font-medium ${
              isLight ? 'bg-white border-slate-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setChartMode('COMPOSED')}
              className={`px-2 py-1 rounded transition-all ${
                chartMode === 'COMPOSED'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                    : 'bg-neutral-800 text-amber-300 font-bold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Composed
            </button>
            <button
              type="button"
              onClick={() => setChartMode('BARS')}
              className={`px-2 py-1 rounded transition-all ${
                chartMode === 'BARS'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                    : 'bg-neutral-800 text-amber-300 font-bold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Daily Bars
            </button>
            <button
              type="button"
              onClick={() => setChartMode('CUMULATIVE')}
              className={`px-2 py-1 rounded transition-all ${
                chartMode === 'CUMULATIVE'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                    : 'bg-neutral-800 text-amber-300 font-bold shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Cumulative Curve
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Quick Metric Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            30D Net Realized
          </span>
          <span className={`text-sm font-bold ${metrics.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Profitable Days
          </span>
          <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
            {metrics.winningDays}{' '}
            <span className={`text-[11px] font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              / 30 ({metrics.winRateDays.toFixed(0)}%)
            </span>
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Best Day PnL
          </span>
          <span className="text-sm font-bold text-emerald-600">
            +${metrics.bestDay.toFixed(2)}
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Worst Day PnL
          </span>
          <span className="text-sm font-bold text-rose-600">
            {metrics.worstDay <= 0 ? '' : '+'}${metrics.worstDay.toFixed(2)}
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Brokerage Paid (30D)
          </span>
          <span className="text-sm font-bold text-amber-600">
            ${metrics.totalFees.toFixed(2)}
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900/80 border-neutral-800/60'
          }`}
        >
          <span className={`text-[10px] font-sans block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Avg Daily PnL
          </span>
          <span className={`text-sm font-bold ${metrics.avgDailyPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.avgDailyPnL >= 0 ? '+' : ''}${metrics.avgDailyPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-52 sm:h-60 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'BARS' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isLight ? '#e2e8f0' : '#262626'}
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isLight ? '#cbd5e1' : '#262626' }}
                interval={4}
              />
              <YAxis
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={50}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val >= 0 ? '$' : '-$'}${Math.abs(val).toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={isLight ? '#94a3b8' : '#404040'} strokeWidth={1} />
              <Bar dataKey="realizedPnL" radius={[2, 2, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.realizedPnL > 0
                        ? '#10b981'
                        : entry.realizedPnL < 0
                        ? '#f43f5e'
                        : isLight ? '#94a3b8' : '#525252'
                    }
                    fillOpacity={entry.realizedPnL === 0 ? 0.3 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : chartMode === 'CUMULATIVE' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isLight ? '#e2e8f0' : '#262626'}
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isLight ? '#cbd5e1' : '#262626' }}
                interval={4}
              />
              <YAxis
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={50}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val >= 0 ? '$' : '-$'}${Math.abs(val).toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={isLight ? '#94a3b8' : '#404040'} strokeWidth={1} />
              <Area
                type="monotone"
                dataKey="cumulativePnL"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCum)"
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="composedCumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isLight ? '#e2e8f0' : '#262626'}
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: isLight ? '#cbd5e1' : '#262626' }}
                interval={4}
              />
              <YAxis
                stroke={isLight ? '#64748b' : '#737373'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={50}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${val >= 0 ? '$' : '-$'}${Math.abs(val).toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={isLight ? '#94a3b8' : '#404040'} strokeWidth={1} />
              <Bar dataKey="realizedPnL" radius={[2, 2, 0, 0]} maxBarSize={22}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`comp-cell-${index}`}
                    fill={
                      entry.realizedPnL > 0
                        ? '#10b981'
                        : entry.realizedPnL < 0
                        ? '#f43f5e'
                        : isLight ? '#94a3b8' : '#525252'
                    }
                    fillOpacity={entry.realizedPnL === 0 ? 0.3 : 0.75}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="cumulativePnL"
                stroke={isLight ? '#0284c7' : '#38bdf8'}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend & Broker Note */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t text-[10px] font-mono ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-neutral-800/60 text-neutral-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            Profitable Day
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            Loss Day
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-sky-500 inline-block" />
            30D Cumulative Equity
          </span>
        </div>

        <div className={isLight ? 'text-slate-500' : 'text-neutral-500'}>
          Broker: <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-300'}`}>{brokerName}</span> •{' '}
          Maker: <span className="text-amber-600 font-bold">0.016%</span> | Taker: <span className="text-orange-600 font-bold">0.064% (4x)</span>
        </div>
      </div>
    </div>
  );
};
