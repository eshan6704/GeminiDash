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
  onUpdateSLTP: (positionId: string, stopLoss?: number, takeProfit?: number) => void;
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

  const openEditModal = (pos: Position) => {
    setEditingPosition(pos);
    setModalTP(pos.takeProfitPrice ? pos.takeProfitPrice.toString() : '');
    setModalSL(pos.stopLossPrice ? pos.stopLossPrice.toString() : '');
  };

  const handleSaveSLTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;

    const tp = modalTP ? parseFloat(modalTP) : undefined;
    const sl = modalSL ? parseFloat(modalSL) : undefined;
    onUpdateSLTP(editingPosition.id, sl, tp);
    setEditingPosition(null);
  };

  return (
    <div
      className={`rounded-2xl shadow-lg border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
      }`}
    >
      {/* Tabs Header */}
      <div className={`flex flex-wrap items-center justify-between p-3 border-b gap-2 ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'positions'
                ? isLight
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'bg-neutral-800 text-amber-400 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Positions</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                positions.length >= 10
                  ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : positions.length >= 7
                  ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : isLight ? 'bg-slate-200 text-slate-700' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {positions.length}/10
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? isLight
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'bg-neutral-800 text-amber-400 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Limit Orders</span>
            {limitOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isLight ? 'bg-slate-200 text-slate-700' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {limitOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('spot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'spot'
                ? isLight
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                  : 'bg-neutral-800 text-emerald-400 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Spot Wallet</span>
            {spotHoldings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {spotHoldings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? isLight
                  ? 'bg-slate-200 text-slate-900 shadow-xs'
                  : 'bg-neutral-800 text-neutral-200 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Execution Log</span>
            {tradeHistory.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isLight ? 'bg-slate-200 text-slate-600' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {tradeHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Open Leveraged Positions */}
      {activeTab === 'positions' && (
        <div className="p-4 overflow-x-auto">
          {positions.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className={isLight ? 'text-slate-600 font-medium' : 'text-neutral-400'}>No active leveraged positions open.</p>
              <p className={`mt-1 ${isLight ? 'text-slate-400' : 'text-neutral-600'}`}>
                Select an asset above and place a Buy/Long or Sell/Short order to simulate real market execution.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b text-[11px] ${isLight ? 'text-slate-500 border-slate-200' : 'text-neutral-500 border-neutral-800'}`}>
                  <th className="pb-2 font-medium">Contract / Pair</th>
                  <th className="pb-2 font-medium">Size (Units)</th>
                  <th className="pb-2 font-medium">Entry Price</th>
                  <th className="pb-2 font-medium">Mark Price</th>
                  <th className="pb-2 font-medium">Liquidation</th>
                  <th className="pb-2 font-medium">Margin</th>
                  <th className="pb-2 font-medium">Unrealized PnL</th>
                  <th className="pb-2 font-medium">TP / SL</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-neutral-800/60'}`}>
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
                      className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-800/30'}`}
                    >
                      {/* Pair & Side */}
                      <td className="py-3">
                        <button
                          onClick={() => onSelectSymbol(pos.assetSymbol)}
                          className={`flex items-center gap-1.5 hover:underline font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}
                        >
                          <span>{pos.assetSymbol}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold border ${
                              isLong
                                ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {pos.leverage}x {pos.side}
                          </span>
                        </button>
                        {asset?.category === 'gold' && (
                          <span className="text-[10px] text-amber-600 block font-sans font-medium">
                            Physical Swiss Gold
                          </span>
                        )}
                      </td>

                      {/* Size */}
                      <td className={`py-3 ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                        {pos.amount.toFixed(4)} {pos.assetSymbol}
                      </td>

                      {/* Entry Price */}
                      <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                        ${pos.entryPrice.toFixed(pos.entryPrice < 10 ? 4 : 2)}
                      </td>

                      {/* Mark Price */}
                      <td className={`py-3 font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                        ${curPrice.toFixed(curPrice < 10 ? 4 : 2)}
                      </td>

                      {/* Liquidation Price */}
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {isNearLiq && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />}
                          <span className={isNearLiq ? 'text-rose-600 font-bold' : 'text-orange-600 font-medium'}>
                            ${pos.liquidationPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                          {distLiqPct.toFixed(1)}% buffer
                        </span>
                      </td>

                      {/* Margin */}
                      <td className={`py-3 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>${pos.margin.toFixed(2)} USDT</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`} title="Trade Value = Entry Price × Qty">
                          Val: ${(pos.entryPrice * pos.amount).toFixed(2)}
                        </div>
                      </td>

                      {/* Unrealized PnL */}
                      <td className="py-3">
                        <div className={`font-bold text-sm ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ({isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(1)}% ROI)
                        </div>
                      </td>

                      {/* TP / SL */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                            <div>TP: <span className="text-emerald-600 font-medium">{pos.takeProfitPrice ? `$${pos.takeProfitPrice.toFixed(1)}` : '--'}</span></div>
                            <div>SL: <span className="text-rose-600 font-medium">{pos.stopLossPrice ? `$${pos.stopLossPrice.toFixed(1)}` : '--'}</span></div>
                          </div>
                          <button
                            onClick={() => openEditModal(pos)}
                            className={`p-1 rounded ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-amber-600' : 'hover:bg-neutral-800 text-neutral-400 hover:text-amber-400'}`}
                            title="Edit TP / SL"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Actions (Partial / Full Close) */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onClosePosition(pos.id, 50)}
                            className={`px-2 py-1 rounded text-[10px] font-sans transition-colors ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                            }`}
                            title="Take profit / close half (50%)"
                          >
                            50%
                          </button>
                          <button
                            onClick={() => onClosePosition(pos.id, 100)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold font-sans transition-colors ${
                              isLight
                                ? 'bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800'
                                : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300'
                            }`}
                          >
                            Market Close
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
        <div className="p-4 overflow-x-auto">
          {limitOrders.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No active limit orders waiting in the book.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b text-[11px] ${isLight ? 'text-slate-500 border-slate-200' : 'text-neutral-500 border-neutral-800'}`}>
                  <th className="pb-2 font-medium">Order Pair</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Target Price</th>
                  <th className="pb-2 font-medium">Current Market</th>
                  <th className="pb-2 font-medium">Units</th>
                  <th className="pb-2 font-medium">Collateral Locked</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-neutral-800/60'}`}>
                {limitOrders.map((order) => {
                  const asset = assets[order.assetSymbol];
                  const curPrice = asset ? asset.price : order.targetPrice;
                  const isBuy = order.side === 'BUY';

                  return (
                    <tr key={order.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-800/30'}>
                      <td className={`py-3 font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                        {order.assetSymbol}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                              : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {order.mode} {order.side} {order.leverage > 1 ? `(${order.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className="py-3 text-amber-600 font-semibold">
                        ${order.targetPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                        ${curPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                        {order.amount.toFixed(4)} {order.assetSymbol}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>${order.margin.toFixed(2)} USDT</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`} title="Trade Value = Target Price × Amount">
                          Val: ${(order.targetPrice * order.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onCancelLimitOrder(order.id)}
                          className={`px-2 py-1 rounded text-rose-600 text-[10px] font-sans border ${
                            isLight
                              ? 'bg-rose-50 hover:bg-rose-100 border-rose-200'
                              : 'bg-neutral-800 hover:bg-neutral-700 border-transparent'
                          }`}
                        >
                          Cancel Order
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
        <div className="p-4 overflow-x-auto">
          {spotHoldings.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Your spot wallet is empty. (Holdings in USDT cash only).</p>
              <p className={`mt-1 ${isLight ? 'text-slate-400' : 'text-neutral-600'}`}>
                Switch to the "Spot" tab in the order form to purchase real physical-backed Tether Gold or crypto!
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b text-[11px] ${isLight ? 'text-slate-500 border-slate-200' : 'text-neutral-500 border-neutral-800'}`}>
                  <th className="pb-2 font-medium">Asset</th>
                  <th className="pb-2 font-medium">Balance</th>
                  <th className="pb-2 font-medium">Average Cost</th>
                  <th className="pb-2 font-medium">Current Price</th>
                  <th className="pb-2 font-medium">Total Value</th>
                  <th className="pb-2 font-medium">Unrealized PnL</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-neutral-800/60'}`}>
                {spotHoldings.map((h) => {
                  const asset = assets[h.symbol];
                  const curPrice = asset ? asset.price : h.avgCostPrice;
                  const totalVal = h.amount * curPrice;
                  const totalCost = h.amount * h.avgCostPrice;
                  const pnl = totalVal - totalCost;
                  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={h.symbol} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-800/30'}>
                      <td className="py-3">
                        <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                          <span>{h.symbol}</span>
                          {asset?.category === 'gold' && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                              isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              Physical Gold
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                          {asset?.name}
                        </span>
                      </td>
                      <td className={`py-3 font-semibold ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                        {h.amount.toFixed(4)} {h.symbol}
                        {asset?.category === 'gold' && (
                          <span className="text-[10px] text-amber-600 block">
                            ≈ {h.amount.toFixed(3)} troy oz
                          </span>
                        )}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        ${h.avgCostPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                        ${curPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                        ${totalVal.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
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
        <div className="p-4 overflow-x-auto">
          {tradeHistory.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No historical trades recorded in this session.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b text-[11px] ${isLight ? 'text-slate-500 border-slate-200' : 'text-neutral-500 border-neutral-800'}`}>
                  <th className="pb-2 font-medium">Date & Time</th>
                  <th className="pb-2 font-medium">Contract / Pair</th>
                  <th className="pb-2 font-medium">Side / Mode</th>
                  <th className="pb-2 font-medium">Entry Price</th>
                  <th className="pb-2 font-medium">Exit Price</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Realized PnL</th>
                  <th className="pb-2 font-medium">Fees Paid</th>
                  <th className="pb-2 font-medium text-right">Trigger Reason</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-neutral-800/60'}`}>
                {tradeHistory.map((rec) => {
                  const isProfit = rec.realizedPnL >= 0;
                  const dateStr = new Date(rec.closeTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={rec.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-800/30'}>
                      <td className={`py-3 text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        {dateStr}
                      </td>
                      <td className={`py-3 font-bold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                        {rec.assetSymbol}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec.side === 'LONG' || rec.side === 'BUY'
                              ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                              : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {rec.side} {rec.leverage > 1 ? `(${rec.leverage}x)` : ''}
                        </span>
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        ${rec.entryPrice.toFixed(rec.entryPrice < 10 ? 4 : 2)}
                      </td>
                      <td className={`py-3 font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                        ${rec.exitPrice.toFixed(rec.exitPrice < 10 ? 4 : 2)}
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                        {rec.amount.toFixed(4)}
                      </td>
                      <td className="py-3">
                        <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}${rec.realizedPnL.toFixed(2)} ({isProfit ? '+' : ''}{rec.realizedPnLPercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className={`py-3 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        ${rec.fees.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                            rec.closeReason === 'LIQUIDATION'
                              ? isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              : rec.closeReason === 'TAKE_PROFIT'
                              ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : rec.closeReason === 'STOP_LOSS'
                              ? isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950 text-amber-400 border border-amber-800'
                              : isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
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
