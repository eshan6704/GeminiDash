import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Search, X, Zap } from 'lucide-react';
import {
  FASTINFO_GROUP_CONFIG,
  FASTINFO_GROUP_ORDER,
  FASTINFO_SYMBOL_NAMES,
  FastInfoGroupId,
  FastInfoSnapshot,
  FastInfoHistoryPoint,
  displaySymbol,
  getSymbolDisplayName,
  fetchFastInfoSnapshot,
  getCachedFastInfoSnapshot,
  refreshFastInfoGroup,
  refreshAllFastInfoGroups,
  fetchFastInfoSymbolHistory,
  getMarketApiCooldownRemainingMs,
  getMarketApiCooldownSeconds,
  subscribeMarketApiCooldown,
} from '../../services/hfFastInfoService';
import { updateLiveUsdInrFromSnapshot } from '../../utils/inrCurrency';

interface FastInfoMarketOverviewProps {
  activeGroup?: FastInfoGroupId;
  onSelectGroup?: (group: FastInfoGroupId) => void;
}

function timeAgo(isoString?: string): string {
  if (!isoString) return '';
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function formatDateShort(d?: string): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function bigNumFmt(v: any): string {
  if (typeof v !== 'number') return String(v ?? '');
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString();
}

function numFmt(v: any): string {
  return typeof v === 'number'
    ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(v ?? '');
}

export const FastInfoMarketOverview: React.FC<FastInfoMarketOverviewProps> = () => {
  const [snapshot, setSnapshot] = useState<FastInfoSnapshot | null>(() =>
    getCachedFastInfoSnapshot()
  );
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState<boolean>(
    () => !getCachedFastInfoSnapshot()
  );
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [refreshingGroup, setRefreshingGroup] = useState<FastInfoGroupId | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Optional Section-wise High Refresh target (at most 1 section active at a time, respecting >= 15s & 1 call/10s)
  const [highRefreshGroup, setHighRefreshGroup] = useState<FastInfoGroupId | null>(null);

  // Cooldown countdown (1 call / 10s rate limit)
  const [cooldownSec, setCooldownSec] = useState<number>(() => getMarketApiCooldownSeconds());

  useEffect(() => {
    const updateCooldown = () => {
      setCooldownSec(getMarketApiCooldownSeconds());
    };
    const unsub = subscribeMarketApiCooldown(updateCooldown);
    const timer = setInterval(updateCooldown, 500);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  // Symbol Modal State
  const [modalTarget, setModalTarget] = useState<{
    group: FastInfoGroupId;
    symbol: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalHistory, setModalHistory] = useState<FastInfoHistoryPoint[]>([]);

  const loadSnapshot = useCallback(async () => {
    try {
      setSnapshotError(null);
      const data = await fetchFastInfoSnapshot();
      setSnapshot(data);

      const usdinrQuote = data.groups.forex_emerging?.data?.['USDINR=X'];
      if (usdinrQuote && typeof usdinrQuote.price === 'number' && usdinrQuote.price > 40) {
        updateLiveUsdInrFromSnapshot(usdinrQuote.price);
      }
    } catch (e: any) {
      setSnapshotError(e?.message || 'Failed to load snapshot');
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, []);

  // Load initial snapshot once (and every 5 minutes in background)
  useEffect(() => {
    if (!getCachedFastInfoSnapshot()) {
      loadSnapshot();
    } else {
      setIsLoadingSnapshot(false);
    }
    const interval = setInterval(() => {
      if (getMarketApiCooldownRemainingMs() === 0) {
        loadSnapshot();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadSnapshot]);

  const handleRefreshGroup = useCallback(
    async (group: FastInfoGroupId) => {
      if (refreshingGroup || isRefreshingAll || getMarketApiCooldownRemainingMs() > 0) return;
      setRefreshingGroup(group);
      setGroupError(null);
      try {
        const updatedGroup = await refreshFastInfoGroup(group, { rejectIfCoolingDown: true });
        setSnapshot((prev) => {
          const base = prev || { groups: {}, updated_at: new Date().toISOString() };
          return {
            ...base,
            groups: {
              ...base.groups,
              [group]: updatedGroup,
            },
          };
        });

        if (group === 'forex_emerging') {
          const usdinrQuote = updatedGroup.data?.['USDINR=X'];
          if (usdinrQuote && typeof usdinrQuote.price === 'number' && usdinrQuote.price > 40) {
            updateLiveUsdInrFromSnapshot(usdinrQuote.price);
          }
        }
      } catch (e: any) {
        setGroupError(e?.message || `Refresh failed for ${group}`);
      } finally {
        setRefreshingGroup(null);
      }
    },
    [refreshingGroup, isRefreshingAll]
  );

  // Section-wise High Refresh loop (triggers every 15s for the selected section, strictly respecting 1 call / 10s)
  const handleRefreshGroupRef = useRef(handleRefreshGroup);
  handleRefreshGroupRef.current = handleRefreshGroup;

  useEffect(() => {
    if (!highRefreshGroup) return;
    const interval = setInterval(() => {
      if (getMarketApiCooldownRemainingMs() === 0) {
        handleRefreshGroupRef.current(highRefreshGroup);
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [highRefreshGroup]);

  const handleRefreshAll = async () => {
    if (isRefreshingAll || refreshingGroup || getMarketApiCooldownRemainingMs() > 0) return;
    setIsRefreshingAll(true);
    setGroupError(null);
    try {
      const fresh = await refreshAllFastInfoGroups({ rejectIfCoolingDown: true });
      setSnapshot(fresh);
      const usdinrQuote = fresh.groups.forex_emerging?.data?.['USDINR=X'];
      if (usdinrQuote && typeof usdinrQuote.price === 'number' && usdinrQuote.price > 40) {
        updateLiveUsdInrFromSnapshot(usdinrQuote.price);
      }
    } catch (e: any) {
      setGroupError(e?.message || 'Refresh all failed');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Handle Escape key for modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fetch symbol history when modal opens (1 single rate-limited API call)
  useEffect(() => {
    if (!modalTarget) {
      setModalHistory([]);
      return;
    }

    let cancelled = false;
    setModalLoading(true);
    setModalHistory([]);

    fetchFastInfoSymbolHistory(modalTarget.symbol)
      .then((hist) => {
        if (cancelled) return;
        setModalHistory(hist);
      })
      .catch(() => {
        if (cancelled) return;
        setModalHistory([]);
      })
      .finally(() => {
        if (!cancelled) setModalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modalTarget]);

  // Modal computed data from single yf_history response + snapshot quote
  const modalKnownQuote = modalTarget
    ? snapshot?.groups[modalTarget.group]?.data?.[modalTarget.symbol]
    : undefined;
  const modalDisplayLabel = modalTarget ? displaySymbol(modalTarget.symbol) : '';
  const modalResolvedName = modalTarget
    ? getSymbolDisplayName(modalTarget.symbol)
    : modalDisplayLabel;

  const modalStatsRows = useMemo(() => {
    if (modalHistory.length === 0) return [];
    const last = modalHistory[modalHistory.length - 1];
    const prev = modalHistory.length > 1 ? modalHistory[modalHistory.length - 2] : last;
    const highs = modalHistory.map((p) => p.high).filter((v) => v > 0);
    const lows = modalHistory.map((p) => p.low).filter((v) => v > 0);
    const vols = modalHistory.map((p) => p.volume).filter((v) => v > 0);
    const avgVol =
      vols.length > 0 ? Math.round(vols.reduce((a, b) => a + b, 0) / vols.length) : 0;

    const rows: { label: string; value: string }[] = [
      { label: 'Previous Close', value: numFmt(prev.close) },
      { label: 'Open', value: numFmt(last.open) },
      { label: 'Day High', value: numFmt(last.high) },
      { label: 'Day Low', value: numFmt(last.low) },
    ];
    if (highs.length > 0) {
      rows.push({ label: '1M High', value: numFmt(Math.max(...highs)) });
    }
    if (lows.length > 0) {
      rows.push({ label: '1M Low', value: numFmt(Math.min(...lows)) });
    }
    if (last.volume > 0) {
      rows.push({ label: 'Volume', value: bigNumFmt(last.volume) });
    }
    if (avgVol > 0) {
      rows.push({ label: 'Avg Volume (1M)', value: bigNumFmt(avgVol) });
    }
    return rows;
  }, [modalHistory]);

  const isCoolingDown = cooldownSec > 0;

  return (
    <div className="space-y-4">
      {/* Compact Top Utility Strip: Search + Section High-Refresh Selector + Small Icon Refresh All Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-2xs">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--theme-text-muted)]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter symbols across all sections..."
            className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Rate-Limit / Cooldown Pill */}
          {isCoolingDown && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30"
              title="Strict rate limit: maximum 1 API call per 10 seconds"
            >
              ⏱ {cooldownSec}s cooldown
            </span>
          )}

          {/* Compact Section High-Refresh Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--theme-text-secondary)]">
            <Zap
              className={`w-3.5 h-3.5 ${
                highRefreshGroup ? 'text-amber-500 animate-pulse' : 'text-[var(--theme-text-muted)]'
              }`}
            />
            <select
              value={highRefreshGroup || ''}
              onChange={(e) =>
                setHighRefreshGroup(
                  e.target.value ? (e.target.value as FastInfoGroupId) : null
                )
              }
              title="Select a section for periodic high refresh (respects 1 call / 10s limit)"
              className="px-2 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="">High Refresh: Off</option>
              {FASTINFO_GROUP_ORDER.map((g) => (
                <option key={g} value={g}>
                  ⚡ {FASTINFO_GROUP_CONFIG[g].label}
                </option>
              ))}
            </select>
          </div>

          {/* Small Icon Button: Snapshot Reload */}
          <button
            type="button"
            onClick={loadSnapshot}
            disabled={isCoolingDown || isLoadingSnapshot || isRefreshingAll}
            title={
              isCoolingDown
                ? `Wait ${cooldownSec}s (max 1 call / 10s)`
                : 'Reload Cached Snapshot (/fastinfo/snapshot)'
            }
            className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] hover:text-teal-600 hover:border-teal-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSnapshot ? 'animate-spin' : ''}`} />
          </button>

          {/* Small Icon Button: Refresh All */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isCoolingDown || isRefreshingAll || Boolean(refreshingGroup)}
            title={
              isCoolingDown
                ? `Wait ${cooldownSec}s (max 1 call / 10s)`
                : 'Refresh All Sections (/fastinfo/refresh-all)'
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>{isRefreshingAll ? 'Refreshing...' : 'All'}</span>
          </button>
        </div>
      </div>

      {groupError && (
        <div className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs font-medium flex items-center justify-between">
          <span>{groupError}</span>
          <button
            type="button"
            onClick={() => setGroupError(null)}
            className="text-rose-600 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isLoadingSnapshot && !snapshot ? (
        <div className="py-14 text-center text-xs text-[var(--theme-text-muted)] space-y-3 rounded-2xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)]">
          <div className="w-7 h-7 border-2 border-[var(--theme-border)] border-t-teal-600 rounded-full animate-spin mx-auto" />
          <div>Loading market snapshot...</div>
        </div>
      ) : snapshotError && !snapshot ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs flex items-center justify-between">
          <span>Failed to load snapshot: {snapshotError}</span>
          <button
            type="button"
            onClick={loadSnapshot}
            disabled={isCoolingDown}
            className="px-3 py-1 rounded-md bg-rose-600 text-white font-bold cursor-pointer disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : (
        /* All 8 FastInfo Sections Expanded Vertically One by One */
        <div className="space-y-4">
          {FASTINFO_GROUP_ORDER.map((groupKey) => {
            const cfg = FASTINFO_GROUP_CONFIG[groupKey];
            const groupData = snapshot?.groups[groupKey];
            if (!groupData) return null;

            const q = searchFilter.trim().toLowerCase();
            const entries = Object.entries(groupData.data).filter(([sym]) => {
              if (!q) return true;
              const disp = displaySymbol(sym).toLowerCase();
              const friendly = getSymbolDisplayName(sym).toLowerCase();
              return disp.includes(q) || sym.toLowerCase().includes(q) || friendly.includes(q);
            });

            if (q && entries.length === 0) return null;

            const failedSet = new Set(groupData.failed || []);
            const isLiveGroup = Boolean(groupData.refreshed_at);
            const lastUpdatedIso = groupData.refreshed_at || snapshot?.updated_at;
            const isThisRefreshing = refreshingGroup === groupKey;
            const isThisHighRefresh = highRefreshGroup === groupKey;

            return (
              <div
                key={groupKey}
                className="rounded-xl border border-[var(--theme-border)] overflow-hidden bg-[var(--theme-bg-card)] shadow-2xs"
              >
                {/* Compact Section Header */}
                <div className="px-3.5 py-2.5 bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-base">{cfg.icon}</span>
                    <h2 className="text-xs sm:text-sm font-bold text-[var(--theme-text-primary)]">
                      {cfg.label}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isLiveGroup
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      }`}
                    >
                      {isLiveGroup ? '● LIVE' : '○ Cached'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] px-1.5 py-0.5 rounded">
                      {groupData.fetched || 0}/{groupData.count || 0}
                    </span>
                    {lastUpdatedIso && (
                      <span className="text-[10px] text-[var(--theme-text-muted)] hidden sm:inline">
                        {timeAgo(lastUpdatedIso)}
                      </span>
                    )}
                  </div>

                  {/* Section-wise Small Icon Buttons: High-Refresh Pin & Instant Refresh */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setHighRefreshGroup((prev) => (prev === groupKey ? null : groupKey))
                      }
                      title={
                        isThisHighRefresh
                          ? `Disable High Refresh for ${cfg.label}`
                          : `Enable Section High Refresh for ${cfg.label} (1 call / >=10s)`
                      }
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isThisHighRefresh
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-amber-500 hover:border-amber-500/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRefreshGroup(groupKey)}
                      disabled={isCoolingDown || isThisRefreshing || isRefreshingAll}
                      title={
                        isCoolingDown
                          ? `Rate limit: wait ${cooldownSec}s (max 1 call / 10s)`
                          : `Refresh ${cfg.label}`
                      }
                      className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-600 hover:bg-teal-600 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isThisRefreshing ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Section Body: Symbol Cards Grid */}
                <div className="p-3.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                    {entries.map(([sym, info]) => {
                      const isFailed = failedSet.has(sym);
                      const pct = Number(info.change_pct) || 0;
                      const isUp = pct > 0;
                      const isDown = pct < 0;
                      const sign = isUp ? '+' : '';
                      const arrow = isUp ? '▲' : isDown ? '▼' : '−';
                      const dispSym = displaySymbol(sym);
                      const friendlyName = getSymbolDisplayName(sym);

                      return (
                        <div
                          key={`${groupKey}-${sym}`}
                          onClick={() => {
                            if (!isFailed) {
                              setModalTarget({ group: groupKey, symbol: sym });
                            }
                          }}
                          className={`relative rounded-lg p-2.5 border transition-all ${
                            isFailed
                              ? 'opacity-50 border-rose-500/25 bg-rose-500/[0.03] cursor-not-allowed'
                              : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:border-teal-600 hover:shadow-xs cursor-pointer'
                          }`}
                        >
                          {isFailed && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              N/A
                            </span>
                          )}

                          <div
                            className="text-xs sm:text-[13px] font-extrabold text-[var(--theme-text-primary)] leading-snug truncate"
                            title={friendlyName}
                          >
                            {friendlyName}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--theme-text-muted)] truncate">
                            {dispSym}
                          </div>

                          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-1">
                            {isFailed
                              ? '—'
                              : typeof info.price === 'number'
                              ? info.price.toLocaleString()
                              : info.price}
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <div
                              className={`text-[11px] font-bold font-mono tabular-nums flex items-center gap-0.5 ${
                                isUp
                                  ? 'text-emerald-600'
                                  : isDown
                                  ? 'text-rose-600'
                                  : 'text-[var(--theme-text-muted)]'
                              }`}
                            >
                              <span>{arrow}</span>
                              <span>
                                {sign}
                                {pct}%
                              </span>
                            </div>

                            <span className="text-[9px] font-mono text-[var(--theme-text-muted)] uppercase">
                              {info.currency || 'USD'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FastInfo Symbol Detail Modal */}
      {modalTarget && (
        <div
          onClick={() => setModalTarget(null)}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 sm:p-6 shadow-2xl text-[var(--theme-text-primary)]"
          >
            <button
              type="button"
              onClick={() => setModalTarget(null)}
              aria-label="Close"
              className="absolute top-4 right-4 w-7 h-7 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] hover:bg-rose-500/10 hover:text-rose-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-8 mb-3.5">
              <div className="text-xl font-extrabold text-[var(--theme-text-primary)]">
                {modalResolvedName}
              </div>
              <div className="text-xs font-mono text-[var(--theme-text-muted)] mt-0.5">
                {modalDisplayLabel}
              </div>

              {modalKnownQuote && (
                <div className="flex items-baseline gap-2.5 mt-2.5 font-mono tabular-nums">
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)]">
                    {typeof modalKnownQuote.price === 'number'
                      ? modalKnownQuote.price.toLocaleString()
                      : modalKnownQuote.price}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      modalKnownQuote.change_pct > 0
                        ? 'text-emerald-600'
                        : modalKnownQuote.change_pct < 0
                        ? 'text-rose-600'
                        : 'text-[var(--theme-text-muted)]'
                    }`}
                  >
                    {modalKnownQuote.change_pct > 0
                      ? '▲ +'
                      : modalKnownQuote.change_pct < 0
                      ? '▼ '
                      : '− '}
                    {modalKnownQuote.change_pct}%
                  </span>
                  <span className="text-xs text-[var(--theme-text-muted)]">
                    {modalKnownQuote.currency || 'USD'}
                  </span>
                </div>
              )}
            </div>

            {/* 1-Month Price SVG Line Chart */}
            <div className="my-4">
              <div className="text-[11px] text-[var(--theme-text-muted)] mb-1.5 flex items-center justify-between">
                <span>1-Month Price</span>
                {modalHistory.length > 1 && (
                  <span className="font-mono">
                    {formatDateShort(modalHistory[0].date)} →{' '}
                    {formatDateShort(modalHistory[modalHistory.length - 1].date)}
                  </span>
                )}
              </div>

              {modalLoading ? (
                <div className="py-8 flex flex-col items-center gap-2 text-xs text-[var(--theme-text-muted)]">
                  <div className="w-7 h-7 border-2 border-[var(--theme-border)] border-t-teal-600 rounded-full animate-spin" />
                  {isCoolingDown && <span>Queued (1 call / 10s rate limit)...</span>}
                </div>
              ) : modalHistory.length < 2 ? (
                <div className="py-7 text-center text-xs text-[var(--theme-text-muted)] border border-dashed border-[var(--theme-border)] rounded-xl">
                  No chart data available for this symbol
                </div>
              ) : (
                (() => {
                  const width = 600;
                  const height = 140;
                  const pad = 8;
                  const closes = modalHistory.map((p) => p.close);
                  const min = Math.min(...closes);
                  const max = Math.max(...closes);
                  const range = max - min || 1;
                  const stepX = (width - pad * 2) / (modalHistory.length - 1);
                  const coords = modalHistory.map((p, i) => {
                    const x = pad + i * stepX;
                    const y = pad + (height - pad * 2) * (1 - (p.close - min) / range);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  const up = closes[closes.length - 1] >= closes[0];
                  const color = up ? '#16a34a' : '#dc2626';
                  const area = `${pad},${height - pad} ${coords.join(' ')} ${
                    width - pad
                  },${height - pad}`;

                  return (
                    <div>
                      <svg
                        className="w-full h-36 block rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]"
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                      >
                        <polygon points={area} fill={color} opacity="0.08" />
                        <polyline
                          points={coords.join(' ')}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex justify-between text-[10.5px] font-mono text-[var(--theme-text-muted)] mt-1">
                        <span>Low {numFmt(min)}</span>
                        <span>High {numFmt(max)}</span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Extended Stats Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3.5 pt-3.5 border-t border-[var(--theme-border)]">
              {modalLoading ? (
                <div className="col-span-2 py-3 text-center text-xs text-[var(--theme-text-muted)]">
                  Loading stats...
                </div>
              ) : modalStatsRows.length === 0 ? (
                <div className="col-span-2 py-3 text-center text-xs text-[var(--theme-text-muted)]">
                  No extended stats available for this symbol
                </div>
              ) : (
                modalStatsRows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] text-[var(--theme-text-muted)] uppercase tracking-wider">
                      {row.label}
                    </span>
                    <span className="text-[13.5px] font-semibold font-mono text-[var(--theme-text-primary)]">
                      {row.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
