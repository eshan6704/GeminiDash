import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Activity,
  Coins,
  Waves,
  Briefcase,
  BarChart3,
  Building,
  Building2,
  DollarSign,
  Box,
  Star,
  SlidersHorizontal,
  Sliders,
  Info,
  Layers,
  Zap,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { TrackedAsset } from '../services/allTrackedAssets';
import { PREFERENCE_COIN_SYMBOLS } from '../services/marketDataTables';
import type { CryptoCoinItem } from './MarketCap/CryptoMarketCapTable';
import type { MarketAsset } from '../types/trading';

export type MainMarketTab =
  | 'MARKET_OVERVIEW'
  | 'NIFTY_INDICES'
  | 'OPTIONS_HUB'
  | 'STOCK_CONSTITUENTS'
  | 'CRYPTO'
  | 'COIN'
  | 'EQUITY_HUB';

export type OptionsSubTab = 'INDEX' | 'STOCK' | 'BOTH';
export type EquityHubSubTab = 'PORTFOLIO' | 'WATCHLIST' | 'SCREENER' | 'ALL';
export type MarketOverviewSubTab =
  | 'indian_indices'
  | 'global_indices'
  | 'crypto'
  | 'nifty50_stocks'
  | 'commodities'
  | 'forex_major'
  | 'forex_emerging'
  | 'bonds';

export type CryptoSubTab =
  | 'CRYPTO_TABLE'
  | 'ADVANCED_CRYPTO_SCREENER'
  | 'MICRO_VOLATILITY'
  | 'CRYPTO_COMMON';

export type CoinSubTab =
  | 'COIN_INFO'
  | 'ORDERBOOK'
  | 'PAPER_PORTFOLIO_FORECAST'
  | 'AUTO_GRID_SIMULATION';

interface NavbarProps {
  mainMarketTab: MainMarketTab;
  onSelectMarketTab: (tab: MainMarketTab) => void;
  optionsSubTab: OptionsSubTab;
  onSelectOptionsSubTab: (sub: OptionsSubTab) => void;
  equityHubSubTab: EquityHubSubTab;
  onSelectEquityHubSubTab: (sub: EquityHubSubTab) => void;
  marketOverviewSubTab?: MarketOverviewSubTab;
  onSelectMarketOverviewSubTab?: (sub: MarketOverviewSubTab) => void;
  cryptoSubTab?: CryptoSubTab;
  onSelectCryptoSubTab?: (sub: CryptoSubTab) => void;
  coinSubTab?: CoinSubTab;
  onSelectCoinSubTab?: (sub: CoinSubTab) => void;
  activeCoinAsset?: MarketAsset;
  cryptoTableCoins?: CryptoCoinItem[];
  liveAssets?: Record<string, MarketAsset>;
  onSelectCoinFromPicker?: (symbol: string, coin?: CryptoCoinItem) => void;
  onCoinPickerToggle?: (isOpen: boolean) => void;
  onSelectAsset?: (asset: TrackedAsset) => void;
}

const MASTER_PAGES: {
  id: MainMarketTab;
  num: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'MARKET_OVERVIEW',
    num: '1',
    shortLabel: 'Markets',
    icon: <Globe className="w-3.5 h-3.5" />,
  },
  {
    id: 'OPTIONS_HUB',
    num: '2',
    shortLabel: 'Options',
    icon: <Waves className="w-3.5 h-3.5" />,
  },
  {
    id: 'STOCK_CONSTITUENTS',
    num: '3',
    shortLabel: 'Stocks',
    icon: <Building className="w-3.5 h-3.5" />,
  },
  {
    id: 'CRYPTO',
    num: '4',
    shortLabel: 'Crypto',
    icon: <Coins className="w-3.5 h-3.5" />,
  },
  {
    id: 'COIN',
    num: '5',
    shortLabel: 'Coin',
    icon: <Activity className="w-3.5 h-3.5" />,
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  mainMarketTab,
  onSelectMarketTab,
  optionsSubTab,
  onSelectOptionsSubTab,
  equityHubSubTab,
  onSelectEquityHubSubTab,
  marketOverviewSubTab = 'indian_indices',
  onSelectMarketOverviewSubTab,
  cryptoSubTab = 'CRYPTO_TABLE',
  onSelectCryptoSubTab,
  coinSubTab = 'COIN_INFO',
  onSelectCoinSubTab,
  activeCoinAsset,
  cryptoTableCoins = [],
  liveAssets = {},
  onSelectCoinFromPicker,
  onCoinPickerToggle,
}) => {
  const [isCoinPickerOpen, setIsCoinPickerOpen] = useState(false);
  const coinPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (coinPickerRef.current && !coinPickerRef.current.contains(e.target as Node)) {
        setIsCoinPickerOpen(false);
        onCoinPickerToggle?.(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCoinPickerToggle]);

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-xl transition-colors bg-[var(--theme-bg-header)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Main Market Tab Buttons + Active Desk Sub-Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary Tab Bar: 1-Markets, 2-Options, 3-Stocks, 4-Crypto, 5-Coin */}
          <div className="flex items-center gap-1 p-1 rounded-xl border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] flex-wrap">
            {MASTER_PAGES.map((page) => {
              const isSelected = mainMarketTab === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onSelectMarketTab(page.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-elevated)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  {page.icon}
                  <span className="font-mono text-[10px] opacity-80">{page.num}.</span>
                  <span>{page.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Inline Sub-Mode Switcher for Options Hub */}
          {mainMarketTab === 'OPTIONS_HUB' && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'INDEX', label: 'Index', icon: <Waves className="w-3.5 h-3.5" /> },
                { id: 'STOCK', label: 'Stock', icon: <Building2 className="w-3.5 h-3.5" /> },
                { id: 'BOTH', label: 'Both', icon: <Activity className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectOptionsSubTab(sub.id as OptionsSubTab)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border whitespace-nowrap ${
                    optionsSubTab === sub.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inline Sub-Mode Switcher for Crypto Tab */}
          {mainMarketTab === 'CRYPTO' && onSelectCryptoSubTab && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'CRYPTO_TABLE', label: 'Top 250', icon: <Coins className="w-3.5 h-3.5" /> },
                { id: 'ADVANCED_CRYPTO_SCREENER', label: 'Screener', icon: <Sliders className="w-3.5 h-3.5" /> },
                { id: 'MICRO_VOLATILITY', label: 'Volatility', icon: <Activity className="w-3.5 h-3.5" /> },
                { id: 'CRYPTO_COMMON', label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectCryptoSubTab(sub.id as CryptoSubTab)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border whitespace-nowrap ${
                    cryptoSubTab === sub.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inline Sub-Mode Switcher + Coin Selector for Coin Tab */}
          {mainMarketTab === 'COIN' && onSelectCoinSubTab && (
            <div className="flex items-center gap-1 flex-wrap">
              {/* Active Coin Selector in Top Bar */}
              {activeCoinAsset && (
                <div className="relative" ref={coinPickerRef}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCoinPickerOpen;
                      setIsCoinPickerOpen(next);
                      onCoinPickerToggle?.(next);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer whitespace-nowrap"
                    title="Select coin"
                  >
                    <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-600 font-extrabold">{activeCoinAsset.symbol}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-[var(--theme-text-muted)] shrink-0 transition-transform duration-150 ${
                        isCoinPickerOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCoinPickerOpen && (
                    <div className="absolute left-0 mt-1.5 w-[305px] sm:w-[340px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1">
                      <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-emerald-600 font-bold border-b border-[var(--theme-border-subtle)] bg-emerald-600/5">
                        <span>★ PREFERENCE COINS (BTC · XAUT · PAXG · ZEC · SOL · CL · XAG)</span>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--theme-border-subtle)]">
                        {cryptoTableCoins.map((c, idx) => {
                          const symUpper = c.symbol.toUpperCase();
                          const isPreferred = (PREFERENCE_COIN_SYMBOLS as readonly string[]).includes(symUpper);
                          const prevCoin = idx > 0 ? cryptoTableCoins[idx - 1] : null;
                          const prevWasPreferred =
                            prevCoin &&
                            (PREFERENCE_COIN_SYMBOLS as readonly string[]).includes(
                              prevCoin.symbol.toUpperCase()
                            );
                          const showOtherHeader = !isPreferred && prevWasPreferred;

                          const isSelected = activeCoinAsset.symbol === symUpper;
                          const livePrice = liveAssets[symUpper]?.price || c.price;
                          const changePct = liveAssets[symUpper]?.change24h ?? c.change24h;
                          const displayName =
                            symUpper === 'CL' ? 'Crude Oil (WTI)' : symUpper === 'XAG' ? 'Silver (XAG)' : c.name;

                          return (
                            <React.Fragment key={c.id || c.symbol}>
                              {showOtherHeader && (
                                <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)]">
                                  <span>OTHER MARKET COINS</span>
                                  <span>USDT SPOT</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectCoinFromPicker?.(c.symbol, {
                                    ...c,
                                    name: displayName,
                                    price: livePrice,
                                  });
                                  setIsCoinPickerOpen(false);
                                  onCoinPickerToggle?.(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600/15 text-[var(--theme-text-primary)] font-bold'
                                    : isPreferred
                                    ? 'bg-emerald-600/[0.03] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-subtle)]'
                                    : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 font-mono">
                                  <span
                                    className={`text-[10px] w-6 shrink-0 ${
                                      isPreferred ? 'text-emerald-600 font-bold' : 'text-[var(--theme-text-muted)]'
                                    }`}
                                  >
                                    {isPreferred ? `★${idx + 1}` : `#${c.rank}`}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-600 shrink-0">
                                    {symUpper === 'CL' ? 'CL (Crude)' : symUpper}
                                  </span>
                                  <span className="text-[11px] text-[var(--theme-text-primary)] truncate font-sans">
                                    {displayName}
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
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {[
                { id: 'COIN_INFO', label: 'Coin Info', icon: <Info className="w-3.5 h-3.5" /> },
                { id: 'ORDERBOOK', label: 'Orderbook & Trades', icon: <Layers className="w-3.5 h-3.5" /> },
                { id: 'PAPER_PORTFOLIO_FORECAST', label: 'Chart, PnL & Trade', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { id: 'AUTO_GRID_SIMULATION', label: 'Auto Grid', icon: <Sparkles className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectCoinSubTab(sub.id as CoinSubTab)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border whitespace-nowrap ${
                    coinSubTab === sub.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inline Sub-Mode Switcher for Equity Hub (Portfolio / Watchlist / Screener) */}
          {mainMarketTab === 'EQUITY_HUB' && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'PORTFOLIO', label: 'Portfolio', icon: <Briefcase className="w-3.5 h-3.5" /> },
                { id: 'WATCHLIST', label: 'Watchlist', icon: <Star className="w-3.5 h-3.5" /> },
                { id: 'SCREENER', label: 'Screener', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
                { id: 'ALL', label: 'All-in-One', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectEquityHubSubTab(sub.id as EquityHubSubTab)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
                    equityHubSubTab === sub.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
