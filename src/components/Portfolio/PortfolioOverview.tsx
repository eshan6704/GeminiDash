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
  const { isLight } = useTheme();
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
      className={`rounded-2xl p-4 shadow-lg space-y-3 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
      }`}
    >
      {/* Top Header with Broker Profile & CSV Export */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-500" />
            <h2 className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Portfolio & Risk Metrics
            </h2>
          </div>

          {/* Shark Exchange Broker Identity Tag */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
              isLight
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Building2 className="w-3 h-3 text-cyan-500" />
            <span>Broker: {brokerName}</span>
            <span className="opacity-40 font-normal">|</span>
            <span className={isLight ? 'text-slate-600 font-mono' : 'text-neutral-300 font-mono'}>
              0.016% Maker • 0.064% Taker
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gold hedge stability badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {goldHedgeRatio >= 20 ? (
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-semibold text-[11px] ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Solid Gold Hedge ({goldHedgeRatio.toFixed(1)}%)
              </span>
            ) : (
              <span
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-semibold text-[11px] ${
                  isLight
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                Low Gold Cushion ({goldHedgeRatio.toFixed(1)}%)
              </span>
            )}
          </div>

          {/* Export Trade History & Metrics CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export trade history, active positions, and performance metrics as CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            {isExporting ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shark Exchange Broker Rules Ribbon */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-neutral-950/60 border-neutral-800/70 text-neutral-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className={`font-semibold font-sans ${isLight ? 'text-slate-900' : 'text-neutral-300'}`}>
            Shark Exchange Specs:
          </span>
          <span>
            Brokerage: <strong className="text-amber-600 font-bold">0.016% Maker</strong> |{' '}
            <strong className="text-orange-600 font-bold">0.064% Taker (4x)</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Gold Margin: <strong className="text-amber-600 font-bold">75x</strong> (0.1 size std)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            BTC Margin: <strong className="text-orange-600 font-bold">150x</strong> (0.002 lot std)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Rest (SOL/etc.): <strong className="text-blue-600 font-bold">25x</strong> (0.002 lot)
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-1 font-mono">
        {/* Total Equity */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Total Net Equity
          </span>
          <span className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
            ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Free Cash */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Free USDT Cash
          </span>
          <span className="text-sm sm:text-base font-bold text-emerald-600">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Margin in Play */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Margin Locked
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-600">
            ${marginLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Unrealized PnL */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Unrealized PnL
          </span>
          <span
            className={`text-sm sm:text-base font-bold ${
              isUnrealizedProfit ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isUnrealizedProfit ? '+' : ''}${unrealizedPnL.toFixed(2)}
          </span>
        </div>

        {/* Realized PnL */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Realized PnL (Net)
          </span>
          <span
            className={`text-sm sm:text-base font-bold ${
              isRealizedProfit ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isRealizedProfit ? '+' : ''}${realizedPnL.toFixed(2)}
          </span>
        </div>

        {/* Win Rate & Brokerage Fees */}
        <div
          className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
          }`}
        >
          <span className={`text-[10px] uppercase font-sans font-semibold block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
            Win Rate / Fees Paid
          </span>
          <span className={`text-sm sm:text-base font-bold block ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
            {winRate.toFixed(0)}%{' '}
            <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
              ({totalTrades} trades)
            </span>
          </span>
          <span className="text-[10px] text-amber-600 font-medium block mt-0.5" title="Maker: 0.016% | Taker: 0.064% (4x Maker)">
            Fees: ${totalFeesPaid.toFixed(2)} (0.016% M / 0.064% T)
          </span>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-neutral-800/60'}`}>
        <div className={`flex justify-between text-[11px] mb-1.5 font-medium ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
          <span>Asset Exposure Allocation:</span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Gold (XAUT): {goldPct.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Crypto: {cryptoPct.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Cash: {cashPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Segmented Bar */}
        <div className={`h-2 w-full rounded-full overflow-hidden flex ${isLight ? 'bg-slate-200' : 'bg-neutral-950'}`}>
          <div
            style={{ width: `${goldPct}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
            title={`Gold: ${goldPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${cryptoPct}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            title={`Crypto: ${cryptoPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${cashPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Cash: ${cashPct.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};
