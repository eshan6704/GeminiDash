import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Check,
} from 'lucide-react';
import { GlobalSymbolSearch } from './Search/GlobalSymbolSearch';
import { TrackedAsset } from '../services/allTrackedAssets';

export type MainMarketTab =
  | 'CRYPTO'
  | 'GLOBAL_INDICES'
  | 'FOREX'
  | 'COMMODITIES'
  | 'NIFTY_INDICES'
  | 'STOCK_CONSTITUENTS'
  | 'EQUITY_HUB'
  | 'OPTIONS_HUB';

export type OptionsSubTab = 'INDEX' | 'STOCK' | 'BOTH';
export type EquityHubSubTab = 'PORTFOLIO' | 'WATCHLIST' | 'SCREENER' | 'ALL';

interface NavbarProps {
  mainMarketTab: MainMarketTab;
  onSelectMarketTab: (tab: MainMarketTab) => void;
  optionsSubTab: OptionsSubTab;
  onSelectOptionsSubTab: (sub: OptionsSubTab) => void;
  equityHubSubTab: EquityHubSubTab;
  onSelectEquityHubSubTab: (sub: EquityHubSubTab) => void;
  onOpenStorage?: () => void;
  onOpenBatchModal?: () => void;
  onSelectAsset?: (asset: TrackedAsset) => void;
}

const MASTER_PAGES: {
  id: MainMarketTab;
  label: string;
  badge: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'CRYPTO',
    label: 'Crypto & Gold Terminal (AurumX)',
    badge: 'Default · Spot & Perp',
    icon: <Coins className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'OPTIONS_HUB',
    label: 'Options Chain (Index & Stock)',
    badge: 'NIFTY · BANKNIFTY · F&O',
    icon: <Waves className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'EQUITY_HUB',
    label: 'Portfolio · Watchlist · Screener',
    badge: '3-in-1 Equity Suite',
    icon: <Briefcase className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'NIFTY_INDICES',
    label: 'Indian Indices (NSE / BSE)',
    badge: 'Benchmarks & Sectors',
    icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'STOCK_CONSTITUENTS',
    label: 'NIFTY 500 Stocks',
    badge: 'Live Constituents',
    icon: <Building className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'GLOBAL_INDICES',
    label: 'Global Indices',
    badge: 'US · EU · Asia',
    icon: <Globe className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'FOREX',
    label: 'Forex Exchange',
    badge: 'Major & INR Pairs',
    icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'COMMODITIES',
    label: 'Commodities & Energy',
    badge: 'Metals · Crude · Agri',
    icon: <Box className="w-4 h-4 text-emerald-600" />,
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  mainMarketTab,
  onSelectMarketTab,
  optionsSubTab,
  onSelectOptionsSubTab,
  equityHubSubTab,
  onSelectEquityHubSubTab,
  onOpenStorage,
  onSelectAsset,
}) => {
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePageObj =
    MASTER_PAGES.find((p) => p.id === mainMarketTab) || MASTER_PAGES[0];

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-xl transition-colors bg-[var(--theme-bg-header)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Dropdown Page Selection Button (Replaces Institutional Terminal title) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsPageDropdownOpen((prev) => !prev)}
              className="inline-flex items-center justify-between gap-2.5 min-w-[240px] sm:min-w-[285px] px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2 truncate">
                {activePageObj.icon}
                <span className="truncate">{activePageObj.label}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 hidden md:inline">
                  {activePageObj.badge}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--theme-text-muted)] transition-transform duration-150 ${
                    isPageDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </button>

            {isPageDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-[310px] sm:w-[350px] rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xl z-50 py-1.5 divide-y divide-[var(--theme-border-subtle)]">
                {MASTER_PAGES.map((page) => {
                  const isSelected = mainMarketTab === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        onSelectMarketTab(page.id);
                        setIsPageDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/10 text-[var(--theme-text-primary)] font-bold'
                          : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card-subtle)] hover:text-[var(--theme-text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {page.icon}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{page.label}</div>
                          <div className="text-[10px] font-mono text-[var(--theme-text-muted)] truncate">
                            {page.badge}
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

          {/* Inline Sub-Mode Switcher for Options Hub */}
          {mainMarketTab === 'OPTIONS_HUB' && (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'INDEX', label: 'Index Options', icon: <Waves className="w-3.5 h-3.5" /> },
                { id: 'STOCK', label: 'Stock Options', icon: <Building2 className="w-3.5 h-3.5" /> },
                { id: 'BOTH', label: 'Both', icon: <Activity className="w-3.5 h-3.5" /> },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectOptionsSubTab(sub.id as OptionsSubTab)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
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

        {/* Center: Global Symbol Search Bar */}
        {onSelectAsset && (
          <div className="flex-1 max-w-sm mx-1 min-w-[200px] order-last sm:order-none w-full sm:w-auto">
            <GlobalSymbolSearch onSelectAsset={onSelectAsset} />
          </div>
        )}

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
