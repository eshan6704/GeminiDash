/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { useTradeSimulator } from './hooks/useTradeSimulator';
import {
  Navbar,
  MainMarketTab,
  OptionsSubTab,
  EquityHubSubTab,
  MarketOverviewSubTab,
  CryptoSubTab,
  CoinSubTab,
} from './components/Navbar';
import { CryptoHeaderBar } from './components/CryptoHeaderBar';
import { TickerBar } from './components/TickerBar';
import { OrderForm } from './components/OrderForm/OrderForm';
import { MiniMarketDepth } from './components/OrderForm/MiniMarketDepth';
import { PositionsTable } from './components/Positions/PositionsTable';
import { PortfolioOverview } from './components/Portfolio/PortfolioOverview';
import { NotificationToast } from './components/Notifications/NotificationToast';
import type { CryptoCoinItem } from './components/MarketCap/CryptoMarketCapTable';

const WhatIfScenarioModal = lazy(() =>
  import('./components/Modals/WhatIfScenarioModal').then((m) => ({ default: m.WhatIfScenarioModal }))
);
const AiRiskModal = lazy(() =>
  import('./components/Modals/AiRiskModal').then((m) => ({ default: m.AiRiskModal }))
);
const SettingsModal = lazy(() =>
  import('./components/Modals/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const DailyPnLChart = lazy(() =>
  import('./components/Portfolio/DailyPnLChart').then((m) => ({ default: m.DailyPnLChart }))
);
const WhaleTradesFeed = lazy(() =>
  import('./components/Trades/WhaleTradesFeed').then((m) => ({ default: m.WhaleTradesFeed }))
);
const DeribitOptionsChain = lazy(() =>
  import('./components/DeribitOptions/DeribitOptionsChain').then((m) => ({ default: m.DeribitOptionsChain }))
);
const CryptoMarketCapTable = lazy(() =>
  import('./components/MarketCap/CryptoMarketCapTable').then((m) => ({ default: m.CryptoMarketCapTable }))
);
const AdvancedCryptoScreenerView = lazy(() =>
  import('./components/MarketCap/AdvancedCryptoScreenerView').then((m) => ({ default: m.AdvancedCryptoScreenerView }))
);
const MarketAnalyticsDashboard = lazy(() =>
  import('./components/Analytics/MarketAnalyticsDashboard').then((m) => ({ default: m.MarketAnalyticsDashboard }))
);
const GlobalIndicesView = lazy(() =>
  import('./components/Markets/GlobalIndicesView').then((m) => ({ default: m.GlobalIndicesView }))
);
const ForexMarketView = lazy(() =>
  import('./components/Markets/ForexMarketView').then((m) => ({ default: m.ForexMarketView }))
);
const CommoditiesMarketView = lazy(() =>
  import('./components/Markets/CommoditiesMarketView').then((m) => ({ default: m.CommoditiesMarketView }))
);
const NiftyIndicesView = lazy(() =>
  import('./components/Markets/NiftyIndicesView').then((m) => ({ default: m.NiftyIndicesView }))
);
const StockConstituentsView = lazy(() =>
  import('./components/Markets/StockConstituentsView').then((m) => ({ default: m.StockConstituentsView }))
);
const IndianStockPortfolioView = lazy(() =>
  import('./components/Markets/IndianStockPortfolioView').then((m) => ({ default: m.IndianStockPortfolioView }))
);
const IndianStockWatchlistView = lazy(() =>
  import('./components/Markets/IndianStockWatchlistView').then((m) => ({ default: m.IndianStockWatchlistView }))
);
const OptionChainView = lazy(() =>
  import('./components/Markets/OptionChainView').then((m) => ({ default: m.OptionChainView }))
);
const StockOptionChainView = lazy(() =>
  import('./components/Markets/StockOptionChainView').then((m) => ({ default: m.StockOptionChainView }))
);
const AdvancedMarketScreenerView = lazy(() =>
  import('./components/Markets/AdvancedMarketScreenerView').then((m) => ({ default: m.AdvancedMarketScreenerView }))
);
import {
  SelectedCoinAllInfoPanel,
  CoinTickAnalysisPanel,
  CoinChartPanel,
  CoinTickBackgroundCollector,
  PnlForecastingMatrixPanel,
} from './components/CryptoSelectedCoinWorkspace';
import { TrackedAsset } from './services/allTrackedAssets';
import {
  MASTER_CRYPTO_250,
  PREFERENCE_COIN_SYMBOLS,
  fetchBinanceCryptoTableRows,
} from './services/marketDataTables';
import { MarketAsset } from './types/trading';
import {
  BarChart3,
  Zap,
  Coins,
  Activity,
  Waves,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
  Sliders,
  Briefcase,
  Info,
  Search,
} from 'lucide-react';

type CryptoSectionATab = CryptoSubTab;
type CryptoSectionBTab = CoinSubTab;

export default function App() {
  const [mainMarketTab, setMainMarketTab] = useState<MainMarketTab>('COIN');
  const [optionsSubTab, setOptionsSubTab] = useState<OptionsSubTab>('INDEX');
  const [equityHubSubTab, setEquityHubSubTab] = useState<EquityHubSubTab>('PORTFOLIO');
  const [marketOverviewSubTab, setMarketOverviewSubTab] = useState<MarketOverviewSubTab>('ALL');

  // Crypto (formerly Section A) & Coin (formerly Section B) sub-tab states
  const [sectionATab, setSectionATab] = useState<CryptoSectionATab>('CRYPTO_TABLE');
  const [sectionBTab, setSectionBTab] = useState<CryptoSectionBTab>('COIN_INFO');
  const [isCoinPickerOpen, setIsCoinPickerOpen] = useState<boolean>(false);

  // Available coins synced directly from the Binance Crypto Table
  const [cryptoTableCoins, setCryptoTableCoins] = useState<CryptoCoinItem[]>(() =>
    MASTER_CRYPTO_250.map((m, idx) => ({
      rank: m.rank || idx + 1,
      id: m.id,
      name: m.name,
      symbol: m.symbol,
      price: m.price,
      change1h: Number((m.change1d * 0.2).toFixed(2)),
      change24h: m.change1d,
      change7d: Number((m.change1d * 2.2).toFixed(2)),
      marketCap: Number(m.marketCap || 1000000000),
      volume24h: Number(m.volume24h || 50000000),
      circulatingSupply: 100000000,
      category: (m.category as any) || 'Layer 1',
      isTradeableInSim: ['BTC', 'XAUT', 'PAXG', 'ZEC', 'SOL', 'CL', 'XAG', 'ETH', 'XRP', 'DOGE', 'BNB'].includes(m.symbol),
    }))
  );

  // Stores metadata when user selects any coin from the 250-coin table or coin dropdown
  const [selectedCoinMeta, setSelectedCoinMeta] = useState<CryptoCoinItem | null>(null);
  const [searchedStockSymbol, setSearchedStockSymbol] = useState<string | null>(null);

  // Only fetch 250-coin table from Binance when the user opens the Coin dropdown or the CRYPTO tab
  useEffect(() => {
    if (!isCoinPickerOpen && mainMarketTab !== 'CRYPTO') return;
    let mounted = true;
    fetchBinanceCryptoTableRows().then((rows) => {
      if (!mounted || !Array.isArray(rows) || rows.length === 0) return;
      const mapped: CryptoCoinItem[] = rows.map((m, idx) => ({
        rank: m.rank || idx + 1,
        id: m.id,
        name: m.name,
        symbol: m.symbol,
        price: m.price,
        change1h: Number((m.change1d * 0.2).toFixed(2)),
        change24h: m.change1d,
        change7d: Number((m.change1d * 2.2).toFixed(2)),
        marketCap: Number(m.marketCap || 1000000000),
        volume24h: Number(m.volume24h || 50000000),
        circulatingSupply: 100000000,
        category: (m.category as any) || 'Layer 1',
        isTradeableInSim: ['BTC', 'XAUT', 'PAXG', 'ZEC', 'SOL', 'CL', 'XAG', 'ETH', 'XRP', 'DOGE', 'BNB'].includes(m.symbol),
      }));
      setCryptoTableCoins(mapped);
    });
    return () => {
      mounted = false;
    };
  }, [isCoinPickerOpen, mainMarketTab]);

  const {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    isLiveConnected,
    notifications,
    dismissNotification,
    // Balances (Separate Manual Trade, PnL Forecasting, and Grid Auto Simulation — $1,000 default each)
    cashBalance,
    totalEquity,
    totalMarginLocked,
    totalUnrealizedPnL,
    totalRealizedPnL,
    totalFeesPaid,
    winRate,
    totalTrades,
    goldHedgeRatio,
    forecastBalance,
    updateForecastBalance,
    gridCashBalance,
    gridMarginLocked,
    gridUnrealizedPnL,
    gridTotalEquity,
    updateGridBalance,
    resetGridSimulation,
    updateManualBalance,
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
    resetTradeHistory,
    resetSimulation,
    adjustCashBalance,
    addNotification,
  } = useTradeSimulator(mainMarketTab === 'COIN' || mainMarketTab === 'CRYPTO');

  // Modal visibility states
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Resolve active selected coin (defaults to BTC if no coin is selected)
  const activeAsset: MarketAsset = useMemo(() => {
    const sym = (selectedSymbol || 'BTC').toUpperCase();
    if (assets && assets[sym]) {
      return assets[sym];
    }
    if (selectedCoinMeta && selectedCoinMeta.symbol && selectedCoinMeta.symbol.toUpperCase() === sym) {
      const p = selectedCoinMeta.price || 100;
      return {
        id: selectedCoinMeta.id || sym.toLowerCase(),
        symbol: sym,
        name: selectedCoinMeta.name || sym,
        pair: `${sym}/USDT`,
        price: p,
        change24h: selectedCoinMeta.change24h || 0,
        high24h: p * 1.032,
        low24h: p * 0.968,
        volume24h: selectedCoinMeta.volume24h || p * 25000,
        category: selectedCoinMeta.category === 'Gold & RWA' ? 'gold' : 'crypto',
        description: `${selectedCoinMeta.name || sym} (${sym}) Digital Asset`,
        color: '#059669',
        lastUpdated: Date.now(),
        dataTimestamp: Date.now(),
      };
    }
    return (assets && assets.BTC) || (assets && Object.values(assets).find(a => a && a.symbol)) || {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      pair: 'BTC/USDT',
      price: 96500,
      change24h: 1.25,
      high24h: 98000,
      low24h: 95000,
      volume24h: 42000000000,
      category: 'crypto',
      description: 'Bitcoin',
      lastUpdated: Date.now(),
      dataTimestamp: Date.now(),
    } as MarketAsset;
  }, [assets, selectedSymbol, selectedCoinMeta]);

  const currentSpotHolding = spotHoldings.find((h) => h && activeAsset && h.symbol === activeAsset.symbol);
  const currentSpotAmount = currentSpotHolding ? currentSpotHolding.amount : 0;

  // Handler when a coin is selected from the 250-coin Market Table in Crypto tab -> switches to Coin tab
  const handleSelectCoinFromTable = (symbol: string, coin?: CryptoCoinItem) => {
    const upper = symbol.toUpperCase();
    if (coin) {
      setSelectedCoinMeta(coin);
    }
    setSelectedSymbol(upper);
    setMainMarketTab('COIN');
    addNotification(
      'info',
      'Coin Selected in Coin Tab',
      `Loaded ${coin?.name || upper} (${upper}/USDT) into Coin workspace.`
    );
  };

  // Global search asset selector handler
  const handleGlobalAssetSelect = (asset: TrackedAsset) => {
    if (asset.category === 'OPTION_CHAIN') {
      setMainMarketTab('OPTIONS_HUB');
      setOptionsSubTab(
        asset.symbol === 'NIFTY' || asset.symbol === 'BANKNIFTY' || asset.symbol === 'FINNIFTY'
          ? 'INDEX'
          : 'STOCK'
      );
      addNotification('info', 'Option Chain Loaded', `Opened ${asset.name} real-time F&O matrix.`);
      return;
    }
    if (asset.isTerminalAsset || asset.category === 'CRYPTO' || assets[asset.symbol as any]) {
      const resolvedPrice = assets[asset.symbol]?.price || 100;
      setSelectedCoinMeta({
        rank: 1,
        id: asset.symbol.toLowerCase(),
        name: asset.name,
        symbol: asset.symbol.toUpperCase(),
        price: resolvedPrice,
        change1h: 0.2,
        change24h: assets[asset.symbol]?.change24h || 1.25,
        change7d: 3.4,
        marketCap: resolvedPrice * 15000000,
        volume24h: resolvedPrice * 850000,
        circulatingSupply: 15000000,
        category: 'Layer 1',
        isTradeableInSim: true,
      });
      setSelectedSymbol(asset.symbol.toUpperCase());
      setMainMarketTab('COIN');
      addNotification(
        'info',
        'Coin Selected via Search',
        `Loaded ${asset.name} (${asset.symbol}) into Coin Workspace.`
      );
      return;
    }
    if (asset.category === 'INDIAN_STOCK') {
      setSearchedStockSymbol(asset.symbol);
      setMainMarketTab('STOCK_CONSTITUENTS');
      addNotification('info', 'Stocks Research', `Loaded ${asset.name} (${asset.symbol}) into 9-Tab Deep Research Station.`);
      return;
    }
    if (asset.category === 'INDIAN_INDEX') {
      setMainMarketTab('MARKET_OVERVIEW');
      setMarketOverviewSubTab('INDIAN_INDICES');
      addNotification('info', 'Indian Indices', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'GLOBAL_INDEX') {
      setMainMarketTab('MARKET_OVERVIEW');
      setMarketOverviewSubTab('GLOBAL_INDICES');
      addNotification('info', 'Market Overview · Global Indices', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'FOREX') {
      setMainMarketTab('MARKET_OVERVIEW');
      setMarketOverviewSubTab('FOREX');
      addNotification('info', 'Market Overview · Forex Exchange', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'COMMODITY') {
      setMainMarketTab('MARKET_OVERVIEW');
      setMarketOverviewSubTab('COMMODITIES');
      addNotification('info', 'Market Overview · Commodities', `Viewing ${asset.name} (${asset.symbol}).`);
      return;
    }
    if (asset.category === 'US_STOCK') {
      setSearchedStockSymbol(asset.symbol);
      setMainMarketTab('STOCK_CONSTITUENTS');
      addNotification('info', 'Stocks Research', `Loaded ${asset.name} (${asset.symbol}) into 9-Tab Deep Research Station.`);
      return;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white"
      style={{ backgroundColor: 'var(--theme-bg-page)', color: 'var(--theme-text-primary)' }}
    >
      {/* Top Navigation with Master Page & Sub-Tab Switchers */}
      <Navbar
        mainMarketTab={mainMarketTab}
        onSelectMarketTab={(tab) => {
          if (tab === 'STOCK_CONSTITUENTS') {
            setSearchedStockSymbol(null);
          }
          setMainMarketTab(tab);
        }}
        optionsSubTab={optionsSubTab}
        onSelectOptionsSubTab={setOptionsSubTab}
        equityHubSubTab={equityHubSubTab}
        onSelectEquityHubSubTab={setEquityHubSubTab}
        marketOverviewSubTab={marketOverviewSubTab}
        onSelectMarketOverviewSubTab={setMarketOverviewSubTab}
        cryptoSubTab={sectionATab}
        onSelectCryptoSubTab={setSectionATab}
        coinSubTab={sectionBTab}
        onSelectCoinSubTab={setSectionBTab}
        activeCoinAsset={activeAsset}
        cryptoTableCoins={cryptoTableCoins}
        liveAssets={assets}
        onSelectCoinFromPicker={handleSelectCoinFromTable}
        onCoinPickerToggle={setIsCoinPickerOpen}
        onSelectAsset={handleGlobalAssetSelect}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 space-y-5">
        <Suspense
          fallback={
            <div className="p-6 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-xs font-mono text-[var(--theme-text-muted)]">
              Loading market workspace...
            </div>
          }
        >
        {/* NON-CRYPTO MARKET DESKS */}
        {mainMarketTab === 'MARKET_OVERVIEW' && (
          <div className="space-y-6">
            {(marketOverviewSubTab === 'INDIAN_INDICES' || marketOverviewSubTab === 'ALL') && (
              <NiftyIndicesView />
            )}
            {(marketOverviewSubTab === 'GLOBAL_INDICES' || marketOverviewSubTab === 'ALL') && (
              <GlobalIndicesView />
            )}
            {(marketOverviewSubTab === 'FOREX' || marketOverviewSubTab === 'ALL') && (
              <ForexMarketView />
            )}
            {(marketOverviewSubTab === 'COMMODITIES' || marketOverviewSubTab === 'ALL') && (
              <CommoditiesMarketView />
            )}
          </div>
        )}
        {mainMarketTab === 'NIFTY_INDICES' && <NiftyIndicesView />}
        {mainMarketTab === 'STOCK_CONSTITUENTS' && (
          <StockConstituentsView externalSymbol={searchedStockSymbol} />
        )}

        {mainMarketTab === 'OPTIONS_HUB' && (
          <div className="space-y-6">
            {(optionsSubTab === 'INDEX' || optionsSubTab === 'BOTH') && <OptionChainView />}
            {(optionsSubTab === 'STOCK' || optionsSubTab === 'BOTH') && <StockOptionChainView />}
          </div>
        )}

        {mainMarketTab === 'EQUITY_HUB' && (
          <div className="space-y-6">
            {(equityHubSubTab === 'PORTFOLIO' || equityHubSubTab === 'ALL') && <IndianStockPortfolioView />}
            {(equityHubSubTab === 'WATCHLIST' || equityHubSubTab === 'ALL') && <IndianStockWatchlistView />}
            {(equityHubSubTab === 'SCREENER' || equityHubSubTab === 'ALL') && (
              <AdvancedMarketScreenerView onSelectAsset={handleGlobalAssetSelect} />
            )}
          </div>
        )}

        {/* =====================================================================
            MAIN TAB 4: CRYPTO (Sub-tabs in Top Bar)
            ===================================================================== */}
        {mainMarketTab === 'CRYPTO' && (
          <section className="space-y-3">
            <div>
              {sectionATab === 'CRYPTO_TABLE' && (
                <CryptoMarketCapTable
                  selectedSymbol={activeAsset.symbol}
                  onSelectCoinToTrade={handleSelectCoinFromTable}
                  onCoinsLoaded={setCryptoTableCoins}
                />
              )}

              {sectionATab === 'ADVANCED_CRYPTO_SCREENER' && (
                <AdvancedCryptoScreenerView
                  selectedSymbol={activeAsset.symbol}
                  liveAssets={assets}
                  onSelectCoinToTrade={handleSelectCoinFromTable}
                />
              )}

              {sectionATab === 'MICRO_VOLATILITY' && (
                <MarketAnalyticsDashboard
                  currentBtcPrice={assets.BTC?.price || 96500}
                  currentPaxgPrice={assets.PAXG?.price || 2750}
                />
              )}

              {sectionATab === 'CRYPTO_COMMON' && (
                <div className="space-y-4">
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
                  <TickerBar
                    assets={assets}
                    selectedSymbol={activeAsset.symbol}
                    onSelectSymbol={setSelectedSymbol}
                  />
                  <DailyPnLChart tradeHistory={tradeHistory} brokerName="Shark Exchange" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================================
            MAIN TAB 5: COIN (Sub-tabs & Coin Selector in Top Bar)
            ===================================================================== */}
        {mainMarketTab === 'COIN' && (
          <section className="space-y-3">
            <div>
              {/* B1: Coin Info (Multi-Source Deep Info) */}
              {sectionBTab === 'COIN_INFO' && (
                <SelectedCoinAllInfoPanel
                  asset={activeAsset}
                  allAssets={assets}
                  positions={positions}
                  spotHoldings={spotHoldings}
                  extraCoinMeta={
                    selectedCoinMeta && selectedCoinMeta.symbol.toUpperCase() === activeAsset.symbol
                      ? {
                          rank: selectedCoinMeta.rank,
                          marketCap: selectedCoinMeta.marketCap,
                          change1h: selectedCoinMeta.change1h,
                          change7d: selectedCoinMeta.change7d,
                          circulatingSupply: selectedCoinMeta.circulatingSupply,
                          categoryLabel: selectedCoinMeta.category,
                        }
                      : undefined
                  }
                  onSelectSymbol={setSelectedSymbol}
                />
              )}

              {/* B2: Orderbook, Recent Trades, Whale Orders (below recent trades), and Option Chain merged */}
              {sectionBTab === 'ORDERBOOK' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                    <div className="xl:col-span-5">
                      <MiniMarketDepth asset={activeAsset} compact={false} />
                    </div>
                    <div className="xl:col-span-7">
                      <WhaleTradesFeed
                        selectedSymbol={activeAsset.symbol}
                        assets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                        mode="ALL"
                      />
                    </div>
                  </div>
                  <DeribitOptionsChain
                    selectedSymbol={activeAsset.symbol}
                    selectedCoinPrice={activeAsset.price}
                    currentBtcPrice={assets.BTC?.price || 96500}
                    currentEthPrice={assets.ETH?.price || 3450}
                    currentSolPrice={assets.SOL?.price || 210}
                    currentPaxgPrice={assets.PAXG?.price || 2750}
                  />
                </div>
              )}

              {/* B3: Chart + Tick Analysis (just after chart) + PnL & Trade merged */}
              {sectionBTab === 'PAPER_PORTFOLIO_FORECAST' && (
                <div className="space-y-4">
                  <CoinChartPanel asset={activeAsset} positions={positions} />

                  <CoinTickAnalysisPanel asset={activeAsset} />

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
                    assets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    tradeHistory={tradeHistory}
                    brokerName="Shark Exchange"
                    onResetTradeHistory={resetTradeHistory}
                    onResetSimulation={() => resetSimulation()}
                    onUpdateManualBalance={updateManualBalance}
                  />

                  <OrderForm
                    asset={activeAsset}
                    cashBalance={cashBalance}
                    config={config}
                    spotBalanceAmount={currentSpotAmount}
                    allAssets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    positions={positions}
                    initialTab="TRADE"
                    hideTabSwitcher={true}
                    onOpenWhatIf={() => setIsWhatIfOpen(true)}
                    onClosePosition={closePosition}
                    onUpdateSLTP={updatePositionSLTP}
                    onNotify={addNotification}
                    onUpdateManualBalance={updateManualBalance}
                    gridCashBalance={gridCashBalance}
                    gridMarginLocked={gridMarginLocked}
                    gridUnrealizedPnL={gridUnrealizedPnL}
                    gridTotalEquity={gridTotalEquity}
                    onUpdateGridBalance={updateGridBalance}
                    onResetGridSimulation={resetGridSimulation}
                    onPlaceOrder={placeOrder}
                  />

                  <PositionsTable
                    positions={positions}
                    limitOrders={limitOrders}
                    tradeHistory={tradeHistory}
                    spotHoldings={spotHoldings}
                    assets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    onClosePosition={closePosition}
                    onCancelLimitOrder={cancelLimitOrder}
                    onUpdateSLTP={updatePositionSLTP}
                    onSelectSymbol={setSelectedSymbol}
                    onResetTradeHistory={resetTradeHistory}
                  />

                  {/* PnL Forecasting placed at the END to simulate PnL forecasting of live running trades */}
                  <PnlForecastingMatrixPanel
                    asset={activeAsset}
                    totalEquity={totalEquity}
                    cashBalance={cashBalance}
                    forecastBalance={forecastBalance}
                    onUpdateForecastBalance={updateForecastBalance}
                    positions={positions}
                    spotHoldings={spotHoldings}
                    totalTrades={totalTrades}
                    realizedPnL={totalRealizedPnL}
                    onResetTradeHistory={resetTradeHistory}
                    onResetSimulation={() => resetSimulation()}
                    onPlaceLiveOrder={placeOrder}
                  />
                </div>
              )}

              {/* B8: Grid-Based Auto Simulation (Shark Terminal) and its History */}
              {sectionBTab === 'AUTO_GRID_SIMULATION' && (
                <div className="space-y-4">
                  <OrderForm
                    asset={activeAsset}
                    cashBalance={cashBalance}
                    config={config}
                    spotBalanceAmount={currentSpotAmount}
                    allAssets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    positions={positions}
                    initialTab="AUTOGRID"
                    hideTabSwitcher={true}
                    onOpenWhatIf={() => setIsWhatIfOpen(true)}
                    onClosePosition={closePosition}
                    onUpdateSLTP={updatePositionSLTP}
                    onNotify={addNotification}
                    onUpdateManualBalance={updateManualBalance}
                    gridCashBalance={gridCashBalance}
                    gridMarginLocked={gridMarginLocked}
                    gridUnrealizedPnL={gridUnrealizedPnL}
                    gridTotalEquity={gridTotalEquity}
                    onUpdateGridBalance={updateGridBalance}
                    onResetGridSimulation={resetGridSimulation}
                    onPlaceOrder={placeOrder}
                  />

                  <PositionsTable
                    positions={positions}
                    limitOrders={limitOrders}
                    tradeHistory={tradeHistory}
                    spotHoldings={spotHoldings}
                    assets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    onClosePosition={closePosition}
                    onCancelLimitOrder={cancelLimitOrder}
                    onUpdateSLTP={updatePositionSLTP}
                    onSelectSymbol={setSelectedSymbol}
                    onResetTradeHistory={resetTradeHistory}
                  />
                </div>
              )}
            </div>
          </section>
        )}
        </Suspense>
      </main>

      {/* Modals (Only mounted when opened) */}
      <Suspense fallback={null}>
        {isWhatIfOpen && (
          <WhatIfScenarioModal
            isOpen={isWhatIfOpen}
            assets={assets}
            positions={positions}
            selectedSymbol={activeAsset.symbol}
            onClose={() => setIsWhatIfOpen(false)}
          />
        )}

        {isAiReviewOpen && (
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
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            config={config}
            onSaveConfig={setConfig}
            onReset={resetSimulation}
            onAddFunds={(amount) => adjustCashBalance(amount)}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </Suspense>

      {/* Notifications Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
