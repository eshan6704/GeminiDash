import React from 'react';
import {
  Globe,
  ExternalLink,
  Activity,
  HardDrive
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GlobalSymbolSearch } from './Search/GlobalSymbolSearch';
import { TrackedAsset } from '../services/allTrackedAssets';

interface NavbarProps {
  onOpenStorage?: () => void;
  onOpenBatchModal?: () => void;
  onSelectAsset?: (asset: TrackedAsset) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStorage, onSelectAsset }) => {
  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur-xl transition-colors bg-[var(--theme-bg-header)] border-[var(--theme-border)] text-[var(--theme-text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Terminal Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-bold tracking-tight text-sm sm:text-base uppercase">
            Institutional Terminal
          </span>
        </div>

        {/* Global Symbol Search Bar */}
        {onSelectAsset && (
          <div className="flex-1 max-w-sm mx-2 min-w-[200px] order-last sm:order-none w-full sm:w-auto">
            <GlobalSymbolSearch onSelectAsset={onSelectAsset} />
          </div>
        )}

        {/* Quick Launch & Gateways */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenStorage && (
            <button
              onClick={onOpenStorage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold transition-all border cursor-pointer bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-border)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] uppercase tracking-wider"
              title="Open Backblaze B2 Cloud Storage Explorer"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span>Storage</span>
            </button>
          )}

          <a
            href="https://crypto.eshanpatel.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold transition-all border uppercase tracking-wider bg-[var(--theme-accent-light)] border-[var(--theme-accent-border)] text-[var(--theme-accent)]"
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
