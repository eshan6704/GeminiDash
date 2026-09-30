import React, { useState } from 'react';
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

  // Calculate allocation breakdown
  let goldNotional = 0;
  let cryptoNotional = 0;

  spotHoldings.forEach((h) => {
    const p = assets[h.symbol]?.price || h.avgCostPrice;
    const val = h.amount * p;
    if (assets[h.symbol]?.category === 'gold') goldNotional += val;
    else cryptoNotional += val;
  });

  positions.forEach((pos) => {
    const notional = pos.amount * (assets[pos.assetSymbol]?.price || pos.entryPrice);
    if (assets[pos.assetSymbol]?.category === 'gold') goldNotional += notional;
    else cryptoNotional += notional;
  });

  const totalExposure = goldNotional + cryptoNotional + cashBalance;
  const goldPct = totalExposure > 0 ? (goldNotional / totalExposure) * 100 : 0;
  const cryptoPct = totalExposure > 0 ? (cryptoNotional / totalExposure) * 100 : 0;
  const cashPct = totalExposure > 0 ? (cashBalance / totalExposure) * 100 : 0;

  return (
    <div className="rounded-lg p-3 space-y-2.5 border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      {/* Compact Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold tracking-tight uppercase">
            Portfolio Summary
          </h2>
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
          >
            {isExporting ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
            <span>{isExporting ? 'Exported' : 'CSV'}</span>
          </button>
        </div>
      </div>

      {/* Minimal 6-Metric Row (Equity, Free Cash, Margin, Unrealized Return, Realized Return, Total Fees) */}
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
    </div>
  );
};
