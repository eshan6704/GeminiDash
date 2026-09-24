/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTradeSimulator } from './hooks/useTradeSimulator';
import { useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
// Top Navigation
// Real-time News Ticker removed per user instruction to eliminate Live Feed and maximize visible workspace
import { AccountPulseWidget } from './components/AccountPulseWidget';
import { CryptoHeaderBar } from './components/CryptoHeaderBar';
import { TickerBar } from './components/TickerBar';
import { TradingChart } from './components/Chart/TradingChart';
import { OrderForm } from './components/OrderForm/OrderForm';
import { PositionsTable } from './components/Positions/PositionsTable';
import { PortfolioOverview } from './components/Portfolio/PortfolioOverview';
import { WhatIfScenarioModal } from './components/Modals/WhatIfScenarioModal';
import { AiRiskModal } from './components/Modals/AiRiskModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { FirestoreDataModal } from './components/Modals/FirestoreDataModal';
import { BatchWriterModal } from './components/Modals/BatchWriterModal';
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
import { IndianStockPortfolioView } from './components/Markets/IndianStockPortfolioView';
import { IndianStockWatchlistView } from './components/Markets/IndianStockWatchlistView';
import { OptionChainView } from './components/Markets/OptionChainView';
import { StockOptionChainView } from './components/Markets/StockOptionChainView';
import { AdvancedMarketScreenerView } from './components/Markets/AdvancedMarketScreenerView';
import { VolatilityAlertBanner } from './components/Notifications/VolatilityAlertBanner';
import { TrackedAsset } from './services/allTrackedAssets';
import { ShieldCheck, Flame, Info, ExternalLink, BarChart3, Zap, Coins, Activity, Waves, Globe, DollarSign, Building2, Building, Box, Briefcase, Star, SlidersHorizontal } from 'lucide-react';

export default function App() {
  const { isLight } = useTheme();
  const [mainMarketTab, setMainMarketTab] = useState<'CRYPTO' | 'GLOBAL_INDICES' | 'FOREX' | 'COMMODITIES' | 'NIFTY_INDICES' | 'STOCK_CONSTITUENTS' | 'INDIAN_PORTFOLIO' | 'INDIAN_WATCHLIST' | 'OPTION_CHAIN' | 'STOCK_OPTION_CHAIN' | 'MARKET_SCREENER'>('CRYPTO');
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
    // Firestore cloud synchronization
    cloudSyncStatus,
    lastCloudSync,
    syncSimulatorToCloud,
  } = useTradeSimulator();

  // Modal visibility states
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFirestoreOpen, setIsFirestoreOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  const activeAsset = assets[selectedSymbol] || assets.PAXG;
  const currentSpotHolding = spotHoldings.find((h) => h.symbol === selectedSymbol);
  const currentSpotAmount = currentSpotHolding ? currentSpotHolding.amount : 0;

  // Global search asset selector handler
  const handleGlobalAssetSelect = (asset: TrackedAsset) => {
    if (asset.category === 'OPTION_CHAIN') {
      setMainMarketTab('OPTION_CHAIN');
      addNotification('info', 'Option Chain Loaded', `Opened ${asset.name} real-time F&O matrix.`);
      return;
    }
    if (asset.isTerminalAsset || assets[asset.symbol as any]) {
      setSelectedSymbol(asset.symbol as any);
      setMainMarketTab('CRYPTO');
      addNotification('info', 'Asset Selected in Terminal', `Loaded ${asset.name} (${asset.symbol}) into Trading Terminal.`);
      return;
    }
    if (asset.category === 'INDIAN_STOCK') {
      setMainMarketTab('STOCK_CONSTITUENTS');
      addNotification('info', 'Stock Constituents', `Navigated to ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'INDIAN_INDEX') {
      setMainMarketTab('NIFTY_INDICES');
      addNotification('info', 'Nifty & Indian Indices', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'GLOBAL_INDEX') {
      setMainMarketTab('GLOBAL_INDICES');
      addNotification('info', 'Global Indices', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'FOREX') {
      setMainMarketTab('FOREX');
      addNotification('info', 'Forex Exchange', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'COMMODITY') {
      setMainMarketTab('COMMODITIES');
      addNotification('info', 'Commodities & Energy', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'US_STOCK') {
      setMainMarketTab('STOCK_CONSTITUENTS');
      addNotification('info', 'Global Tech MegaCaps', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white" style={{ backgroundColor: 'var(--theme-bg-page)', color: 'var(--theme-text-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        onOpenFirestoreModal={() => setIsFirestoreOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onSelectAsset={handleGlobalAssetSelect}
      />

      {/* Volatility Alert Banner (Triggers on 24h price fluctuation threshold) */}
      <VolatilityAlertBanner
        symbol={selectedSymbol}
        name={activeAsset.name}
        change24h={activeAsset.change24h}
        price={activeAsset.price}
        high24h={activeAsset.high24h}
        low24h={activeAsset.low24h}
      />

      {/* Main Trading Terminal Container - Optimized for maximum visible trading screen area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 space-y-3">
        {/* Compact Account Pulse & Performance Status */}
        <AccountPulseWidget
          totalPnL={totalRealizedPnL + totalUnrealizedPnL}
          winRate={winRate}
          totalTrades={totalTrades}
        />
        
        {/* PRIMARY MULTI-ASSET MARKET CATEGORY SELECTION BAR */}
        <div className="p-2 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setMainMarketTab('CRYPTO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'CRYPTO'
                  ? 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'CRYPTO' ? 'var(--theme-accent)' : 'transparent',
                color: mainMarketTab === 'CRYPTO' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Coins className="w-4 h-4" />
              <span>🪙 Crypto & Gold Derivatives</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('GLOBAL_INDICES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'GLOBAL_INDICES'
                  ? 'text-white font-black shadow-md ring-2 ring-blue-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'GLOBAL_INDICES' ? 'var(--theme-accent)' : 'transparent',
                color: mainMarketTab === 'GLOBAL_INDICES' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Globe className="w-4 h-4" />
              <span>🌐 Global Indices & Futures</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('FOREX')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'FOREX'
                  ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'FOREX' ? '#059669' : 'transparent',
                color: mainMarketTab === 'FOREX' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <DollarSign className="w-4 h-4" />
              <span>💱 Forex Exchange</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('COMMODITIES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'COMMODITIES'
                  ? 'bg-amber-600 text-white font-black shadow-md ring-2 ring-amber-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'COMMODITIES' ? '#d97706' : 'transparent',
                color: mainMarketTab === 'COMMODITIES' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Flame className="w-4 h-4" />
              <span>🛢️ Commodities & Energy</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('NIFTY_INDICES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'NIFTY_INDICES'
                  ? 'bg-orange-600 text-white font-black shadow-md ring-2 ring-orange-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'NIFTY_INDICES' ? '#ea580c' : 'transparent',
                color: mainMarketTab === 'NIFTY_INDICES' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Building2 className="w-4 h-4" />
              <span>🇮🇳 Nifty & Indian Indices</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('INDIAN_PORTFOLIO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'INDIAN_PORTFOLIO'
                  ? 'bg-orange-600 text-white font-black shadow-md ring-2 ring-orange-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'INDIAN_PORTFOLIO' ? '#ea580c' : 'transparent',
                color: mainMarketTab === 'INDIAN_PORTFOLIO' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Briefcase className="w-4 h-4 text-white" />
              <span>💼 Indian Stock Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('INDIAN_WATCHLIST')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'INDIAN_WATCHLIST'
                  ? 'bg-orange-600 text-white font-black shadow-md ring-2 ring-orange-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'INDIAN_WATCHLIST' ? '#ea580c' : 'transparent',
                color: mainMarketTab === 'INDIAN_WATCHLIST' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>🏷️ Indian Stock Watchlist</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('STOCK_CONSTITUENTS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'STOCK_CONSTITUENTS'
                  ? 'bg-orange-600 text-white font-black shadow-md ring-2 ring-orange-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'STOCK_CONSTITUENTS' ? '#ea580c' : 'transparent',
                color: mainMarketTab === 'STOCK_CONSTITUENTS' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Building className="w-4 h-4" />
              <span>📊 Nifty Total & Global Stock Constituents</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('OPTION_CHAIN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'OPTION_CHAIN'
                  ? 'bg-purple-600 text-white font-black shadow-md ring-2 ring-purple-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'OPTION_CHAIN' ? '#7c3aed' : 'transparent',
                color: mainMarketTab === 'OPTION_CHAIN' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Nifty 50 & Bank Nifty Option Chain</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('STOCK_OPTION_CHAIN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'STOCK_OPTION_CHAIN'
                  ? 'bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'STOCK_OPTION_CHAIN' ? '#e11d48' : 'transparent',
                color: mainMarketTab === 'STOCK_OPTION_CHAIN' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <Briefcase className="w-4 h-4 text-amber-300" />
              <span>📈 Stock F&O Option Chain</span>
            </button>

            <button
              type="button"
              onClick={() => setMainMarketTab('MARKET_SCREENER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                mainMarketTab === 'MARKET_SCREENER'
                  ? 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400/50'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: mainMarketTab === 'MARKET_SCREENER' ? '#2563eb' : 'transparent',
                color: mainMarketTab === 'MARKET_SCREENER' ? '#ffffff' : 'var(--theme-text-primary)'
              }}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
              <span>📊 Advanced Market Screener</span>
            </button>
          </div>
        </div>

        {/* MARKET CONTENT CONDITIONAL RENDERING */}
        {mainMarketTab === 'GLOBAL_INDICES' && <GlobalIndicesView />}
        {mainMarketTab === 'FOREX' && <ForexMarketView />}
        {mainMarketTab === 'COMMODITIES' && <CommoditiesMarketView />}
        {mainMarketTab === 'NIFTY_INDICES' && <NiftyIndicesView />}
        {mainMarketTab === 'STOCK_CONSTITUENTS' && <StockConstituentsView />}
        {mainMarketTab === 'INDIAN_PORTFOLIO' && <IndianStockPortfolioView />}
        {mainMarketTab === 'INDIAN_WATCHLIST' && <IndianStockWatchlistView />}
        {mainMarketTab === 'OPTION_CHAIN' && <OptionChainView />}
        {mainMarketTab === 'STOCK_OPTION_CHAIN' && <StockOptionChainView />}
        {mainMarketTab === 'MARKET_SCREENER' && <AdvancedMarketScreenerView onSelectAsset={handleGlobalAssetSelect} />}

        {mainMarketTab === 'CRYPTO' && (
          <>
            {/* AurumX Crypto & Gold Derivatives Simulator Header */}
            <CryptoHeaderBar
              cashBalance={cashBalance}
              totalEquity={totalEquity}
              isLiveConnected={isLiveConnected}
              goldHedgeRatio={goldHedgeRatio}
              cloudSyncStatus={cloudSyncStatus}
              lastCloudSync={lastCloudSync}
              onManualCloudSync={() => {
                syncSimulatorToCloud(true);
                addNotification('success', 'Firestore Cloud Sync', 'Simulator state successfully synced to Firestore persistent store.');
              }}
              onOpenFirestoreModal={() => setIsFirestoreOpen(true)}
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
        <div className="flex flex-col space-y-3">
          {/* Chart Section */}
          <div className="w-full flex flex-col space-y-2">
            <TradingChart
              asset={activeAsset}
              activePositions={positions}
            />
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
      <footer className="py-4 px-4 text-center text-xs font-mono border-t bg-white border-slate-200 text-slate-500 transition-colors">
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

      <FirestoreDataModal
        isOpen={isFirestoreOpen}
        onClose={() => setIsFirestoreOpen(false)}
        cashBalance={cashBalance}
        totalEquity={totalEquity}
        positions={positions}
        limitOrders={limitOrders}
        tradeHistory={tradeHistory}
        spotHoldings={spotHoldings}
        lastCloudSync={lastCloudSync}
        onManualSync={() => syncSimulatorToCloud(true)}
      />

      <BatchWriterModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      {/* Notifications Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
