import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Coins,
  Globe,
  DollarSign,
  Flame,
  Building2,
  Briefcase,
  Star,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ALL_TRACKED_ASSETS, TrackedAsset } from '../../services/allTrackedAssets';

interface Props {
  onSelectAsset: (asset: TrackedAsset) => void;
  className?: string;
}

export const GlobalSymbolSearch: React.FC<Props> = ({ onSelectAsset, className = '' }) => {
  const { isLight, theme } = useTheme();
  
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = ALL_TRACKED_ASSETS;
    if (selectedCategory !== 'ALL') {
      list = list.filter((a) => {
        if (selectedCategory === 'LARGECAP') return a.marketCapCategory === 'LARGECAP';
        if (selectedCategory === 'MIDCAP') return a.marketCapCategory === 'MIDCAP';
        if (selectedCategory === 'SMALLCAP') return a.marketCapCategory === 'SMALLCAP';
        if (selectedCategory === 'MICROCAP') return a.marketCapCategory === 'MICROCAP';
        if (selectedCategory === 'CRYPTO') return a.category === 'CRYPTO';
        if (selectedCategory === 'GLOBAL') return a.category === 'GLOBAL_INDEX';
        if (selectedCategory === 'FOREX') return a.category === 'FOREX';
        if (selectedCategory === 'COMMODITY') return a.category === 'COMMODITY';
        if (selectedCategory === 'OPTION') return a.category === 'OPTION_CHAIN';
        return a.category === selectedCategory;
      });
    }

    if (!query.trim()) {
      return list.slice(0, 20); // Top recommended
    }

    const q = query.toLowerCase().trim();
    return list.filter((a) => {
      return (
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.sector && a.sector.toLowerCase().includes(q))
      );
    }).slice(0, 30);
  }, [query, selectedCategory]);

  const handleSelect = (asset: TrackedAsset) => {
    onSelectAsset(asset);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredAssets.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAssets[selectedIndex]) {
        handleSelect(filteredAssets[selectedIndex]);
      }
    }
  };

  const getCategoryBadge = (asset: TrackedAsset) => {
    if (asset.marketCapCategory) {
      if (asset.marketCapCategory === 'LARGECAP') return { text: 'Largecap', bg: 'bg-blue-500/10 text-blue-600 border-blue-200' };
      if (asset.marketCapCategory === 'MIDCAP') return { text: 'Midcap', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
      if (asset.marketCapCategory === 'SMALLCAP') return { text: 'Smallcap', bg: 'bg-purple-500/10 text-purple-600 border-purple-200' };
      if (asset.marketCapCategory === 'MICROCAP') return { text: 'Microcap', bg: 'bg-rose-500/10 text-rose-600 border-rose-200' };
      if (asset.marketCapCategory === 'TOTAL_MARKET') return { text: 'Total Mkt', bg: 'bg-orange-500/10 text-orange-600 border-orange-200' };
    }
    if (asset.category === 'CRYPTO') return { text: 'Crypto', bg: 'bg-amber-500/10 text-amber-600 border-amber-200' };
    if (asset.category === 'FOREX') return { text: 'Forex', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
    if (asset.category === 'COMMODITY') return { text: 'Commodity', bg: 'bg-amber-500/10 text-amber-700 border-amber-300' };
    if (asset.category === 'GLOBAL_INDEX') return { text: 'Global Index', bg: 'bg-blue-500/10 text-blue-700 border-blue-200' };
    if (asset.category === 'OPTION_CHAIN') return { text: 'Option Chain', bg: 'bg-orange-500/10 text-orange-700 border-orange-300' };
    if (asset.category === 'US_STOCK') return { text: 'US Bluechip', bg: 'bg-slate-500/10 text-slate-700 border-slate-200' };
    return { text: 'Asset', bg: 'bg-slate-500/10 text-slate-600 border-slate-200' };
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Global Search 500+ Assets (BTC, Nifty, Reliance, EUR/USD, Gold)..."
          className="w-full pl-9 pr-14 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-all placeholder:text-slate-400"
          style={{
            backgroundColor: 'var(--theme-bg-page)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Results Menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            backgroundColor: 'var(--theme-bg-header)',
            borderColor: 'var(--theme-border)',
            maxHeight: '420px',
          }}
        >
          {/* Quick Filter Chips */}
          <div className="p-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-bold" style={{ borderColor: 'var(--theme-border-subtle)', backgroundColor: 'var(--theme-bg-card-subtle)' }}>
            {[
              { id: 'ALL', label: 'All 500+' },
              { id: 'LARGECAP', label: 'Largecap' },
              { id: 'MIDCAP', label: 'Midcap' },
              { id: 'SMALLCAP', label: 'Smallcap' },
              { id: 'MICROCAP', label: 'Microcap' },
              { id: 'OPTION', label: 'Option Chain' },
              { id: 'CRYPTO', label: 'Crypto & Gold' },
              { id: 'GLOBAL', label: 'Global' },
              { id: 'FOREX', label: 'Forex' },
              { id: 'COMMODITY', label: 'Commodities' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(chip.id);
                  setSelectedIndex(0);
                }}
                className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === chip.id
                    ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Asset List */}
          <div className="overflow-y-auto max-h-[340px] divide-y" style={{ borderColor: 'var(--theme-border-subtle)' }}>
            {filteredAssets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No matching asset found for "{query}". Try searching by ticker (e.g. RELIANCE, BTC, GC=F).
              </div>
            ) : (
              filteredAssets.map((asset, idx) => {
                const isSelected = idx === selectedIndex;
                const badge = getCategoryBadge(asset);
                const isUp = asset.change1d >= 0;

                return (
                  <div
                    key={`${asset.category}-${asset.symbol}`}
                    onClick={() => handleSelect(asset)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 sm:px-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-500/10'
                        : 'hover:bg-slate-500/5'
                    }`}
                  >
                    {/* Left: Symbol & Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {asset.category === 'CRYPTO' && <Coins className="w-3.5 h-3.5 text-amber-500" />}
                        {asset.category === 'INDIAN_STOCK' && <Briefcase className="w-3.5 h-3.5 text-orange-500" />}
                        {asset.category === 'INDIAN_INDEX' && <Building2 className="w-3.5 h-3.5 text-orange-600" />}
                        {asset.category === 'GLOBAL_INDEX' && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                        {asset.category === 'FOREX' && <DollarSign className="w-3.5 h-3.5 text-emerald-500" />}
                        {asset.category === 'COMMODITY' && <Flame className="w-3.5 h-3.5 text-amber-600" />}
                        {asset.category === 'OPTION_CHAIN' && <Zap className="w-3.5 h-3.5 text-purple-600" />}
                        {asset.category === 'US_STOCK' && <Layers className="w-3.5 h-3.5 text-slate-600" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                            {asset.symbol}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                            {badge.text}
                          </span>
                          {asset.isTerminalAsset && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              ⚡ Terminal Ready
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                          {asset.name} {asset.sector ? `• ${asset.sector}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price, Change & Action */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right font-mono">
                        <div className="font-extrabold text-xs" style={{ color: 'var(--theme-text-primary)' }}>
                          {asset.currency === 'INR' ? '₹' : '$'}
                          {asset.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          <span>{isUp ? '+' : ''}{asset.change1d.toFixed(2)}%</span>
                        </div>
                      </div>

                      <ArrowRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? 'translate-x-0.5 text-blue-500' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
