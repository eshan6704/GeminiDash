/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTradeSimulator } from './hooks/useTradeSimulator';
import { useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { CryptoHeaderBar } from './components/CryptoHeaderBar';
import { TickerBar } from './components/TickerBar';
import { TradingChart } from './components/Chart/TradingChart';
import { OrderForm } from './components/OrderForm/OrderForm';
import { PositionsTable } from './components/Positions/PositionsTable';
import { PortfolioOverview } from './components/Portfolio/PortfolioOverview';
import { WhatIfScenarioModal } from './components/Modals/WhatIfScenarioModal';
import { AiRiskModal } from './components/Modals/AiRiskModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { NotificationToast } from './components/Notifications/NotificationToast';
import { DailyPnLChart } from './components/Portfolio/DailyPnLChart';
import { WhaleTradesFeed } from './components/Trades/WhaleTradesFeed';
import { DeribitOptionsChain } from './components/DeribitOptions/DeribitOptionsChain';
import { CryptoMarketCapTable } from './components/MarketCap/CryptoMarketCapTable';
import { MarketAnalyticsDashboard } from './components/Analytics/MarketAnalyticsDashboard';
import { GlobalIndicesView } from './components/Markets/GlobalIndicesView';
import { ForexMarketView } from './components/Markets/ForexMarketView';
import { CommoditiesMarketView } from './components/Markets/CommoditiesMarketView';
import { NiftyIndicesView } from './components/Markets/NiftyIndicesView';
import { StockConstituentsView } from './components/Markets/StockConstituentsView';
import { ShieldCheck, Flame, Info, ExternalLink, BarChart3, Zap, Coins, Activity, Waves, Globe, DollarSign, Building2, Building, Box } from 'lucide-react';

export default function App() {
  const { isLight } = useTheme();
  const [mainMarketTab, setMainMarketTab] = useState<'CRYPTO' | 'GLOBAL_INDICES' | 'FOREX' | 'COMMODITIES' | 'NIFTY_INDICES' | 'STOCK_CONSTITUENTS'>('CRYPTO');
  const [show30DayBacktest, setShow30DayBacktest] = useState<boolean>(false);
  const [analysisTab, setAnalysisTab] = useState<'OPTIONS' | 'MARKETCAP' | 'ANALYTICS' | 'WHALES' | 'BACKTEST'>('OPTIONS');

  const {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    isLiveConnected,
    notifications,
    dismissNotification,
    refreshPrices,
    // Balances
    cashBalance,
    totalEquity,
    totalSpotValue,
    totalMarginLocked,
    totalUnrealizedPnL,
    totalRealizedPnL,
    totalFeesPaid,
    winRate,
    totalTrades,
    goldHedgeRatio,
    // Data
    positions,
    limitOrders,
    tradeHistory,
    spotHoldings,
    config,
    setConfig,
    // Actions
    placeOrder,
    closePosition,
    cancelLimitOrder,
    updatePositionSLTP,
    resetSimulation,
    adjustCashBalance,
    addNotification,
  } = useTradeSimulator();

  // Modal visibility states
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const activeAsset = assets[selectedSymbol] || assets.PAXG;
  const currentSpotHolding = spotHoldings.find((h) => h.symbol === selectedSymbol);
  const currentSpotAmount = currentSpotHolding ? currentSpotHolding.amount : 0;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors selection:bg-amber-500 selection:text-neutral-950 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Top Navigation */}
      <Navbar />

      {/* Main Trading Terminal Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5 space-y-4">
        {/* PRIMARY MULTI-ASSET MARKET CATEGORY SELECTION BAR */}
        <div
          className={`p-2 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-xl transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setMainMarketTab('CRYPTO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'CRYPTO'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-md ring-2 ring-amber-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>🪙 Crypto & Gold Derivatives</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('GLOBAL_INDICES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'GLOBAL_INDICES'
                  ? 'bg-blue-500 text-white font-black shadow-md ring-2 ring-blue-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌐 Global Indices & Futures</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('FOREX')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'FOREX'
                  ? 'bg-emerald-500 text-neutral-950 font-black shadow-md ring-2 ring-emerald-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>💱 Forex Exchange</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('COMMODITIES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'COMMODITIES'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-md ring-2 ring-amber-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>🛢️ Commodities & Energy</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('NIFTY_INDICES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'NIFTY_INDICES'
                  ? 'bg-orange-500 text-neutral-950 font-black shadow-md ring-2 ring-orange-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🇮🇳 Nifty & Indian Indices</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('STOCK_CONSTITUENTS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'STOCK_CONSTITUENTS'
                  ? 'bg-orange-500 text-neutral-950 font-black shadow-md ring-2 ring-orange-400/50'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>📊 Nifty 50 & Global Stock Constituents</span>
            </button>
          </div>
        </div>

        {/* MARKET CONTENT CONDITIONAL RENDERING */}
        {mainMarketTab === 'GLOBAL_INDICES' && <GlobalIndicesView />}
        {mainMarketTab === 'FOREX' && <ForexMarketView />}
        {mainMarketTab === 'COMMODITIES' && <CommoditiesMarketView />}
        {mainMarketTab === 'NIFTY_INDICES' && <NiftyIndicesView />}
        {mainMarketTab === 'STOCK_CONSTITUENTS' && <StockConstituentsView />}

        {mainMarketTab === 'CRYPTO' && (
          <>
            {/* AurumX Crypto & Gold Derivatives Simulator Header */}
            <CryptoHeaderBar
              cashBalance={cashBalance}
              totalEquity={totalEquity}
              isLiveConnected={isLiveConnected}
              goldHedgeRatio={goldHedgeRatio}
              onOpenWhatIf={() => setIsWhatIfOpen(true)}
              onOpenAiReview={() => setIsAiReviewOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onReset={() => resetSimulation()}
              onAddFunds={() => adjustCashBalance(5000)}
            />

            {/* Crypto & Gold Ticker Ribbon */}
            <TickerBar
              assets={assets}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />

            {/* Portfolio Summary & Risk Exposure Bar */}
            <PortfolioOverview
              totalEquity={totalEquity}
              cashBalance={cashBalance}
              marginLocked={totalMarginLocked}
              unrealizedPnL={totalUnrealizedPnL}
              realizedPnL={totalRealizedPnL}
              totalFeesPaid={totalFeesPaid}
              winRate={winRate}
              totalTrades={totalTrades}
              goldHedgeRatio={goldHedgeRatio}
              spotHoldings={spotHoldings}
              positions={positions}
              assets={assets}
              tradeHistory={tradeHistory}
              brokerName="Shark Exchange"
            />

        {/* Full Width Trading Stack: Chart + Order Terminal */}
        <div className="flex flex-col space-y-4">
          {/* Chart Section */}
          <div className="w-full flex flex-col space-y-3">
            <TradingChart
              asset={activeAsset}
              activePositions={positions}
            />

            {/* Real-world Mechanism Banner */}
            <div
              className={`rounded-xl p-3 flex items-start gap-3 text-xs border transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 shadow-sm'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <strong className={`block mb-0.5 ${isLight ? 'text-amber-800 font-bold' : 'text-amber-300 font-bold'}`}>
                  Live Real-Time Feeds (Binance & Bitfinex WebSockets):
                </strong>
                Direct real-time order matching feeds for Physical Gold (PAXG) and Crypto Majors. Toggle between 1s, 1m, 5m, 15m, 1h, 4h, and 1D timeframes on the professional Chart above.
              </div>
            </div>
          </div>

          {/* Order Placement Terminal (Shark Exchange Full Width) */}
          <div className="w-full">
            <OrderForm
              asset={activeAsset}
              cashBalance={cashBalance}
              config={config}
              spotBalanceAmount={currentSpotAmount}
              allAssets={assets}
              positions={positions}
              onOpenWhatIf={() => setIsWhatIfOpen(true)}
              onClosePosition={closePosition}
              onUpdateSLTP={updatePositionSLTP}
              onNotify={addNotification}
              onPlaceOrder={placeOrder}
            />
          </div>
        </div>

        {/* INSTITUTIONAL ANALYSIS & MARKET INTELLIGENCE HUB */}
        <div className="space-y-4 pt-2">
          {/* Workstation Navigation Bar */}
          <div
            className={`p-1.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-lg transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAnalysisTab('OPTIONS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'OPTIONS'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Deribit Options Chain</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisTab('MARKETCAP')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'MARKETCAP'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Top 250 Crypto Market Cap</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisTab('ANALYTICS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'ANALYTICS'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Macro & Volatility Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisTab('WHALES')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'WHALES'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Waves className="w-4 h-4" />
                <span>Whale & Recent Trades</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisTab('BACKTEST')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'BACKTEST'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>30D PnL Backtest</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-neutral-400 px-3 hidden lg:block">
              Institutional Market Workstation
            </div>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="animate-fadeIn">
            {analysisTab === 'OPTIONS' && (
              <DeribitOptionsChain
                currentBtcPrice={assets.BTC?.price || 96500}
                currentEthPrice={assets.ETH?.price || 3450}
                currentSolPrice={assets.SOL?.price || 210}
                currentPaxgPrice={assets.PAXG?.price || 2750}
              />
            )}

            {analysisTab === 'MARKETCAP' && (
              <CryptoMarketCapTable
                onSelectCoinToTrade={(symbol) => {
                  if (assets[symbol]) {
                    setSelectedSymbol(symbol);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
            )}

            {analysisTab === 'ANALYTICS' && (
              <MarketAnalyticsDashboard
                currentBtcPrice={assets.BTC?.price || 96500}
                currentPaxgPrice={assets.PAXG?.price || 2750}
              />
            )}

            {analysisTab === 'WHALES' && (
              <WhaleTradesFeed
                selectedSymbol={selectedSymbol}
                assets={assets}
              />
            )}

            {analysisTab === 'BACKTEST' && (
              <DailyPnLChart tradeHistory={tradeHistory} brokerName="Shark Exchange" />
            )}
          </div>
        </div>

        {/* Positions, Limit Orders, Spot Wallet & History Table */}
        <PositionsTable
          positions={positions}
          limitOrders={limitOrders}
          tradeHistory={tradeHistory}
          spotHoldings={spotHoldings}
          assets={assets}
          onClosePosition={closePosition}
          onCancelLimitOrder={cancelLimitOrder}
          onUpdateSLTP={updatePositionSLTP}
          onSelectSymbol={setSelectedSymbol}
        />
      </>
    )}
  </main>

      {/* Footer */}
      <footer
        className={`py-4 px-4 text-center text-xs font-mono border-t transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-neutral-950 border-neutral-900 text-neutral-500'
        }`}
      >
        <p>
          AurumX Live Terminal • Real-time feeds via Binance & Bitfinex WebSockets • Sub-second Execution & Slippage Modeling
        </p>
      </footer>

      {/* Modals */}
      <WhatIfScenarioModal
        isOpen={isWhatIfOpen}
        assets={assets}
        positions={positions}
        selectedSymbol={selectedSymbol}
        onClose={() => setIsWhatIfOpen(false)}
      />

      <AiRiskModal
        isOpen={isAiReviewOpen}
        equity={totalEquity}
        cash={cashBalance}
        unrealizedPnL={totalUnrealizedPnL}
        positions={positions}
        spotHoldings={spotHoldings}
        assets={assets}
        onClose={() => setIsAiReviewOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        config={config}
        onSaveConfig={setConfig}
        onReset={resetSimulation}
        onAddFunds={(amount) => adjustCashBalance(amount)}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Notifications Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
