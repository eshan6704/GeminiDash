import React, { useState } from 'react';
import { useIndianStocks, IndianHolding, IndianStock } from '../../hooks/useIndianStocks';
import { useTheme } from '../../context/ThemeContext';
import { useSheetsSync } from '../../hooks/useSheetsSync';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  PieChart,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';

export const IndianStockPortfolioView: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { performSync, enableAutoSync } = useSheetsSync();
  const {
    stocks,
    holdings,
    cashBalance,
    transactions,
    isUpdating,
    lastUpdated,
    buyStock,
    sellStock,
    adjustCash,
    resetSimulator,
    getAnalysis,
    fetchLivePrices,
  } = useIndianStocks();

  // Selected stock for buying/selling
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQty, setTradeQty] = useState<number>(10);
  const [tradeError, setTradeError] = useState<string>('');
  const [tradeSuccess, setTradeSuccess] = useState<string>('');

  // Tab state within the portfolio view: 'HOLDINGS' | 'ANALYSIS' | 'TRANSACTIONS'
  const [subTab, setSubTab] = useState<'HOLDINGS' | 'ANALYSIS' | 'TRANSACTIONS'>('HOLDINGS');

  // Find selected stock details
  const currentStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];

  const totalInvested = holdings.reduce((acc, h) => acc + h.investedValue, 0);
  const currentMarketValue = holdings.reduce((acc, h) => {
    const stock = stocks.find((s) => s.symbol === h.symbol);
    const livePrice = stock ? stock.price : h.avgPrice;
    return acc + h.qty * livePrice;
  }, 0);

  const totalPnL = currentMarketValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const portfolioEquity = cashBalance + currentMarketValue;

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError('');
    setTradeSuccess('');

    if (tradeQty <= 0) {
      setTradeError('Quantity must be greater than 0');
      return;
    }

    const price = currentStock.price;
    if (tradeType === 'BUY') {
      const res = buyStock(selectedSymbol, tradeQty, price);
      if (res.success) {
        setTradeSuccess(`Successfully bought ${tradeQty} shares of ${selectedSymbol}!`);
        setTradeQty(10);
      } else {
        setTradeError(res.reason || 'Failed to buy');
      }
    } else {
      const res = sellStock(selectedSymbol, tradeQty, price);
      if (res.success) {
        setTradeSuccess(`Successfully sold ${tradeQty} shares of ${selectedSymbol}!`);
        setTradeQty(10);
      } else {
        setTradeError(res.reason || 'Failed to sell');
      }
    }

    // Auto clear success after 3 seconds
    setTimeout(() => {
      setTradeSuccess('');
    }, 4000);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* HEADER CARD WITH PORTFOLIO METRICS */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${colors.bgCard} ${colors.borderCard} shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20">
                INDIAN NSE
              </span>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                <span>Simulated INR Equity Portfolio</span>
              </h2>
            </div>
            <p className={`text-xs mt-1 ${colors.textMuted}`}>
              Simulate investments, analyze holdings, and receive active Buy/Sell/Hold targets using real-time Yahoo Finance data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLivePrices}
              disabled={isUpdating}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              } disabled:opacity-50`}
              title="Refresh quotes from Live Market Service"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Market</span>
            </button>

            <button
              onClick={() => adjustCash(50000)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add ₹50k</span>
            </button>

            <button
              onClick={enableAutoSync}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-blue-950/20 hover:bg-blue-900/40 text-blue-400 border-blue-500/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Enable 15m Auto-Sync</span>
            </button>

            <button
              onClick={performSync}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Manual Sync Now</span>
            </button>

            <button
              onClick={resetSimulator}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isLight
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  : 'bg-red-950/20 hover:bg-red-900/40 text-red-400 border-red-500/20'
              }`}
            >
              Reset Sandbox
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-neutral-950/50 border-neutral-800/60'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.textMuted}`}>Portfolio Net Worth</span>
            <div className="text-xl font-black mt-1 text-orange-500">
              ₹{portfolioEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Cash + Assets</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-neutral-950/50 border-neutral-800/60'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.textMuted}`}>Available Cash (INR)</span>
            <div className="text-xl font-black mt-1 text-emerald-500 flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              <span>₹{cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span className="text-[10px] text-slate-400">Trading capital</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-neutral-950/50 border-neutral-800/60'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.textMuted}`}>Invested Capital</span>
            <div className={`text-xl font-black mt-1 ${colors.textColor}`}>
              ₹{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Holding asset cost</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-neutral-950/50 border-neutral-800/60'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.textMuted}`}>Unrealized P&L</span>
            <div className={`text-xl font-black mt-1 flex items-center gap-1 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {totalPnL >= 0 ? '+' : ''}
                ₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`text-[10px] font-bold ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              ({totalPnL >= 0 ? '+' : ''}
              {totalPnLPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {lastUpdated && (
          <div className="flex justify-end mt-2 text-[9px] font-mono text-slate-400 italic">
            Quotes live updated at: {lastUpdated}
          </div>
        )}
      </div>

      {/* WORKSPACE SECTIONS: TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-neutral-800/40 pb-1">
        <button
          onClick={() => setSubTab('HOLDINGS')}
          className={`px-4 py-2 text-xs font-black tracking-wider transition-all border-b-2 uppercase ${
            subTab === 'HOLDINGS'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📁 Assets & Holdings
        </button>
        <button
          onClick={() => setSubTab('ANALYSIS')}
          className={`px-4 py-2 text-xs font-black tracking-wider transition-all border-b-2 uppercase flex items-center gap-1.5 ${
            subTab === 'ANALYSIS'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>🎯 Buy/Sell Target Analysis</span>
        </button>
        <button
          onClick={() => setSubTab('TRANSACTIONS')}
          className={`px-4 py-2 text-xs font-black tracking-wider transition-all border-b-2 uppercase ${
            subTab === 'TRANSACTIONS'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 Transaction Log ({transactions.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* MAIN VIEWS (LEFT AND MIDDLE COLUMNS) */}
        <div className="lg:col-span-2 space-y-4">
          {subTab === 'HOLDINGS' && (
            <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg`}>
              <h3 className="text-sm font-black mb-3 text-slate-300 uppercase tracking-wide">
                Current Asset Allocation
              </h3>

              {holdings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <PieChart className="w-8 h-8 mx-auto mb-2 opacity-30 text-orange-500" />
                  <p>Your portfolio is currently empty.</p>
                  <p className="mt-1">Use the trading terminal on the right to build your positions!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800/40 pb-2 text-[10px] uppercase text-slate-400">
                        <th className="py-2.5">Asset</th>
                        <th className="py-2.5 text-right">Shares</th>
                        <th className="py-2.5 text-right">Avg Cost</th>
                        <th className="py-2.5 text-right">Current Price</th>
                        <th className="py-2.5 text-right">Investment</th>
                        <th className="py-2.5 text-right">Current Value</th>
                        <th className="py-2.5 text-right">Gain / Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/30">
                      {holdings.map((h) => {
                        const stock = stocks.find((s) => s.symbol === h.symbol);
                        const livePrice = stock ? stock.price : h.avgPrice;
                        const currentValue = h.qty * livePrice;
                        const pnl = currentValue - h.investedValue;
                        const pnlPct = (pnl / h.investedValue) * 100;

                        return (
                          <tr key={h.symbol} className="hover:bg-neutral-800/10 transition-colors">
                            <td className="py-3 font-semibold">
                              <div>{h.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{h.symbol}</div>
                            </td>
                            <td className="py-3 text-right font-mono font-bold">{h.qty}</td>
                            <td className="py-3 text-right font-mono">₹{h.avgPrice.toFixed(2)}</td>
                            <td className="py-3 text-right font-mono font-black text-amber-500">
                              ₹{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-right font-mono">₹{h.investedValue.toLocaleString()}</td>
                            <td className="py-3 text-right font-mono font-bold">
                              ₹{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`py-3 text-right font-mono font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              <div>{pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                              <div className="text-[10px]">({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {subTab === 'ANALYSIS' && (
            <div className="space-y-4">
              {/* PORTFOLIO ADVISORY CARD */}
              <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg bg-gradient-to-br from-neutral-900 via-neutral-900 to-orange-950/10`}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    Institutional Advisory & Recommendations
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Below is an automated, quantitative analysis of the constituents currently held in your portfolio. Target recommendations are generated using live support/resistance channels, relative valuation multiples (P/E), and standard momentum oscillators.
                </p>

                {holdings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    Add Indian stock assets to your portfolio to view the real-time Buy/Sell/Hold analytical advisory.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holdings.map((h) => {
                      const stock = stocks.find((s) => s.symbol === h.symbol);
                      if (!stock) return null;
                      const analysis = getAnalysis(stock, h);

                      return (
                        <div
                          key={h.symbol}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isLight ? 'bg-white border-slate-200' : 'bg-neutral-950/80 border-neutral-800/80 hover:border-orange-500/30'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/30 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs">{stock.name} ({stock.symbol})</span>
                              <span className="text-[10px] text-slate-400 font-mono">PE: {stock.peRatio}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                analysis.rating === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : analysis.rating === 'SELL'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {analysis.rating}
                              </span>

                              <span className="text-[10px] font-mono text-slate-400">
                                Score: <b className="text-slate-200">{analysis.score}/100</b>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mb-2">
                            {analysis.reasoning}
                          </p>

                          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono pt-1">
                            <div className="p-1 rounded bg-neutral-900/40 text-slate-400">
                              Stop Loss: <span className="text-red-400 font-bold">₹{analysis.stopLoss}</span>
                            </div>
                            <div className="p-1 rounded bg-neutral-900/40 text-slate-400">
                              Target 1: <span className="text-emerald-400 font-bold">₹{analysis.target1}</span>
                            </div>
                            <div className="p-1 rounded bg-neutral-900/40 text-slate-400">
                              Target 2: <span className="text-teal-400 font-bold">₹{analysis.target2}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === 'TRANSACTIONS' && (
            <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg`}>
              <h3 className="text-sm font-black mb-3 text-slate-300 uppercase tracking-wide">
                Simulated Order Execution Book
              </h3>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No orders have been executed in this sandbox.
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[350px] space-y-2 pr-1 no-scrollbar">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-neutral-800/40 bg-neutral-950/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-8 rounded ${tx.type === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-bold">{tx.name} ({tx.symbol})</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-black ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type} {tx.qty} SHARES
                        </div>
                        <div className="text-[10px] text-slate-300 font-mono">
                          Price: ₹{tx.price.toFixed(2)} • Total: ₹{(tx.qty * tx.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUICK TRANSACTION PANEL */}
        <div className={`p-4 rounded-xl border ${colors.bgCard} ${colors.borderCard} shadow-lg space-y-4`}>
          <div className="flex items-center gap-2 border-b border-neutral-800/30 pb-2">
            <ArrowRightLeft className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-black uppercase text-slate-200 tracking-wide">
              INR Trade Execution Desk
            </h4>
          </div>

          <form onSubmit={handleExecuteTrade} className="space-y-3.5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Select Asset
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  setSelectedSymbol(e.target.value);
                  setTradeError('');
                  setTradeSuccess('');
                }}
                className={`w-full p-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                }`}
              >
                {stocks.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name} (₹{stock.price.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>

            {/* BUY / SELL RADIAL TABS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md ring-2 ring-emerald-400/30'
                    : 'bg-neutral-800/40 text-slate-300 hover:bg-neutral-800/60'
                }`}
              >
                🛒 Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  tradeType === 'SELL'
                    ? 'bg-red-500 text-neutral-950 shadow-md ring-2 ring-red-400/30'
                    : 'bg-neutral-800/40 text-slate-300 hover:bg-neutral-800/60'
                }`}
              >
                🔥 Sell
              </button>
            </div>

            {/* LIVE QUOTE INFO */}
            <div className="p-3 rounded-xl border border-neutral-800/40 bg-neutral-950/40 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Asset Price:</span>
                <span className="text-amber-400 font-extrabold">₹{currentStock.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>1D Change:</span>
                <span className={currentStock.change1d >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {currentStock.change1d >= 0 ? '+' : ''}{currentStock.change1d.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Your Balance:</span>
                <span className="text-slate-200">
                  ₹{cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Owned Qty:</span>
                <span className="text-slate-200 font-extrabold">
                  {holdings.find(h => h.symbol === selectedSymbol)?.qty || 0} shares
                </span>
              </div>
            </div>

            {/* QUANTITY */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Quantity (Shares)
                </label>
                <div className="flex gap-1">
                  {[5, 10, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTradeQty(q)}
                      className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-neutral-800 text-slate-300 hover:bg-neutral-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={tradeQty}
                onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 0))}
                className={`w-full p-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                }`}
              />
            </div>

            {/* ESTIMATED TOTAL */}
            <div className="flex justify-between items-center text-xs border-t border-neutral-800/30 pt-2 text-slate-400">
              <span>Estimated Cost:</span>
              <span className="font-mono text-slate-200 font-bold">
                ₹{(tradeQty * currentStock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* RESPONSE ALERT */}
            {tradeError && (
              <div className="p-2.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{tradeError}</span>
              </div>
            )}
            {tradeSuccess && (
              <div className="p-2.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{tradeSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                tradeType === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                  : 'bg-red-500 hover:bg-red-400 text-neutral-950'
              }`}
            >
              Confirm Simulated {tradeType}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
