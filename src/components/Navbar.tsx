import React from 'react';
import {
  Globe,
  ExternalLink,
  Activity,
  HardDrive,
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
} from 'lucide-react';
import { TrackedAsset } from '../services/allTrackedAssets';

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
  | 'ALL'
  | 'INDIAN_INDICES'
  | 'GLOBAL_INDICES'
  | 'FOREX'
  | 'COMMODITIES';

interface NavbarProps {
  mainMarketTab: MainMarketTab;
  onSelectMarketTab: (tab: MainMarketTab) => void;
  optionsSubTab: OptionsSubTab;
  onSelectOptionsSubTab: (sub: OptionsSubTab) => void;
  equityHubSubTab: EquityHubSubTab;
  onSelectEquityHubSubTab: (sub: EquityHubSubTab) => void;
  marketOverviewSubTab?: MarketOverviewSubTab;
  onSelectMarketOverviewSubTab?: (sub: MarketOverviewSubTab) => void;
  onOpenStorage?: () => void;
  onOpenBatchModal?: () => void;
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
  marketOverviewSubTab = 'ALL',
  onSelectMarketOverviewSubTab,
  onOpenStorage,
}) => {
  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-xl transition-colors bg-[var(--theme-bg-header)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Main Market Tab Buttons + Active Desk Sub-Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          {/* Inline Sub-Mode Switcher for Market Overview (All / Indian / Global / Forex / Commodities) */}
          {mainMarketTab === 'MARKET_OVERVIEW' && onSelectMarketOverviewSubTab && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'ALL', label: 'All', icon: <Activity className="w-3.5 h-3.5" /> },
                { id: 'INDIAN_INDICES', label: 'Indian', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { id: 'GLOBAL_INDICES', label: 'Global', icon: <Globe className="w-3.5 h-3.5" /> },
                { id: 'FOREX', label: 'Forex', icon: <DollarSign className="w-3.5 h-3.5" /> },
                { id: 'COMMODITIES', label: 'Commodities', icon: <Box className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectMarketOverviewSubTab(sub.id as MarketOverviewSubTab)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border whitespace-nowrap ${
                    marketOverviewSubTab === sub.id
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

        {/* Right: Quick Launch & Gateways */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenStorage && (
            <button
              onClick={onOpenStorage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-elevated)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]"
              title="Open Backblaze B2 Cloud Storage Explorer"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Storage</span>
            </button>
          )}

          <a
            href="https://crypto.eshanpatel.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border bg-[var(--theme-accent-light)] border-[var(--theme-accent-border)] text-[var(--theme-accent)]"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Market Live</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>
    </header>
  );
};
