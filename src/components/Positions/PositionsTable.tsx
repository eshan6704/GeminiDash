import React, { useState, useMemo } from 'react';
import {
  Position,
  LimitOrder,
  TradeRecord,
  SpotHolding,
  MarketAsset,
} from '../../types/trading';
import {
  X,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  History,
  Coins,
  Edit2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from 'lucide-react';
import { useInrCurrency, InrCurrencyToggle } from '../../utils/inrCurrency';

interface PositionsTableProps {
  positions: Position[];
  limitOrders: LimitOrder[];
  tradeHistory: TradeRecord[];
  spotHoldings: SpotHolding[];
  assets: Record<string, MarketAsset>;
  onClosePosition: (positionId: string, percentage: number) => void;
  onCancelLimitOrder: (orderId: string) => void;
  onUpdateSLTP: (
    positionId: string,
    stopLoss?: number,
    takeProfit?: number,
    trailingStopPercent?: number
  ) => void;
  onSelectSymbol: (symbol: string) => void;
  onResetTradeHistory?: () => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  limitOrders,
  tradeHistory,
  spotHoldings,
  assets,
  onClosePosition,
  onCancelLimitOrder,
  onUpdateSLTP,
  onSelectSymbol,
  onResetTradeHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'spot' | 'history'>('positions');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'MANUAL' | 'AUTO_GRID'>('ALL');
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const { formatCurrency, currencySymbol, currencyLabel } = useInrCurrency();
  const [modalTP, setModalTP] = useState<string>('');
  const [modalSL, setModalSL] = useState<string>('');
  const [modalTrailing, setModalTrailing] = useState<string>('');

  const openEditModal = (pos: Position) => {
    setEditingPosition(pos);
    setModalTP(pos.takeProfitPrice ? pos.takeProfitPrice.toString() : '');
    setModalSL(pos.stopLossPrice ? pos.stopLossPrice.toString() : '');
    setModalTrailing(pos.trailingStopPercent ? pos.trailingStopPercent.toString() : '');
  };

  const handleSaveSLTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;

    const tp = modalTP ? parseFloat(modalTP) : undefined;
    const sl = modalSL ? parseFloat(modalSL) : undefined;
    const trailing = modalTrailing ? parseFloat(modalTrailing) : undefined;
    onUpdateSLTP(editingPosition.id, sl, tp, trailing);
    setEditingPosition(null);
  };

  const filteredPositions = useMemo(() => {
    if (sourceFilter === 'ALL') return positions;
    if (sourceFilter === 'AUTO_GRID') {
      return positions.filter((p) => p.accountSource === 'AUTO_GRID');
    }
    return positions.filter((p) => p.accountSource !== 'AUTO_GRID');
  }, [positions, sourceFilter]);

  // Aggregate telemetry linking Entry vs Current across filtered open positions
  const summaryStats = useMemo(() => {
    let totalEntryVal = 0;
    let totalCurrentVal = 0;
    let totalMargin = 0;
    let totalReturn = 0;
    let totalFees = 0;

    filteredPositions.forEach((pos) => {
      const asset = assets[pos.assetSymbol];
      const curPrice = asset ? asset.price : pos.entryPrice;
      const isLong = pos.side === 'LONG';
      const entryVal = pos.entryPrice * pos.amount;
      const curVal = curPrice * pos.amount;
      const priceDiff = isLong ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
      const posReturn = priceDiff * pos.amount; // Identical to isLong ? curVal - entryVal : entryVal - curVal

      totalEntryVal += entryVal;
      totalCurrentVal += curVal;
      totalMargin += pos.margin;
      totalReturn += posReturn;
      totalFees += pos.feePaid || 0;
    });

    const totalRoePct = totalMargin > 0 ? (totalReturn / totalMargin) * 100 : 0;
    const netAfterFee = totalReturn - totalFees;

    return {
      totalEntryVal,
      totalCurrentVal,
      totalMargin,
      totalReturn,
      totalRoePct,
      totalFees,
      netAfterFee,
    };
  }, [filteredPositions, assets]);

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: val < 10 ? 4 : 2,
      maximumFractionDigits: val < 10 ? 4 : 2,
    });

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] shadow-sm overflow-hidden">
      {/* Top Bar: Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--theme-border-subtle)] gap-2.5">
        <div className="flex items-center gap-1 p-1 bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border)] rounded-lg text-xs font-sans font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'positions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Positions ({positions.length}/10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Limit Orders ({limitOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'spot'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Spot Wallet ({spotHoldings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Execution Log ({tradeHistory.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <InrCurrencyToggle />

          {activeTab === 'positions' && positions.length > 0 && (
            <>
              <div className="flex p-0.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold">
                {(
                  [
                    { id: 'ALL', label: `All (${positions.length})` },
                    {
                      id: 'MANUAL',
                      label: `Manual (${positions.filter((p) => p.accountSource !== 'AUTO_GRID').length})`,
                    },
                    {
                      id: 'AUTO_GRID',
                      label: `Auto Grid (${positions.filter((p) => p.accountSource === 'AUTO_GRID').length})`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSourceFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      sourceFilter === f.id
                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-bold shadow-2xs'
                        : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  filteredPositions.forEach((p) => onClosePosition(p.id, 100));
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Close All ({filteredPositions.length})</span>
              </button>
            </>
          )}

          {onResetTradeHistory && (
            <button
              type="button"
              onClick={onResetTradeHistory}
              title="Clear previous closed trade returns and log history while keeping active running positions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Returns &amp; Log ({tradeHistory.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Entry vs Current Summary Strip when Open Positions exist */}
      {activeTab === 'positions' && filteredPositions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border-subtle)] font-mono text-xs tabular-nums">
          <div className="flex items-center justify-between sm:block">
            <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)] block">
              Entry Trade Val &rarr; Current Val ({currencyLabel})
            </span>
            <div>
              <span className="font-bold text-[var(--theme-text-primary)] block">
                {formatCurrency(summaryStats.totalEntryVal, { usdDecimals: 2, inrDecimals: 2 })} &rarr;{' '}
                {formatCurrency(summaryStats.totalCurrentVal, { usdDecimals: 2, inrDecimals: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:block">
            <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)] block">
              Total Margin Locked ({currencyLabel})
            </span>
            <div>
              <span className="font-bold text-amber-600 block">
                {formatCurrency(summaryStats.totalMargin, { usdDecimals: 4, inrDecimals: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:block">
            <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)] block">
              Unrealized Return ({currencyLabel})
            </span>
            <div>
              <span
                className={`font-extrabold block ${
                  summaryStats.totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(summaryStats.totalReturn, { signed: true, usdDecimals: 4, inrDecimals: 2 })} (
                {summaryStats.totalRoePct >= 0 ? '+' : ''}
                {summaryStats.totalRoePct.toFixed(1)}% ROE)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:block">
            <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)] block">
              Net Return After Fees ({currencyLabel})
            </span>
            <div>
              <span
                className={`font-bold block ${
                  summaryStats.netAfterFee >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(summaryStats.netAfterFee, { signed: true, usdDecimals: 4, inrDecimals: 2 })}{' '}
                <span className="text-[10px] font-normal text-[var(--theme-text-muted)]">
                  (Fee {formatCurrency(summaryStats.totalFees, { usdDecimals: 4, inrDecimals: 2 })})
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Open Leveraged Positions */}
      {activeTab === 'positions' && (
        <div className="overflow-x-auto">
          {filteredPositions.length === 0 ? (
            <div className="py-12 text-center text-[var(--theme-text-muted)]">
              <Layers className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No Active Open Positions</p>
              <p className="text-[11px] mt-0.5">
                Open a trade from Direct Trade, PnL Forecasting, or Auto Grid to track live Entry vs Current returns.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-3.5 py-2.5">Slot &amp; Contract</th>
                  <th className="px-3 py-2.5 text-right">Size (Lot)</th>
                  <th className="px-3.5 py-2.5 text-right">Entry &rarr; Current Price (&Delta; Pts)</th>
                  <th className="px-3.5 py-2.5 text-right">Trade Val &amp; Margin ({currencySymbol})</th>
                  <th className="px-3.5 py-2.5 text-right">Return &amp; Fee ({currencySymbol})</th>
                  <th className="px-3.5 py-2.5 text-right">Liquidation &amp; Risk</th>
                  <th className="px-3.5 py-2.5 text-right">TP / SL Protection</th>
                  <th className="px-3.5 py-2.5 text-right">Quick Close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {filteredPositions.map((pos, idx) => {
                  const asset = assets[pos.assetSymbol];
                  const curPrice = asset ? asset.price : pos.entryPrice;
                  const isLong = pos.side === 'LONG';

                  // Price difference linked to Entry & Current Price
                  const signedPriceDiff = isLong
                    ? curPrice - pos.entryPrice
                    : pos.entryPrice - curPrice;
                  const rawPriceChangePct =
                    pos.entryPrice > 0 ? (signedPriceDiff / pos.entryPrice) * 100 : 0;

                  // Trade Value linked to Entry & Current Price
                  const entryVal = pos.entryPrice * pos.amount;
                  const curVal = curPrice * pos.amount;

                  // Return = (Current Price - Entry Price) * Lot = Change in Trade Value
                  const valDiff = signedPriceDiff * pos.amount;
                  const roePct = pos.margin > 0 ? (valDiff / pos.margin) * 100 : 0;
                  const isValProfit = valDiff >= 0;
                  const fee = pos.feePaid || 0;
                  const netAfterFee = valDiff - fee;

                  const isPastLiq = isLong
                    ? curPrice <= pos.liquidationPrice
                    : curPrice >= pos.liquidationPrice;
                  const distLiqPts = Math.abs(curPrice - pos.liquidationPrice);
                  const distLiqPct =
                    curPrice > 0 ? (distLiqPts / curPrice) * 100 : 100;
                  const isNearLiq = isPastLiq || distLiqPct < 5;

                  return (
                    <tr
                      key={pos.id}
                      className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors"
                    >
                      {/* 1. Slot & Contract */}
                      <td className="px-3.5 py-3">
                        <button
                          type="button"
                          onClick={() => onSelectSymbol(pos.assetSymbol)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[var(--theme-text-muted)]">
                              #{idx + 1}
                            </span>
                            <span className="font-extrabold text-[var(--theme-text-primary)] group-hover:text-emerald-600 transition-colors">
                              {pos.assetSymbol}/USDT
                            </span>
                            <span
                              className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${
                                isLong ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isLong ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {pos.leverage}x {pos.side}
                            </span>
                          </div>
                          <div className="text-[10px] font-sans text-[var(--theme-text-muted)] mt-0.5">
                            {pos.accountSource === 'AUTO_GRID' ? 'Auto Grid Bot' : 'Direct Manual'}
                          </div>
                        </button>
                      </td>

                      {/* 2. Size (Lot) */}
                      <td className="px-3 py-3 text-right">
                        <div className="font-bold text-[var(--theme-text-primary)]">
                          {pos.amount.toFixed(4)}
                        </div>
                        <div className="text-[10px] font-sans text-[var(--theme-text-muted)]">
                          {pos.assetSymbol}
                        </div>
                      </td>

                      {/* 3. Entry -> Current Price (Delta Pts & %) */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="font-bold text-[var(--theme-text-primary)] whitespace-nowrap">
                          <span className="text-[var(--theme-text-secondary)] font-normal">
                            ${formatPrice(pos.entryPrice)}
                          </span>{' '}
                          &rarr; <span>${formatPrice(curPrice)}</span>
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            signedPriceDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {signedPriceDiff >= 0 ? '+' : ''}
                          {signedPriceDiff.toFixed(2)} pts ({rawPriceChangePct >= 0 ? '+' : ''}
                          {rawPriceChangePct.toFixed(2)}%)
                        </div>
                      </td>

                      {/* 4. Trade Value (Entry -> Current) & Margin */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="font-semibold text-[var(--theme-text-primary)] whitespace-nowrap">
                          <span className="text-[var(--theme-text-secondary)]">
                            {formatCurrency(entryVal, { usdDecimals: 2, inrDecimals: 2 })}
                          </span>{' '}
                          &rarr;{' '}
                          <span className="font-bold">
                            {formatCurrency(curVal, { usdDecimals: 2, inrDecimals: 2 })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)] whitespace-nowrap">
                          Margin:{' '}
                          <strong className="text-amber-600">
                            {formatCurrency(pos.margin, {
                              usdDecimals: pos.margin < 10 ? 4 : 2,
                              inrDecimals: 2,
                            })}
                          </strong>
                        </div>
                      </td>

                      {/* 5. Linked Return (Price Delta * Lot = Change in Trade Value) */}
                      <td className="px-3.5 py-3 text-right">
                        <div
                          className={`font-extrabold text-xs whitespace-nowrap ${
                            isValProfit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(valDiff, { signed: true, usdDecimals: 4, inrDecimals: 2 })}{' '}
                          <span className="text-[11px]">
                            ({isValProfit ? '+' : ''}
                            {roePct.toFixed(1)}% ROE)
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)] whitespace-nowrap">
                          Fee: {formatCurrency(fee, { usdDecimals: 4, inrDecimals: 2 })} &middot; Net:{' '}
                          <span className={netAfterFee >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {formatCurrency(netAfterFee, { signed: true, usdDecimals: 4, inrDecimals: 2 })}
                          </span>
                        </div>
                      </td>

                      {/* 6. Liquidation & Distance */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isNearLiq && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          <span
                            className={
                              isNearLiq
                                ? 'text-rose-600 font-bold'
                                : 'text-amber-600 font-semibold'
                            }
                          >
                            ${formatPrice(pos.liquidationPrice)}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)]">
                          {isPastLiq ? (
                            <span className="text-rose-600 font-bold">Past Liq (Uncapped)</span>
                          ) : (
                            <span>
                              {distLiqPts.toFixed(0)} pts ({distLiqPct.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. TP / SL Protection */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <div className="text-[11px] leading-tight text-right">
                            <div className="text-emerald-600">
                              TP:{' '}
                              {pos.takeProfitPrice
                                ? `$${pos.takeProfitPrice.toFixed(1)}`
                                : '--'}
                            </div>
                            <div className="text-rose-600">
                              SL:{' '}
                              {pos.stopLossPrice
                                ? `$${pos.stopLossPrice.toFixed(1)}`
                                : '--'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditModal(pos)}
                            className="p-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                            title="Edit TP / SL"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 8. Quick Close Actions */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-sans">
                          <button
                            type="button"
                            onClick={() => onClosePosition(pos.id, 25)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                            title="Close 25% of position"
                          >
                            25%
                          </button>
                          <button
                            type="button"
                            onClick={() => onClosePosition(pos.id, 50)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                            title="Close 50% of position"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => onClosePosition(pos.id, 100)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Pending Limit Orders */}
      {activeTab === 'orders' && (
        <div className="overflow-x-auto">
          {limitOrders.length === 0 ? (
            <div className="py-12 text-center text-[var(--theme-text-muted)]">
              <Clock className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No Pending Limit Orders</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5">Pair</th>
                  <th className="px-4 py-2.5">Order Mode &amp; Side</th>
                  <th className="px-4 py-2.5 text-right">Target Entry vs Current</th>
                  <th className="px-4 py-2.5 text-right">Size (Lot)</th>
                  <th className="px-4 py-2.5 text-right">Target Trade Val ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Margin Locked ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {limitOrders.map((order) => {
                  const asset = assets[order.assetSymbol];
                  const curPrice = asset ? asset.price : order.targetPrice;
                  const isBuy = order.side === 'BUY';
                  const distPts = Math.abs(curPrice - order.targetPrice);

                  return (
                    <tr key={order.id} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-[var(--theme-text-primary)]">
                        {order.assetSymbol}/USDT
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-extrabold ${
                            isBuy ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {order.mode} {order.side} {order.leverage > 1 ? `(${order.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="font-bold text-amber-600">
                          ${formatPrice(order.targetPrice)}{' '}
                          <span className="text-[var(--theme-text-muted)] font-normal">
                            (Spot: ${formatPrice(curPrice)})
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)]">
                          {distPts.toFixed(2)} pts away
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--theme-text-primary)]">
                        {order.amount.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--theme-text-secondary)]">
                        <div>
                          {formatCurrency(order.targetPrice * order.amount, {
                            usdDecimals: 2,
                            inrDecimals: 2,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-[var(--theme-text-primary)]">
                        <div>
                          {formatCurrency(order.margin, { usdDecimals: 4, inrDecimals: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onCancelLimitOrder(order.id)}
                          className="px-2.5 py-1 rounded-md text-rose-600 text-[11px] font-sans font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Spot Wallet Holdings */}
      {activeTab === 'spot' && (
        <div className="overflow-x-auto">
          {spotHoldings.length === 0 ? (
            <div className="py-12 text-center text-[var(--theme-text-muted)]">
              <Coins className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">Spot Wallet Empty</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5">Asset</th>
                  <th className="px-4 py-2.5 text-right">Quantity</th>
                  <th className="px-4 py-2.5 text-right">Entry Cost &rarr; Current Price</th>
                  <th className="px-4 py-2.5 text-right">Trade Val ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Return ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {spotHoldings.map((h) => {
                  const asset = assets[h.symbol];
                  const curPrice = asset ? asset.price : h.avgCostPrice;
                  const priceDiff = curPrice - h.avgCostPrice;
                  const totalCost = h.amount * h.avgCostPrice;
                  const totalVal = h.amount * curPrice;
                  const pnl = totalVal - totalCost;
                  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={h.symbol} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-[var(--theme-text-primary)]">
                        {h.symbol}/USDT
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-[var(--theme-text-primary)]">
                        {h.amount.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div>
                          ${formatPrice(h.avgCostPrice)} &rarr; <strong>${formatPrice(curPrice)}</strong>
                        </div>
                        <div className={`text-[10px] ${priceDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(2)} pts
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--theme-text-secondary)]">
                        <div>
                          {formatCurrency(totalCost, { usdDecimals: 2, inrDecimals: 2 })} &rarr;{' '}
                          <strong className="text-[var(--theme-text-primary)]">
                            {formatCurrency(totalVal, { usdDecimals: 2, inrDecimals: 2 })}
                          </strong>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-extrabold block ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(pnl, { signed: true, usdDecimals: 4, inrDecimals: 2 })} (
                          {isProfit ? '+' : ''}
                          {pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Trade Execution History */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          {tradeHistory.length === 0 ? (
            <div className="py-12 text-center text-[var(--theme-text-muted)]">
              <History className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">Execution Log Empty</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Contract &amp; Lot</th>
                  <th className="px-4 py-2.5">Side &amp; Leverage</th>
                  <th className="px-4 py-2.5 text-right">Entry &rarr; Exit Price (&Delta; Pts)</th>
                  <th className="px-4 py-2.5 text-right">Trade Val ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Fees ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Realized Return ({currencySymbol})</th>
                  <th className="px-4 py-2.5 text-right">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {tradeHistory.map((rec) => {
                  const isLong = rec.side === 'LONG' || rec.side === 'BUY';
                  const priceDiff = isLong
                    ? rec.exitPrice - rec.entryPrice
                    : rec.entryPrice - rec.exitPrice;
                  const entryVal = rec.entryPrice * rec.amount;
                  const exitVal = rec.exitPrice * rec.amount;
                  const valDiff = priceDiff * rec.amount;
                  const isProfit = valDiff >= 0;
                  const dateStr = new Date(rec.closeTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={rec.id} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--theme-text-muted)]">{dateStr}</td>
                      <td className="px-4 py-2.5 font-bold text-[var(--theme-text-primary)]">
                        {rec.assetSymbol}{' '}
                        <span className="text-[11px] font-normal text-[var(--theme-text-muted)]">
                          ({rec.amount})
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-extrabold ${
                            isLong ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {rec.side} {rec.leverage > 1 ? `(${rec.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div>
                          ${formatPrice(rec.entryPrice)} &rarr;{' '}
                          <strong className="text-[var(--theme-text-primary)]">
                            ${formatPrice(rec.exitPrice)}
                          </strong>
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            priceDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {priceDiff >= 0 ? '+' : ''}
                          {priceDiff.toFixed(2)} pts
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--theme-text-secondary)] whitespace-nowrap">
                        <div>
                          {formatCurrency(entryVal, { usdDecimals: 2, inrDecimals: 2 })} &rarr;{' '}
                          {formatCurrency(exitVal, { usdDecimals: 2, inrDecimals: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-amber-600 whitespace-nowrap">
                        <div>{formatCurrency(rec.fees || 0, { usdDecimals: 4, inrDecimals: 2 })}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div
                          className={`font-extrabold ${
                            isProfit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(valDiff, { signed: true, usdDecimals: 4, inrDecimals: 2 })}
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)]">
                          ({priceDiff >= 0 ? '+' : ''}
                          {priceDiff.toFixed(1)} pts &times; {rec.amount})
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)]">
                        {rec.closeReason.replace(/_/g, ' ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Inline TP / SL Edit Modal */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-xl p-5 max-w-sm w-full shadow-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border-subtle)] mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-[var(--theme-text-primary)]">
                  Adjust SL / TP: {editingPosition.assetSymbol} {editingPosition.leverage}x
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSLTP} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-600 font-bold mb-1">
                  Take-Profit Price (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalTP}
                  onChange={(e) => setModalTP(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-rose-600 font-bold mb-1">
                  Stop-Loss Price (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalSL}
                  onChange={(e) => setModalSL(e.target.value)}
                  placeholder="e.g. 4200"
                  className="w-full border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-amber-600 font-bold mb-1">
                  Trailing Stop Distance (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={modalTrailing}
                  onChange={(e) => setModalTrailing(e.target.value)}
                  placeholder="e.g. 0.5 for 0.5% trail"
                  className="w-full border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Protection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
