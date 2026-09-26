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
} from 'lucide-react';
import { MarketAsset, SpotHolding, Position, TradeRecord, SHARK_EXCHANGE } from '../../types/trading';
import { exportTradeHistoryAndMetricsCSV } from '../../utils/csvExporter';
import { useTheme } from '../../context/ThemeContext';

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
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
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
    <div
      className="rounded-md p-4 space-y-4 border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
    >
      {/* Top Header with Broker Profile & CSV Export */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold tracking-tight uppercase">
              Portfolio Overview
            </h2>
          </div>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[9px] font-bold bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] uppercase tracking-widest"
          >
            <Building2 className="w-3 h-3" />
            <span>{brokerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gold hedge stability badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {goldHedgeRatio >= 20 ? (
              <span
                className="px-2.5 py-1 rounded-sm border flex items-center gap-1 font-bold text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase tracking-widest"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Hedge Solid
              </span>
            ) : (
              <span
                className="px-2.5 py-1 rounded-sm border flex items-center gap-1 font-bold text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30 uppercase tracking-widest"
              >
                <Coins className="w-3.5 h-3.5" />
                Low Hedge
              </span>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95"
          >
            {isExporting ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3 stroke-[2.5]" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono tabular-nums">
        {/* Total Equity */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Net Equity
          </span>
          <span className="text-sm font-bold">
            ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Free Cash */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Free Cash
          </span>
          <span className="text-sm font-bold text-emerald-500">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Margin in Play */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Margin
          </span>
          <span className="text-sm font-bold text-amber-500">
            ${marginLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Unrealized PnL */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Unrealized
          </span>
          <span className={`text-sm font-bold ${isUnrealizedProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isUnrealizedProfit ? '+' : ''}${unrealizedPnL.toFixed(2)}
          </span>
        </div>

        {/* Realized PnL */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Realized
          </span>
          <span className={`text-sm font-bold ${isRealizedProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isRealizedProfit ? '+' : ''}${realizedPnL.toFixed(2)}
          </span>
        </div>

        {/* Win Rate & Trades */}
        <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
          <span className="text-[8px] uppercase font-sans font-bold block text-[var(--theme-text-muted)] tracking-widest mb-1">
            Performance
          </span>
          <span className="text-sm font-bold block">
            {winRate.toFixed(0)}% <span className="text-[9px] font-medium text-[var(--theme-text-muted)] tracking-tighter">({totalTrades} TRADES)</span>
          </span>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      <div className="pt-3 border-t border-[var(--theme-border-subtle)]">
        <div className="flex justify-between text-[8px] mb-2 font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
          <span>Exposure Allocation</span>
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              GOLD {goldPct.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              CRYPTO {cryptoPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="h-1 w-full rounded-full overflow-hidden flex bg-[var(--theme-bg-card-subtle)]">
          <div
            style={{ width: `${goldPct}%` }}
            className="h-full bg-amber-500 transition-all duration-700 ease-out"
          />
          <div
            style={{ width: `${cryptoPct}%` }}
            className="h-full bg-blue-500 transition-all duration-700 ease-out"
          />
          <div
            style={{ width: `${cashPct}%` }}
            className="h-full bg-[var(--theme-border)] transition-all duration-700 ease-out"
          />
        </div>
      </div>
    </div>
  );
};
