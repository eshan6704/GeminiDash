/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTradeSimulator } from './hooks/useTradeSimulator';
import {
  Navbar,
  MainMarketTab,
  OptionsSubTab,
  EquityHubSubTab,
  MarketOverviewSubTab,
} from './components/Navbar';
import { CryptoHeaderBar } from './components/CryptoHeaderBar';
import { TickerBar } from './components/TickerBar';
import { OrderForm } from './components/OrderForm/OrderForm';
import { MiniMarketDepth } from './components/OrderForm/MiniMarketDepth';
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
import { CryptoMarketCapTable, CryptoCoinItem } from './components/MarketCap/CryptoMarketCapTable';
import { AdvancedCryptoScreenerView } from './components/MarketCap/AdvancedCryptoScreenerView';
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
import {
  SelectedCoinAllInfoPanel,
  CoinTickAndChartPanel,
  PnlForecastingMatrixPanel,
} from './components/CryptoSelectedCoinWorkspace';
import { TrackedAsset } from './services/allTrackedAssets';
import { MASTER_CRYPTO_250, fetchBinanceCryptoTableRows } from './services/marketDataTables';
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

type CryptoSectionATab =
  | 'CRYPTO_TABLE'
  | 'ADVANCED_CRYPTO_SCREENER'
  | 'MICRO_VOLATILITY'
  | 'WHALE_ORDERS'
  | 'CRYPTO_COMMON';

type CryptoSectionBTab =
  | 'COIN_INFO'
  | 'TICKS_AND_CHART'
  | 'ORDERBOOK'
  | 'BINANCE_RECENT_TRADES'
  | 'OPTION_CHAIN'
  | 'PAPER_PORTFOLIO_FORECAST'
  | 'AUTO_GRID_SIMULATION'
  | 'REMAINING_CRYPTO';

export default function App() {
  const [mainMarketTab, setMainMarketTab] = useState<MainMarketTab>('COIN');
  const [optionsSubTab, setOptionsSubTab] = useState<OptionsSubTab>('INDEX');
  const [equityHubSubTab, setEquityHubSubTab] = useState<EquityHubSubTab>('PORTFOLIO');
  const [marketOverviewSubTab, setMarketOverviewSubTab] = useState<MarketOverviewSubTab>('ALL');

  // Crypto (formerly Section A) & Coin (formerly Section B) single-selection dropdown states
  // Implemented as main tabs so strictly ONE is active at a time
  const [sectionATab, setSectionATab] = useState<CryptoSectionATab>('CRYPTO_TABLE');
  const [sectionBTab, setSectionBTab] = useState<CryptoSectionBTab>('COIN_INFO');
  const [isDropdownAOpen, setIsDropdownAOpen] = useState<boolean>(false);
  const [isDropdownBOpen, setIsDropdownBOpen] = useState<boolean>(false);
  const [isCoinPickerOpen, setIsCoinPickerOpen] = useState<boolean>(false);
  const dropdownARef = useRef<HTMLDivElement | null>(null);
  const dropdownBRef = useRef<HTMLDivElement | null>(null);
  const coinPickerRef = useRef<HTMLDivElement | null>(null);

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
      isTradeableInSim: ['PAXG', 'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ZEC', 'BNB'].includes(m.symbol),
    }))
  );

  // Stores metadata when user selects any coin from the 250-coin table or coin dropdown
  const [selectedCoinMeta, setSelectedCoinMeta] = useState<CryptoCoinItem | null>(null);
  const [searchedStockSymbol, setSearchedStockSymbol] = useState<string | null>(null);

  // Load live Binance USDT crypto table coins on startup so the Coin tab dropdown has all available coins
  useEffect(() => {
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
        isTradeableInSim: ['PAXG', 'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ZEC', 'BNB'].includes(m.symbol),
      }));
      setCryptoTableCoins(mapped);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownARef.current && !dropdownARef.current.contains(e.target as Node)) {
        setIsDropdownAOpen(false);
      }
      if (dropdownBRef.current && !dropdownBRef.current.contains(e.target as Node)) {
        setIsDropdownBOpen(false);
      }
      if (coinPickerRef.current && !coinPickerRef.current.contains(e.target as Node)) {
        setIsCoinPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    isLiveConnected,
    notifications,
    dismissNotification,
    // Balances
    cashBalance,
    totalEquity,
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

  // Compact dropdown options for Crypto tab
  const sectionAOptions: {
    id: CryptoSectionATab;
    num: string;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'CRYPTO_TABLE',
      num: '1',
      label: 'Top 250 Coins',
      subtitle: 'Market Cap Table',
      icon: <Coins className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'ADVANCED_CRYPTO_SCREENER',
      num: '2',
      label: 'Screener',
      subtitle: '250-Coin Filter',
      icon: <Sliders className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'MICRO_VOLATILITY',
      num: '3',
      label: 'Volatility',
      subtitle: 'ATR & Regimes',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'WHALE_ORDERS',
      num: '4',
      label: 'Whale Orders',
      subtitle: 'Block Trades > $10k',
      icon: <Waves className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'CRYPTO_COMMON',
      num: '5',
      label: 'Overview & Sync',
      subtitle: 'Ticker, PnL & Cloud',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
    },
  ];

  // Compact dropdown options for Coin tab
  const sectionBOptions: {
    id: CryptoSectionBTab;
    num: string;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'COIN_INFO',
      num: '1',
      label: 'Coin Info',
      subtitle: 'Metrics & Pivots',
      icon: <Info className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'TICKS_AND_CHART',
      num: '2',
      label: 'Ticks & Chart',
      subtitle: 'Rolling Ticks + Chart',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'ORDERBOOK',
      num: '3',
      label: 'Orderbook',
      subtitle: 'Market Depth',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'BINANCE_RECENT_TRADES',
      num: '4',
      label: 'Recent Trades',
      subtitle: 'Live Tape',
      icon: <Zap className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'OPTION_CHAIN',
      num: '5',
      label: 'Option Chain',
      subtitle: 'Calls, Puts & IV',
      icon: <Waves className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'PAPER_PORTFOLIO_FORECAST',
      num: '6',
      label: 'Paper Trade & PnL',
      subtitle: 'Simulator & Forecast',
      icon: <Briefcase className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'AUTO_GRID_SIMULATION',
      num: '7',
      label: 'Auto Grid',
      subtitle: 'Grid Bot & Logs',
      icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'REMAINING_CRYPTO',
      num: '8',
      label: 'Positions & Alerts',
      subtitle: 'Orders, Spot & Alerts',
      icon: <Sliders className="w-4 h-4 text-emerald-600" />,
    },
  ];

  const activeOptionA =
    sectionAOptions.find((o) => o.id === sectionATab) || sectionAOptions[0];
  const activeOptionB =
    sectionBOptions.find((o) => o.id === sectionBTab) || sectionBOptions[0];

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white"
      style={{ backgroundColor: 'var(--theme-bg-page)', color: 'var(--theme-text-primary)' }}
    >
      {/* Top Navigation with Master Page Dropdown */}
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
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenStorage={() => setIsStorageOpen(true)}
        onSelectAsset={handleGlobalAssetSelect}
      />

      {/* Volatility Alert Banner */}
      <VolatilityAlertBanner
        symbol={activeAsset.symbol}
        name={activeAsset.name}
        change24h={activeAsset.change24h}
        price={activeAsset.price}
        high24h={activeAsset.high24h}
        low24h={activeAsset.low24h}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 space-y-5">
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
            CRYPTO PAGE: TWO DROPDOWN-DRIVEN SECTIONS (SECTION A & SECTION B)
            Only ONE view is active in Section A (default: Crypto Table of 250 Coins)
            Only ONE view is active in Section B (default: Selected Coin All Info, BTC)
            ===================================================================== */}
        {/* =====================================================================
            MAIN TAB 4: CRYPTO (FORMERLY SECTION A — ONE ACTIVE AT A TIME)
            ===================================================================== */}
        {mainMarketTab === 'CRYPTO' && (
          <section className="space-y-3">
            <div className="px-3.5 py-2 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-mono font-bold">
                  CRYPTO
                </span>

                {/* Dropdown A Trigger (Compact) */}
                <div className="relative" ref={dropdownARef}>
                  <button
                    type="button"
                    title={activeOptionA.subtitle}
                    onClick={() => setIsDropdownAOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-2.5 min-w-[175px] px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {activeOptionA.icon}
                      <span className="truncate">
                        {activeOptionA.num}. {activeOptionA.label}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                        isDropdownAOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownAOpen && (
                    <div className="absolute left-0 mt-1.5 w-[220px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1 divide-y divide-[var(--theme-border-subtle)]">
                      {sectionAOptions.map((opt) => {
                        const isSelected = sectionATab === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSectionATab(opt.id);
                              setIsDropdownAOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600/10 text-[var(--theme-text-primary)] font-bold'
                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {opt.icon}
                              <span className="text-xs font-semibold truncate">
                                {opt.num}. {opt.label}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMainMarketTab('COIN')}
                  className="px-2.5 py-1 rounded-lg border border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/20 text-[11px] font-bold text-emerald-700 cursor-pointer transition-colors"
                >
                  Coin ({activeAsset.symbol}) →
                </button>
              </div>
            </div>

            {/* Crypto Content (Strictly ONE active view) */}
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

              {sectionATab === 'WHALE_ORDERS' && (
                <WhaleTradesFeed
                  selectedSymbol={activeAsset.symbol}
                  assets={assets}
                  mode="WHALE_ONLY"
                />
              )}

              {sectionATab === 'CRYPTO_COMMON' && (
                <div className="space-y-4">
                  <CryptoHeaderBar
                    cashBalance={cashBalance}
                    totalEquity={totalEquity}
                    isLiveConnected={isLiveConnected}
                    goldHedgeRatio={goldHedgeRatio}
                    cloudSyncStatus={cloudSyncStatus}
                    lastCloudSync={lastCloudSync}
                    onManualCloudSync={() => {
                      syncSimulatorToCloud(true);
                      addNotification(
                        'success',
                        'B2 Cloud Sync',
                        'Simulator state successfully synced to Backblaze B2 persistent store.'
                      );
                    }}
                    onOpenFirestoreModal={() => setIsStorageOpen(true)}
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
            MAIN TAB 5: COIN (FORMERLY SECTION B — ONE ACTIVE AT A TIME)
            ===================================================================== */}
        {mainMarketTab === 'COIN' && (
          <section className="space-y-3">
            <div className="px-3.5 py-2 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-mono font-bold">
                  COIN
                </span>

                {/* Dropdown List of Available Coins from Binance Crypto Table */}
                <div className="relative" ref={coinPickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsCoinPickerOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-2.5 min-w-[205px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
                    title="Select available coin from Binance Crypto Table"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-600 font-extrabold">{activeAsset.symbol}</span>
                      <span className="text-[var(--theme-text-secondary)] font-sans font-medium truncate max-w-[90px]">
                        {activeAsset.name}
                      </span>
                      <span className="text-[11px] text-[var(--theme-text-primary)]">
                        ${activeAsset.price < 1 ? activeAsset.price.toFixed(4) : activeAsset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                        isCoinPickerOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCoinPickerOpen && (
                    <div className="absolute left-0 mt-1.5 w-[295px] sm:w-[330px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1">
                      <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] border-b border-[var(--theme-border-subtle)]">
                        <span>BINANCE CRYPTO TABLE ({cryptoTableCoins.length} COINS)</span>
                        <span>USDT SPOT</span>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--theme-border-subtle)]">
                        {cryptoTableCoins.map((c) => {
                          const isSelected = activeAsset.symbol === c.symbol.toUpperCase();
                          const livePrice = assets[c.symbol.toUpperCase()]?.price || c.price;
                          const changePct = assets[c.symbol.toUpperCase()]?.change24h ?? c.change24h;
                          return (
                            <button
                              key={c.id || c.symbol}
                              type="button"
                              onClick={() => {
                                handleSelectCoinFromTable(c.symbol, {
                                  ...c,
                                  price: livePrice,
                                });
                                setIsCoinPickerOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600/15 text-[var(--theme-text-primary)] font-bold'
                                  : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 font-mono">
                                <span className="text-[10px] text-[var(--theme-text-muted)] w-6 shrink-0">
                                  #{c.rank}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 shrink-0">
                                  {c.symbol}
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-primary)] truncate font-sans">
                                  {c.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono">
                                <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                  ${livePrice < 1 ? livePrice.toFixed(4) : livePrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'
                                  }`}
                                >
                                  {changePct >= 0 ? '+' : ''}
                                  {Number(changePct).toFixed(2)}%
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dropdown B Trigger (Compact View Selector) */}
                <div className="relative" ref={dropdownBRef}>
                  <button
                    type="button"
                    title={activeOptionB.subtitle}
                    onClick={() => setIsDropdownBOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-2.5 min-w-[175px] px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {activeOptionB.icon}
                      <span className="truncate">
                        {activeOptionB.num}. {activeOptionB.label}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                        isDropdownBOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownBOpen && (
                    <div className="absolute left-0 mt-1.5 w-[225px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1 divide-y divide-[var(--theme-border-subtle)] max-h-[380px] overflow-y-auto">
                      {sectionBOptions.map((opt) => {
                        const isSelected = sectionBTab === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSectionBTab(opt.id);
                              setIsDropdownBOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600/10 text-[var(--theme-text-primary)] font-bold'
                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {opt.icon}
                              <span className="text-xs font-semibold truncate">
                                {opt.num}. {opt.label}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Quick Coin Buttons in Coin Tab Header */}
              <div className="flex items-center gap-1 flex-wrap font-mono">
                {['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'PAXG', 'ZEC', 'BNB', 'SUI'].map((sym) => {
                  const isCurrent = activeAsset.symbol === sym;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        const found = cryptoTableCoins.find((c) => c.symbol.toUpperCase() === sym);
                        if (found) {
                          handleSelectCoinFromTable(sym, {
                            ...found,
                            price: assets[sym]?.price || found.price,
                          });
                        } else {
                          setSelectedSymbol(sym);
                        }
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-elevated)]'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

              {/* Section B Content (Strictly ONE active view) */}
              <div>
                {/* B1: Selected Coin All Possible Info (Default) */}
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

                {/* B2: (a) Tick u12_5.7, d15_5.6 & (b) Current Chart */}
                {sectionBTab === 'TICKS_AND_CHART' && (
                  <CoinTickAndChartPanel asset={activeAsset} positions={positions} />
                )}

                {/* B3: Orderbook as current */}
                {sectionBTab === 'ORDERBOOK' && (
                  <MiniMarketDepth asset={activeAsset} compact={false} />
                )}

                {/* B4: Binance Real Recent Trades */}
                {sectionBTab === 'BINANCE_RECENT_TRADES' && (
                  <WhaleTradesFeed
                    selectedSymbol={activeAsset.symbol}
                    assets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                    mode="RECENT_ONLY"
                  />
                )}

                {/* B5: Option Chain if available for selected symbol */}
                {sectionBTab === 'OPTION_CHAIN' && (
                  <DeribitOptionsChain
                    selectedSymbol={activeAsset.symbol}
                    selectedCoinPrice={activeAsset.price}
                    currentBtcPrice={assets.BTC?.price || 96500}
                    currentEthPrice={assets.ETH?.price || 3450}
                    currentSolPrice={assets.SOL?.price || 210}
                    currentPaxgPrice={assets.PAXG?.price || 2750}
                  />
                )}

                {/* B6: Paper Trading, Portfolio Simulator & PnL Forecasting (-20% to +2%) */}
                {sectionBTab === 'PAPER_PORTFOLIO_FORECAST' && (
                  <div className="space-y-4">
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
                    />

                    <PnlForecastingMatrixPanel
                      asset={activeAsset}
                      totalEquity={totalEquity}
                      cashBalance={cashBalance}
                      positions={positions}
                      spotHoldings={spotHoldings}
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
                      onPlaceOrder={placeOrder}
                    />
                  </div>
                )}

                {/* B7: Grid-Based Auto Simulation (Shark Terminal) and its History */}
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
                    />
                  </div>
                )}

                {/* B8: Rest / Remaining under current Crypto Page */}
                {sectionBTab === 'REMAINING_CRYPTO' && (
                  <div className="space-y-4">
                    <CryptoHeaderBar
                      cashBalance={cashBalance}
                      totalEquity={totalEquity}
                      isLiveConnected={isLiveConnected}
                      goldHedgeRatio={goldHedgeRatio}
                      cloudSyncStatus={cloudSyncStatus}
                      lastCloudSync={lastCloudSync}
                      onManualCloudSync={() => {
                        syncSimulatorToCloud(true);
                        addNotification(
                          'success',
                          'B2 Cloud Sync',
                          'Simulator state successfully synced to Backblaze B2 persistent store.'
                        );
                      }}
                      onOpenFirestoreModal={() => setIsStorageOpen(true)}
                      onOpenWhatIf={() => setIsWhatIfOpen(true)}
                      onOpenAiReview={() => setIsAiReviewOpen(true)}
                      onOpenSettings={() => setIsSettingsOpen(true)}
                      onReset={() => resetSimulation()}
                      onAddFunds={() => adjustCashBalance(5000)}
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
                    />

                    <OrderForm
                      asset={activeAsset}
                      cashBalance={cashBalance}
                      config={config}
                      spotBalanceAmount={currentSpotAmount}
                      allAssets={{ ...assets, [activeAsset.symbol]: activeAsset }}
                      positions={positions}
                      initialTab="ALERTS"
                      hideTabSwitcher={true}
                      onOpenWhatIf={() => setIsWhatIfOpen(true)}
                      onClosePosition={closePosition}
                      onUpdateSLTP={updatePositionSLTP}
                      onNotify={addNotification}
                      onPlaceOrder={placeOrder}
                    />
                  </div>
                )}
              </div>
            </section>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-4 px-4 text-center text-[10px] font-mono border-t transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        <p className="uppercase tracking-widest opacity-60">
          AurumX Live Institutional Terminal • Real-time WebSocket execution • Institutional Durability
        </p>
      </footer>

      {/* Modals */}
      <WhatIfScenarioModal
        isOpen={isWhatIfOpen}
        assets={assets}
        positions={positions}
        selectedSymbol={activeAsset.symbol}
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
          spotHoldings,
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
