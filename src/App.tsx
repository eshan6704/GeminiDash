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
import { BatchWriterModal } from './components/Modals/BatchWriterModal';
import { StorageManagerModal } from './components/Modals/StorageManagerModal';
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
    // B2 Cloud Storage synchronization
    cloudSyncStatus,
    lastCloudSync,
    syncSimulatorToCloud,
  } = useTradeSimulator();

  // Modal visibility states
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isStorageOpen, setIsStorageOpen] = useState<boolean>(false);

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
    <div className="min-h-screen flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white" style={{ backgroundColor: 'var(--theme-bg-page)', color: 'var(--theme-text-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenStorage={() => setIsStorageOpen(true)}
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
        <div className="p-1 rounded-md border bg-[var(--theme-bg-card)] border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-2 transition-colors">
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            {[
              { id: 'CRYPTO', label: 'AurumX Derivatives', icon: <Coins className="w-3.5 h-3.5" /> },
              { id: 'GLOBAL_INDICES', label: 'Global Indices', icon: <Globe className="w-3.5 h-3.5" /> },
              { id: 'FOREX', label: 'Forex Exchange', icon: <DollarSign className="w-3.5 h-3.5" /> },
              { id: 'COMMODITIES', label: 'Commodities', icon: <Box className="w-3.5 h-3.5" /> },
              { id: 'NIFTY_INDICES', label: 'Indian Indices', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'INDIAN_PORTFOLIO', label: 'Portfolio View', icon: <Briefcase className="w-3.5 h-3.5" /> },
              { id: 'INDIAN_WATCHLIST', label: 'Watchlist', icon: <Star className="w-3.5 h-3.5" /> },
              { id: 'STOCK_CONSTITUENTS', label: 'NIFTY 500 Stocks', icon: <Building className="w-3.5 h-3.5" /> },
              { id: 'OPTION_CHAIN', label: 'Index Options', icon: <Waves className="w-3.5 h-3.5" /> },
              { id: 'STOCK_OPTION_CHAIN', label: 'Stock Options', icon: <Briefcase className="w-3.5 h-3.5" /> },
              { id: 'MARKET_SCREENER', label: 'Screener Pro', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainMarketTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-sm text-[9px] font-bold flex items-center gap-2 transition-all uppercase tracking-widest border border-transparent ${
                  mainMarketTab === tab.id
                    ? 'bg-[var(--theme-border)] text-emerald-500 border-[var(--theme-border-subtle)]'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
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
                addNotification('success', 'B2 Cloud Sync', 'Simulator state successfully synced to Backblaze B2 persistent store.');
              }}
              onOpenFirestoreModal={() => setIsStorageOpen(true)}
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
            className="p-1.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-lg transition-colors"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAnalysisTab('OPTIONS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  analysisTab === 'OPTIONS'
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-md'
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
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-md'
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
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-md'
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
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-md'
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
                    ? 'bg-emerald-500 text-neutral-950 font-black shadow-md'
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
      <footer className="py-4 px-4 text-center text-[10px] font-mono border-t transition-colors" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
        <p className="uppercase tracking-widest opacity-60">
          AurumX Live Institutional Terminal • Real-time WebSocket execution • Institutional Durability
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

      <BatchWriterModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      <StorageManagerModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        simulatorData={{
          cashBalance,
          totalEquity,
          tradeHistory,
          positions,
          spotHoldings
        }}
      />

      {/* Notifications Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
