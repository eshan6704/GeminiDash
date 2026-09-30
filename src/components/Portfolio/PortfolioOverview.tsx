import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  PieChart,
  Percent,
  Coins,
  DollarSign,
  Download,
  Check,
  Building2,
  Sliders,
  Scale,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Activity,
  FileJson,
} from 'lucide-react';
import { MarketAsset, SpotHolding, Position, TradeRecord, SHARK_EXCHANGE } from '../../types/trading';
import { exportTradeHistoryAndMetricsCSV } from '../../utils/csvExporter';
import { useTheme } from '../../context/ThemeContext';
import { useInrCurrency, InrCurrencyToggle } from '../../utils/inrCurrency';

interface PortfolioOverviewProps {
  totalEquity: number;
  cashBalance: number;
  marginLocked: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalFeesPaid: number;
  winRate: number;
  totalTrades: number;
  goldHedgeRatio: number;
  spotHoldings: SpotHolding[];
  positions: Position[];
  assets: Record<string, MarketAsset>;
  tradeHistory?: TradeRecord[];
  brokerName?: string;
  onResetTradeHistory?: () => void;
  onResetSimulation?: () => void;
  onUpdateManualBalance?: (newBalance: number) => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  totalEquity,
  cashBalance,
  marginLocked,
  unrealizedPnL,
  realizedPnL,
  totalFeesPaid,
  winRate,
  totalTrades,
  goldHedgeRatio,
  spotHoldings,
  positions,
  assets,
  tradeHistory = [],
  brokerName = SHARK_EXCHANGE.name,
  onResetTradeHistory,
  onResetSimulation,
  onUpdateManualBalance,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAnalyticsCurve, setShowAnalyticsCurve] = useState<boolean>(false);
  const [manualBalInput, setManualBalInput] = useState<string>(cashBalance.toFixed(0));
  const { formatCurrency, currencyLabel } = useInrCurrency();

  React.useEffect(() => {
    setManualBalInput(cashBalance.toFixed(0));
  }, [cashBalance]);
  const isUnrealizedProfit = unrealizedPnL >= 0;
  const isRealizedProfit = realizedPnL >= 0;

  const handleExportCSV = () => {
    setIsExporting(true);
    exportTradeHistoryAndMetricsCSV({
      totalEquity,
      cashBalance,
      marginLocked,
      unrealizedPnL,
      realizedPnL,
      totalFeesPaid,
      winRate,
      totalTrades,
      goldHedgeRatio,
      positions,
      tradeHistory,
      spotHoldings,
      assets,
      brokerName,
    });
    setTimeout(() => {
      setIsExporting(false);
    }, 1800);
  };

  const handleExportJSON = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      accountSummary: {
        totalEquity,
        cashBalance,
        marginLocked,
        unrealizedPnL,
        realizedPnL,
        totalFeesPaid,
        winRate,
        totalTrades,
        goldHedgeRatio,
      },
      positions,
      spotHoldings,
      tradeHistory,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shark_trade_journal_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Equity Curve calculation based on trade history
  const equityPoints = useMemo(() => {
    const startBal = cashBalance - realizedPnL;
    let running = Math.max(1000, startBal);
    const points: { tradeIdx: number; equity: number }[] = [{ tradeIdx: 0, equity: running }];

    const sortedTrades = [...tradeHistory].reverse();
    sortedTrades.forEach((t, idx) => {
      running += t.realizedPnL || 0;
      points.push({ tradeIdx: idx + 1, equity: running });
    });

    if (points.length === 1) {
      points.push({ tradeIdx: 1, equity: totalEquity });
    }

    return points;
  }, [tradeHistory, cashBalance, realizedPnL, totalEquity]);

  // Strategy breakdown
  const strategyStats = useMemo(() => {
    const map: Record<string, { trades: number; wins: number; pnl: number }> = {
      'Scalp': { trades: 0, wins: 0, pnl: 0 },
      'Breakout': { trades: 0, wins: 0, pnl: 0 },
      'Swing': { trades: 0, wins: 0, pnl: 0 },
      'Hedge': { trades: 0, wins: 0, pnl: 0 },
    };

    tradeHistory.forEach((t, idx) => {
      const pnl = t.realizedPnL || 0;
      const strat = idx % 4 === 0 ? 'Scalp' : idx % 4 === 1 ? 'Breakout' : idx % 4 === 2 ? 'Swing' : 'Hedge';
      map[strat].trades += 1;
      if (pnl > 0) map[strat].wins += 1;
      map[strat].pnl += pnl;
    });

    return map;
  }, [tradeHistory]);

  const curveMin = Math.min(...equityPoints.map((p) => p.equity));
  const curveMax = Math.max(...equityPoints.map((p) => p.equity));
  const curveRange = curveMax - curveMin || 1;
  const cWidth = 500;
  const cHeight = 110;

  const curveSvgPath = useMemo(() => {
    if (equityPoints.length === 0) return '';
    const numPoints = equityPoints.length;
    return equityPoints
      .map((pt, idx) => {
        const x = numPoints > 1 ? (idx / (numPoints - 1)) * cWidth : cWidth / 2;
        const y = cHeight - ((pt.equity - curveMin) / curveRange) * (cHeight - 20) - 10;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [equityPoints, curveMin, curveRange]);

  return (
    <div className="rounded-lg p-3 space-y-2.5 border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      {/* Compact Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold tracking-tight uppercase">
            Portfolio Summary & Analytics
          </h2>
          <button
            onClick={() => setShowAnalyticsCurve(!showAnalyticsCurve)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20"
          >
            <Activity className="w-3 h-3" />
            <span>{showAnalyticsCurve ? 'Hide Growth Curve' : 'Show Equity Curve'}</span>
            {showAnalyticsCurve ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <InrCurrencyToggle />

          {onUpdateManualBalance && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[10px] font-mono">
              <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
                Balance ($):
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={manualBalInput}
                onChange={(e) => setManualBalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseFloat(manualBalInput);
                    if (!isNaN(val) && val >= 0) onUpdateManualBalance(val);
                  }
                }}
                className="w-20 px-1.5 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-emerald-500 font-bold text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(manualBalInput);
                  if (!isNaN(val) && val >= 0) onUpdateManualBalance(val);
                }}
                className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase cursor-pointer"
              >
                Set
              </button>
            </div>
          )}

          {onResetTradeHistory && (
            <button
              type="button"
              onClick={onResetTradeHistory}
              className="flex items-center gap-1 px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Log ({totalTrades})</span>
            </button>
          )}

          {onResetSimulation && (
            <button
              type="button"
              onClick={() => onResetSimulation()}
              className="flex items-center gap-1 px-2 py-1 rounded border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
            title="Export trade history to CSV"
          >
            {isExporting ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
            <span>{isExporting ? 'Exported' : 'CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg)] text-[var(--theme-text-primary)] text-[10px] font-bold cursor-pointer"
            title="Export full trade journal to JSON"
          >
            <FileJson className="w-3 h-3 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Minimal 6-Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono tabular-nums text-xs">
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Equity ({currencyLabel})</span>
          <span className="font-bold block">{formatCurrency(totalEquity, { usdDecimals: 2, inrDecimals: 2 })}</span>
        </div>
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Free Cash ({currencyLabel})</span>
          <span className="font-bold text-emerald-500 block">{formatCurrency(cashBalance, { usdDecimals: 2, inrDecimals: 2 })}</span>
        </div>
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Margin Used ({currencyLabel})</span>
          <span className="font-bold text-amber-500 block">{formatCurrency(marginLocked, { usdDecimals: 2, inrDecimals: 2 })}</span>
        </div>
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Unrealized Return ({currencyLabel})</span>
          <span className={`font-bold block ${isUnrealizedProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatCurrency(unrealizedPnL, { signed: true, usdDecimals: 4, inrDecimals: 2 })}
          </span>
        </div>
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Realized ({totalTrades} &middot; {currencyLabel})</span>
          <span className={`font-bold block ${isRealizedProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatCurrency(realizedPnL, { signed: true, usdDecimals: 2, inrDecimals: 2 })}
          </span>
        </div>
        <div className="p-2 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[10px] font-sans text-[var(--theme-text-muted)] block">Total Fees ({currencyLabel})</span>
          <span className="font-bold text-amber-600 block">{formatCurrency(totalFeesPaid, { usdDecimals: 4, inrDecimals: 2 })}</span>
        </div>
      </div>

      {/* EXPANDED EQUITY CURVE & STRATEGY JOURNAL */}
      {showAnalyticsCurve && (
        <div className="p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] space-y-3 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-[var(--theme-text-primary)]">Account Equity Growth Curve</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--theme-text-secondary)]">
              <span>Low: ${Math.round(curveMin).toLocaleString()}</span>
              <span className="text-emerald-500 font-bold">High: ${Math.round(curveMax).toLocaleString()}</span>
              <span>Win Rate: <strong className="text-cyan-400">{winRate.toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
            <svg viewBox={`0 0 ${cWidth} ${cHeight}`} className="w-full h-24 overflow-visible">
              <path
                d={curveSvgPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Strategy Breakdown Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {Object.entries(strategyStats).map(([name, stat]) => (
              <div
                key={name}
                className="p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-[var(--theme-text-primary)]">{name}</span>
                  <div className="text-[10px] text-[var(--theme-text-secondary)]">
                    {stat.trades} Trades ({stat.trades > 0 ? Math.round((stat.wins / stat.trades) * 100) : 0}% Win)
                  </div>
                </div>
                <span className={`font-bold font-mono ${stat.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stat.pnl >= 0 ? '+' : ''}${Math.round(stat.pnl).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
