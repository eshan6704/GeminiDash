import React, { useState } from 'react';
import {
  Position,
  LimitOrder,
  TradeRecord,
  SpotHolding,
  MarketAsset,
} from '../../types/trading';
import {
  TrendingUp,
  TrendingDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  History,
  Coins,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PositionsTableProps {
  positions: Position[];
  limitOrders: LimitOrder[];
  tradeHistory: TradeRecord[];
  spotHoldings: SpotHolding[];
  assets: Record<string, MarketAsset>;
  onClosePosition: (positionId: string, percentage: number) => void;
  onCancelLimitOrder: (orderId: string) => void;
  onUpdateSLTP: (positionId: string, stopLoss?: number, takeProfit?: number, trailingStopPercent?: number) => void;
  onSelectSymbol: (symbol: string) => void;
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
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'spot' | 'history'>('positions');
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
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

  return (
    <div
      className="rounded-md border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
    >
      {/* Tabs Header */}
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-[var(--theme-border-subtle)] gap-2">
        <div className="flex items-center gap-1 p-1 bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded-md">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all ${
              activeTab === 'positions'
                ? 'bg-[var(--theme-border)] text-emerald-500 border border-[var(--theme-border-subtle)]'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Positions</span>
            <span
              className={`px-1.5 py-0.2 rounded-sm font-mono text-[9px] bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)]`}
            >
              {positions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-[var(--theme-border)] text-emerald-500 border border-[var(--theme-border-subtle)]'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Book</span>
            {limitOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-sm font-mono text-[9px] bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)]">
                {limitOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('spot')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all ${
              activeTab === 'spot'
                ? 'bg-[var(--theme-border)] text-emerald-500 border border-[var(--theme-border-subtle)]'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
            }`}
          >
            <Coins className="w-3 h-3" />
            <span>Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[var(--theme-border)] text-emerald-500 border border-[var(--theme-border-subtle)]'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Log</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Open Leveraged Positions */}
      {activeTab === 'positions' && (
        <div className="p-0 overflow-x-auto">
          {positions.length === 0 ? (
            <div className="py-16 text-center text-[var(--theme-text-muted)]">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] uppercase tracking-widest">No Active Positions</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border-subtle)] text-[9px] text-[var(--theme-text-muted)] uppercase tracking-widest bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5 font-bold">Contract</th>
                  <th className="px-4 py-2.5 font-bold">Size</th>
                  <th className="px-4 py-2.5 font-bold">Entry</th>
                  <th className="px-4 py-2.5 font-bold">Mark</th>
                  <th className="px-4 py-2.5 font-bold">Liq.</th>
                  <th className="px-4 py-2.5 font-bold">Margin</th>
                  <th className="px-4 py-2.5 font-bold">PnL</th>
                  <th className="px-4 py-2.5 font-bold">Risk</th>
                  <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {positions.map((pos) => {
                  const asset = assets[pos.assetSymbol];
                  const curPrice = asset ? asset.price : pos.entryPrice;
                  const isLong = pos.side === 'LONG';
                  const isProfit = pos.unrealizedPnL >= 0;
                  const distLiqPct = curPrice > 0
                    ? Math.abs((pos.liquidationPrice - curPrice) / curPrice) * 100
                    : 100;
                  const isNearLiq = distLiqPct < 6;

                  return (
                    <tr
                      key={pos.id}
                      className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors"
                    >
                      {/* Pair & Side */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectSymbol(pos.assetSymbol)}
                          className="flex items-center gap-2 hover:text-emerald-400 transition-colors font-bold uppercase"
                        >
                          <span>{pos.assetSymbol}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold border ${
                              isLong
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {pos.leverage}x {pos.side}
                          </span>
                        </button>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                        {pos.amount.toFixed(4)}
                      </td>

                      {/* Entry Price */}
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        ${pos.entryPrice.toFixed(pos.entryPrice < 10 ? 4 : 2)}
                      </td>

                      {/* Mark Price */}
                      <td className="px-4 py-3 font-bold text-[var(--theme-text-primary)]">
                        ${curPrice.toFixed(curPrice < 10 ? 4 : 2)}
                      </td>

                      {/* Liquidation Price */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isNearLiq && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />}
                          <span className={isNearLiq ? 'text-rose-500 font-bold' : 'text-orange-500'}>
                            ${pos.liquidationPrice.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--theme-text-secondary)]">${pos.margin.toFixed(2)}</div>
                        <div className="text-[9px] text-[var(--theme-text-muted)]">Val: ${(pos.entryPrice * pos.amount).toFixed(0)}</div>
                      </td>

                      {/* Unrealized PnL */}
                      <td className="px-4 py-3">
                        <div className={`font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                        </div>
                        <div className={`text-[9px] ${isProfit ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                          {isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(1)}%
                        </div>
                      </td>

                      {/* TP / SL */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-[9px] leading-tight">
                            <div className="text-emerald-500/80">TP: {pos.takeProfitPrice ? `$${pos.takeProfitPrice.toFixed(1)}` : '--'}</div>
                            <div className="text-rose-500/80">SL: {pos.stopLossPrice ? `$${pos.stopLossPrice.toFixed(1)}` : '--'}</div>
                          </div>
                          <button
                            onClick={() => openEditModal(pos)}
                            className="p-1 rounded-sm hover:bg-[var(--theme-border)] text-[var(--theme-text-muted)] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onClosePosition(pos.id, 50)}
                            className="px-2 py-1 rounded-sm text-[9px] font-bold bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-border)] border border-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)] transition-colors"
                          >
                            50%
                          </button>
                          <button
                            onClick={() => onClosePosition(pos.id, 100)}
                            className="px-2.5 py-1 rounded-sm text-[9px] font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors uppercase"
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
        <div className="p-0 overflow-x-auto">
          {limitOrders.length === 0 ? (
            <div className="py-16 text-center text-[var(--theme-text-muted)]">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] uppercase tracking-widest">Order Book Empty</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border-subtle)] text-[9px] text-[var(--theme-text-muted)] uppercase tracking-widest bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5 font-bold">Pair</th>
                  <th className="px-4 py-2.5 font-bold">Type</th>
                  <th className="px-4 py-2.5 font-bold">Target</th>
                  <th className="px-4 py-2.5 font-bold">Market</th>
                  <th className="px-4 py-2.5 font-bold">Units</th>
                  <th className="px-4 py-2.5 font-bold">Margin</th>
                  <th className="px-4 py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {limitOrders.map((order) => {
                  const asset = assets[order.assetSymbol];
                  const curPrice = asset ? asset.price : order.targetPrice;
                  const isBuy = order.side === 'BUY';

                  return (
                    <tr key={order.id} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-3 font-bold text-[var(--theme-text-primary)] uppercase">
                        {order.assetSymbol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {order.mode} {order.side} {order.leverage > 1 ? `(${order.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-500 font-bold">
                        ${order.targetPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        ${curPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                        {order.amount.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        <div className="font-bold text-[var(--theme-text-secondary)]">${order.margin.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onCancelLimitOrder(order.id)}
                          className="px-2 py-1 rounded-sm text-rose-400 text-[9px] font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors uppercase"
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
        <div className="p-0 overflow-x-auto">
          {spotHoldings.length === 0 ? (
            <div className="py-16 text-center text-[var(--theme-text-muted)]">
              <Coins className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] uppercase tracking-widest">Spot Wallet Empty</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border-subtle)] text-[9px] text-[var(--theme-text-muted)] uppercase tracking-widest bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5 font-bold">Asset</th>
                  <th className="px-4 py-2.5 font-bold">Balance</th>
                  <th className="px-4 py-2.5 font-bold">Avg. Cost</th>
                  <th className="px-4 py-2.5 font-bold">Market</th>
                  <th className="px-4 py-2.5 font-bold">Total Value</th>
                  <th className="px-4 py-2.5 font-bold">PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {spotHoldings.map((h) => {
                  const asset = assets[h.symbol];
                  const curPrice = asset ? asset.price : h.avgCostPrice;
                  const totalVal = h.amount * curPrice;
                  const totalCost = h.amount * h.avgCostPrice;
                  const pnl = totalVal - totalCost;
                  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={h.symbol} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold flex items-center gap-2 uppercase">
                          <span>{h.symbol}</span>
                          {asset?.category === 'gold' && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-sm font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                              Gold
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--theme-text-secondary)]">
                        {h.amount.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        ${h.avgCostPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                        ${curPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--theme-text-primary)]">
                        ${totalVal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPct.toFixed(1)}%)
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
        <div className="p-0 overflow-x-auto">
          {tradeHistory.length === 0 ? (
            <div className="py-16 text-center text-[var(--theme-text-muted)]">
              <History className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] uppercase tracking-widest">Log History Empty</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border-subtle)] text-[9px] text-[var(--theme-text-muted)] uppercase tracking-widest bg-[var(--theme-bg-card-subtle)]">
                  <th className="px-4 py-2.5 font-bold">Time</th>
                  <th className="px-4 py-2.5 font-bold">Asset</th>
                  <th className="px-4 py-2.5 font-bold">Mode</th>
                  <th className="px-4 py-2.5 font-bold">Entry</th>
                  <th className="px-4 py-2.5 font-bold">Exit</th>
                  <th className="px-4 py-2.5 font-bold">Realized PnL</th>
                  <th className="px-4 py-2.5 font-bold text-right">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {tradeHistory.map((rec) => {
                  const isProfit = rec.realizedPnL >= 0;
                  const dateStr = new Date(rec.closeTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={rec.id} className="hover:bg-[var(--theme-bg-card-subtle)] transition-colors">
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--theme-text-primary)] uppercase">
                        {rec.assetSymbol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${
                            rec.side === 'LONG' || rec.side === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {rec.side} {rec.leverage > 1 ? `(${rec.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-muted)]">
                        ${rec.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                        ${rec.exitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isProfit ? '+' : ''}${rec.realizedPnL.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-tighter">
                          {rec.closeReason.replace('_', ' ')}
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

      {/* Inline TP / SL Edit Modal */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl p-5 max-w-sm w-full shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Adjust SL / TP: {editingPosition.assetSymbol} {editingPosition.leverage}x
                </h3>
              </div>
              <button
                onClick={() => setEditingPosition(null)}
                className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSLTP} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-600 font-semibold mb-1">
                  Take-Profit Price (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalTP}
                  onChange={(e) => setModalTP(e.target.value)}
                  placeholder="e.g. 4500"
                  className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-rose-600 font-semibold mb-1">
                  Stop-Loss Price (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalSL}
                  onChange={(e) => setModalSL(e.target.value)}
                  placeholder="e.g. 4200"
                  className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-rose-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-amber-500 font-semibold mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Trailing Stop (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={modalTrailing}
                  onChange={(e) => setModalTrailing(e.target.value)}
                  placeholder="e.g. 2.5"
                  className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                  }`}
                />
                <p className="text-[10px] text-neutral-500 mt-1">Leave empty to disable trailing.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
                  className={`flex-1 py-2 rounded-xl font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm"
                >
                  Save Levels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
