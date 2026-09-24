import React from 'react';
import {
  Globe,
  Sun,
  ExternalLink,
  Activity,
  Database,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useBatchWriterStats } from '../services/batchWriterService';
import { GlobalSymbolSearch } from './Search/GlobalSymbolSearch';
import { TrackedAsset } from '../services/allTrackedAssets';

interface NavbarProps {
  onOpenFirestoreModal?: () => void;
  onOpenBatchModal?: () => void;
  onSelectAsset?: (asset: TrackedAsset) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenFirestoreModal, onOpenBatchModal, onSelectAsset }) => {
  const { theme, setTheme } = useTheme();
  const batchStats = useBatchWriterStats();

  return (
    <header className="border-b sticky top-0 z-40 backdrop-blur shadow-xs transition-colors" style={{ backgroundColor: 'var(--theme-bg-header)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Terminal Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Globe className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base sm:text-lg" style={{ color: 'var(--theme-text-primary)' }}>
                Institutional Workstation
              </span>
              <span className="hidden lg:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--theme-accent-light)', borderColor: 'var(--theme-accent-border)', color: 'var(--theme-accent)' }}>
                NSE • F&O • Global • Crypto
              </span>
            </div>
          </div>
        </div>

        {/* Global Symbol Search Bar (Filters 500+ Tracked Assets & Selects in Terminal) */}
        {onSelectAsset && (
          <div className="flex-1 max-w-md mx-2 min-w-[240px] order-last sm:order-none w-full sm:w-auto">
            <GlobalSymbolSearch onSelectAsset={onSelectAsset} />
          </div>
        )}

        {/* Quick Launch, Batch Processing & Gateways */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Service Layer Batch Processing Indicator */}
          <button
            onClick={() => {
              if (onOpenBatchModal) onOpenBatchModal();
              else batchStats.triggerFlush();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              batchStats.status === 'flushing'
                ? 'bg-amber-50 text-amber-800 border-amber-400 animate-pulse'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title={`Batch Writer Utility: ${batchStats.costSavingsPercentage}% network requests & Firestore cost saved. Click to trigger atomic flush.`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500/30" />
            <span className="hidden sm:inline">Batch Writer:</span>
            <span className="font-extrabold text-emerald-700">
              {batchStats.costSavingsPercentage > 0 ? `${batchStats.costSavingsPercentage}% Saved` : 'Active'}
            </span>
            {batchStats.pendingQueueSize > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-900 rounded-full border border-amber-300 font-bold">
                {batchStats.pendingQueueSize} queued
              </span>
            )}
          </button>

          {/* Cloud Database Viewer Gateway */}
          {onOpenFirestoreModal && (
            <button
              onClick={onOpenFirestoreModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
              title="View Persisted Cloud Database (fair-bot / Firestore)"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Firestore DB</span>
            </button>
          )}

          {/* Direct Link to Deployed Crypto App */}
          <a
            href="https://crypto.eshanpatel.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
            style={{ backgroundColor: 'var(--theme-accent-light)', borderColor: 'var(--theme-accent-border)', color: 'var(--theme-accent)' }}
            title="Launch Deployed Crypto Application (https://crypto.eshanpatel.in/)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Crypto App</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Executive Daylight Theme Selector Dropdown */}
          <div className="relative flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500 hidden sm:inline" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer appearance-none pr-8"
              style={{
                backgroundColor: 'var(--theme-bg-card-subtle)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)'
              }}
              title="Select Executive Daylight Theme"
            >
              <option value="executive">☀️ Executive Platinum Daylight (Default)</option>
              <option value="alpine">🏔️ Alpine Clean Daylight</option>
              <option value="ivory">📜 Bloomberg Ivory Terminal</option>
              <option value="nordic">🌾 Nordic Dawn & Linen</option>
              <option value="azure">🌊 Royal Azure Daylight</option>
              <option value="sage">🍃 Executive Sage Daylight</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
