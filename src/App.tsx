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
  const [mainMarketTab, setMainMarketTab] = useState<MainMarketTab>('CRYPTO');
  const [optionsSubTab, setOptionsSubTab] = useState<OptionsSubTab>('INDEX');
  const [equityHubSubTab, setEquityHubSubTab] = useState<EquityHubSubTab>('PORTFOLIO');
  const [marketOverviewSubTab, setMarketOverviewSubTab] = useState<MarketOverviewSubTab>('ALL');

  // Section A & Section B single-selection dropdown states under Crypto Page
  // Only ONE default is selected on each section:
  // A- default is CRYPTO_TABLE (1- crypto table of 250 coin)
  // B- default is COIN_INFO (1- selected coin all possible info, using BTC by default)
  const [sectionATab, setSectionATab] = useState<CryptoSectionATab>('CRYPTO_TABLE');
  const [sectionBTab, setSectionBTab] = useState<CryptoSectionBTab>('COIN_INFO');
  const [isDropdownAOpen, setIsDropdownAOpen] = useState<boolean>(false);
  const [isDropdownBOpen, setIsDropdownBOpen] = useState<boolean>(false);
  const dropdownARef = useRef<HTMLDivElement | null>(null);
  const dropdownBRef = useRef<HTMLDivElement | null>(null);

  // Stores metadata when user selects any coin from the 250-coin table or search bar
  const [selectedCoinMeta, setSelectedCoinMeta] = useState<CryptoCoinItem | null>(null);
  const [searchedStockSymbol, setSearchedStockSymbol] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownARef.current && !dropdownARef.current.contains(e.target as Node)) {
        setIsDropdownAOpen(false);
      }
      if (dropdownBRef.current && !dropdownBRef.current.contains(e.target as Node)) {
        setIsDropdownBOpen(false);
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

  // Handler when a coin is selected from the 250-coin Market Table
  const handleSelectCoinFromTable = (symbol: string, coin?: CryptoCoinItem) => {
    const upper = symbol.toUpperCase();
    if (coin) {
      setSelectedCoinMeta(coin);
    }
    setSelectedSymbol(upper);
    addNotification(
      'info',
      'Coin Selected in Section B',
      `Loaded ${coin?.name || upper} (${upper}/USDT) into Section B workspace.`
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
      setMainMarketTab('CRYPTO');
      addNotification(
        'info',
        'Coin Selected via Search',
        `Loaded ${asset.name} (${asset.symbol}) into Section B Coin Workspace.`
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

  // Dropdown options for Section A (Crypto Common)
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
      label: 'Crypto Table of 250 Coins',
      subtitle: 'Default · Click any coin to load in Section B',
      icon: <Coins className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'ADVANCED_CRYPTO_SCREENER',
      num: '2',
      label: 'Advanced Crypto Screener',
      subtitle: 'Real-Time 250-Coin Filter by Market Cap, 24h Change & Volume',
      icon: <Sliders className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'MICRO_VOLATILITY',
      num: '3',
      label: 'Micro Volatility Matrix',
      subtitle: 'ATR / IV Regimes, Cross-Asset Beta & Heatmaps',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'WHALE_ORDERS',
      num: '4',
      label: 'Whale Orders',
      subtitle: 'Institutional Block Executions (> $10k USDT)',
      icon: <Waves className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'CRYPTO_COMMON',
      num: '5',
      label: 'Other Crypto Common (Ticker, 30D Backtest & Cloud Sync)',
      subtitle: 'Multi-Asset Ribbon, 30D Equity Curve & B2 Sync',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
    },
  ];

  // Dropdown options for Section B (Selected Coin Workspace)
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
      label: `Selected Coin (${activeAsset.symbol}) — All Possible Info`,
      subtitle: 'Default · Valuation, Supply, Derivatives & Pivot Levels',
      icon: <Info className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'TICKS_AND_CHART',
      num: '2',
      label: `(a) Tick Pattern u12_6.7, d15_5.6 (u1d1/Flat Filter) & (b) Current Chart (${activeAsset.symbol})`,
      subtitle: 'Consecutive Tick Runs, 500-Tick Bullish/Bearish/Flat/Flip Score + Chart',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'ORDERBOOK',
      num: '3',
      label: `Orderbook (${activeAsset.symbol}/USDT)`,
      subtitle: 'Live Grouped Market Depth, Spread & Bid/Ask Wall',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'BINANCE_RECENT_TRADES',
      num: '4',
      label: `Binance Real Recent Trades (${activeAsset.symbol}/USDT)`,
      subtitle: 'Live WebSocket Trade Execution Stream & Quantities',
      icon: <Zap className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'OPTION_CHAIN',
      num: '5',
      label: `Option Chain for Selected Symbol (${activeAsset.symbol})`,
      subtitle: 'Deribit Real-Time Calls/Puts, Implied Volatility & Greeks',
      icon: <Waves className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'PAPER_PORTFOLIO_FORECAST',
      num: '6',
      label: 'Paper Trading, Portfolio Simulator & PnL Forecasting (-20% to +2%)',
      subtitle: 'Direct Order Execution, Equity Overview & Stress Matrix',
      icon: <Briefcase className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'AUTO_GRID_SIMULATION',
      num: '7',
      label: 'Grid-Based Auto Simulation (Shark Terminal) & History',
      subtitle: 'Automated Multi-Tier Grid Bot, Ladder & Execution Logs',
      icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'REMAINING_CRYPTO',
      num: '8',
      label: 'Remaining Crypto Tools (Positions, Limit Orders, Spot & Alerts)',
      subtitle: 'Active Margin Positions, Spot Wallet, Price Alerts & Settings',
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
        {mainMarketTab === 'CRYPTO' && (
          <div className="space-y-6">
            {/* -----------------------------------------------------------------
                SECTION A: CRYPTO MARKET & COMMON INTELLIGENCE (DROPDOWN)
                ----------------------------------------------------------------- */}
            <section className="space-y-3">
              <div className="px-3.5 py-2.5 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-mono font-bold">
                    SECTION A
                  </span>
                  <span className="text-xs font-bold text-[var(--theme-text-secondary)]">
                    Crypto Market View:
                  </span>

                  {/* Dropdown A Trigger */}
                  <div className="relative" ref={dropdownARef}>
                    <button
                      type="button"
                      title={activeOptionA.subtitle}
                      onClick={() => setIsDropdownAOpen((prev) => !prev)}
                      className="inline-flex items-center justify-between gap-3 min-w-[260px] sm:min-w-[340px] px-3.5 py-2 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {activeOptionA.icon}
                        <span className="truncate">
                          {activeOptionA.num}. {activeOptionA.label}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                          isDropdownAOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isDropdownAOpen && (
                      <div className="absolute left-0 mt-1.5 w-[320px] sm:w-[400px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1.5 divide-y divide-[var(--theme-border-subtle)]">
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
                              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600/10 text-[var(--theme-text-primary)] font-bold'
                                  : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {opt.icon}
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate">
                                    {opt.num}. {opt.label}
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--theme-text-muted)] truncate">
                                    {opt.subtitle}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Non-intrusive Hover Tooltip for Section A Selected View */}
                  <div
                    className="relative group inline-flex items-center"
                    title={activeOptionA.subtitle}
                  >
                    <span className="p-1.5 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] hover:text-emerald-600 transition-colors cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                    <div className="pointer-events-none absolute left-0 top-full mt-1.5 w-64 sm:w-72 p-2.5 rounded-lg border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      <div className="text-[11px] font-bold text-[var(--theme-text-primary)]">
                        {activeOptionA.num}. {activeOptionA.label}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">
                        {activeOptionA.subtitle}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[var(--theme-text-muted)] hidden md:flex items-center gap-2">
                  <span>{activeOptionA.subtitle}</span>
                </div>
              </div>

              {/* Section A Content (Strictly ONE active view) */}
              <div>
                {sectionATab === 'CRYPTO_TABLE' && (
                  <CryptoMarketCapTable
                    selectedSymbol={activeAsset.symbol}
                    onSelectCoinToTrade={handleSelectCoinFromTable}
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

            {/* -----------------------------------------------------------------
                SECTION B: SELECTED COIN WORKSPACE (DROPDOWN, DEFAULT COIN = BTC)
                ----------------------------------------------------------------- */}
            <section className="space-y-3">
              <div className="px-3.5 py-2.5 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-mono font-bold">
                    SECTION B
                  </span>
                  <span className="text-xs font-bold text-[var(--theme-text-secondary)]">
                    Selected Coin ({activeAsset.symbol}/USDT):
                  </span>

                  {/* Dropdown B Trigger */}
                  <div className="relative" ref={dropdownBRef}>
                    <button
                      type="button"
                      title={activeOptionB.subtitle}
                      onClick={() => setIsDropdownBOpen((prev) => !prev)}
                      className="inline-flex items-center justify-between gap-3 min-w-[270px] sm:min-w-[390px] px-3.5 py-2 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {activeOptionB.icon}
                        <span className="truncate">
                          {activeOptionB.num}. {activeOptionB.label}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                          isDropdownBOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isDropdownBOpen && (
                      <div className="absolute left-0 mt-1.5 w-[330px] sm:w-[440px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1.5 divide-y divide-[var(--theme-border-subtle)] max-h-[420px] overflow-y-auto">
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
                              className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600/10 text-[var(--theme-text-primary)] font-bold'
                                  : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {opt.icon}
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate">
                                    {opt.num}. {opt.label}
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--theme-text-muted)] truncate">
                                    {opt.subtitle}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Non-intrusive Hover Tooltip for Section B Selected View */}
                  <div
                    className="relative group inline-flex items-center"
                    title={activeOptionB.subtitle}
                  >
                    <span className="p-1.5 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] hover:text-emerald-600 transition-colors cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                    <div className="pointer-events-none absolute left-0 top-full mt-1.5 w-64 sm:w-72 p-2.5 rounded-lg border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      <div className="text-[11px] font-bold text-[var(--theme-text-primary)]">
                        {activeOptionB.num}. {activeOptionB.label}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--theme-text-muted)] mt-0.5 leading-relaxed">
                        {activeOptionB.subtitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Coin Live Price Pill in Section B Header */}
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[var(--theme-text-muted)]">Active Coin:</span>
                  <span className="font-extrabold text-[var(--theme-text-primary)]">
                    {activeAsset.name} ({activeAsset.symbol})
                  </span>
                  <span className="font-bold text-emerald-600">
                    ${activeAsset.price.toLocaleString('en-US', {
                      minimumFractionDigits: activeAsset.price < 1 ? 4 : 2,
                      maximumFractionDigits: activeAsset.price < 1 ? 4 : 2,
                    })}
                  </span>
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
          </div>
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
