import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export type SelectedCurrency = 'USD' | 'INR';

const STORAGE_KEY_CURRENCY = 'aurumx_selected_currency_v2';
const STORAGE_KEY_USD_INR_RATE = 'aurumx_usd_inr_rate_v2';
const SYNC_EVENT_NAME = 'aurumx-inr-currency-sync';

export const DEFAULT_USD_INR_RATE = 86.65;

// Module-level cache for live USD/INR rate so all mounted hooks share the latest live rate
let cachedLiveUsdInrRate: number = readInitialUsdInrRate();
let cachedRateIsLive = false;
let lastFetchTimestamp = 0;
let activeFetchPromise: Promise<number | null> | null = null;

function readInitialCurrency(): SelectedCurrency {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (raw === 'INR' || raw === 'USD') return raw;
    return 'USD'; // Default is $ (USD)
  } catch {
    return 'USD';
  }
}

function readInitialUsdInrRate(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USD_INR_RATE);
    if (raw !== null) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_USD_INR_RATE;
  } catch {
    return DEFAULT_USD_INR_RATE;
  }
}

export function updateLiveUsdInrFromSnapshot(rate: number): void {
  if (!Number.isFinite(rate) || rate <= 40 || rate >= 200) return;
  cachedLiveUsdInrRate = Number(rate.toFixed(2));
  cachedRateIsLive = true;
  lastFetchTimestamp = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY_USD_INR_RATE, String(cachedLiveUsdInrRate));
  } catch {
    // ignore storage error
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }
}

export async function fetchLiveUsdInrRate(force = false): Promise<number> {
  const now = Date.now();
  if (!force && cachedRateIsLive && now - lastFetchTimestamp < 45_000) {
    return cachedLiveUsdInrRate;
  }
  if (activeFetchPromise) {
    const res = await activeFetchPromise;
    return res ?? cachedLiveUsdInrRate;
  }

  activeFetchPromise = (async () => {
    const endpoints = [
      {
        url: 'https://open.er-api.com/v6/latest/USD',
        extract: (data: any) => data?.rates?.INR,
      },
      {
        url: 'https://api.frankfurter.app/latest?from=USD&to=INR',
        extract: (data: any) => data?.rates?.INR,
      },
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(ep.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          const rate = Number(ep.extract(json));
          if (Number.isFinite(rate) && rate > 40 && rate < 200) {
            updateLiveUsdInrFromSnapshot(rate);
            return cachedLiveUsdInrRate;
          }
        }
      } catch {
        // Try next endpoint
      }
    }
    return null;
  })();

  try {
    const result = await activeFetchPromise;
    return result ?? cachedLiveUsdInrRate;
  } finally {
    activeFetchPromise = null;
  }
}

export function formatUsdToInr(
  usdAmount: number,
  rate: number = cachedLiveUsdInrRate || DEFAULT_USD_INR_RATE,
  options?: { signed?: boolean; decimals?: number }
): string {
  const safeUsd = Number.isFinite(usdAmount) ? usdAmount : 0;
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_INR_RATE;
  const inrVal = safeUsd * safeRate;
  const absInr = Math.abs(inrVal);

  let decimals = options?.decimals;
  if (decimals === undefined) {
    if (absInr === 0) decimals = 2;
    else if (absInr < 1) decimals = 4;
    else decimals = 2;
  }

  const formattedAbs = absInr.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options?.signed) {
    const sign = inrVal > 0 ? '+' : inrVal < 0 ? '-' : '+';
    return `${sign}\u20B9${formattedAbs}`;
  }

  return `${inrVal < 0 ? '-' : ''}\u20B9${formattedAbs}`;
}

export function formatUsdAmount(
  usdAmount: number,
  options?: { signed?: boolean; decimals?: number; usdDecimals?: number }
): string {
  const safeUsd = Number.isFinite(usdAmount) ? usdAmount : 0;
  const absUsd = Math.abs(safeUsd);

  let decimals = options?.usdDecimals ?? options?.decimals;
  if (decimals === undefined) {
    if (absUsd === 0) decimals = 2;
    else if (absUsd < 1) decimals = 4;
    else decimals = 2;
  }

  const formattedAbs = absUsd.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options?.signed) {
    const sign = safeUsd > 0 ? '+' : safeUsd < 0 ? '-' : '+';
    return `${sign}$${formattedAbs}`;
  }

  return `${safeUsd < 0 ? '-' : ''}$${formattedAbs}`;
}

export function useInrCurrency() {
  const [currency, setCurrencyState] = useState<SelectedCurrency>(readInitialCurrency);
  const [usdInrRate, setUsdInrRateState] = useState<number>(() => cachedLiveUsdInrRate || readInitialUsdInrRate());
  const [isLiveRate, setIsLiveRate] = useState<boolean>(cachedRateIsLive);

  useEffect(() => {
    const handleSync = () => {
      setCurrencyState(readInitialCurrency());
      setUsdInrRateState(cachedLiveUsdInrRate || readInitialUsdInrRate());
      setIsLiveRate(cachedRateIsLive);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);

    // Fetch live USD/INR rate on mount and refresh every 60s
    fetchLiveUsdInrRate(false);
    const interval = setInterval(() => {
      fetchLiveUsdInrRate(true);
    }, 60_000);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
    };
  }, []);

  const setCurrency = useCallback((next: SelectedCurrency | ((prev: SelectedCurrency) => SelectedCurrency)) => {
    setCurrencyState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY_CURRENCY, resolved);
      } catch {
        // ignore storage error
      }
      if (resolved === 'INR') {
        fetchLiveUsdInrRate(true);
      }
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
      return resolved;
    });
  }, []);

  const showInr = currency === 'INR';

  const setShowInr = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setCurrency((prevCurr) => {
        const prevBool = prevCurr === 'INR';
        const resolvedBool = typeof next === 'function' ? next(prevBool) : next;
        return resolvedBool ? 'INR' : 'USD';
      });
    },
    [setCurrency]
  );

  const setUsdInrRate = useCallback((nextRate: number) => {
    const clean = !isNaN(nextRate) && nextRate > 0 ? nextRate : DEFAULT_USD_INR_RATE;
    cachedLiveUsdInrRate = clean;
    setUsdInrRateState(clean);
    try {
      localStorage.setItem(STORAGE_KEY_USD_INR_RATE, String(clean));
    } catch {
      // ignore storage error
    }
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }, []);

  const refreshLiveRate = useCallback(async () => {
    return await fetchLiveUsdInrRate(true);
  }, []);

  const toInr = useCallback(
    (usdAmount: number) => (Number.isFinite(usdAmount) ? usdAmount * usdInrRate : 0),
    [usdInrRate]
  );

  const convertValue = useCallback(
    (usdAmount: number) => {
      if (!Number.isFinite(usdAmount)) return 0;
      return showInr ? usdAmount * usdInrRate : usdAmount;
    },
    [showInr, usdInrRate]
  );

  const formatInr = useCallback(
    (usdAmount: number, options?: { signed?: boolean; decimals?: number }) =>
      formatUsdToInr(usdAmount, usdInrRate, options),
    [usdInrRate]
  );

  const formatCurrency = useCallback(
    (
      usdAmount: number,
      options?: { signed?: boolean; decimals?: number; usdDecimals?: number; inrDecimals?: number }
    ) => {
      if (showInr) {
        return formatUsdToInr(usdAmount, usdInrRate, {
          signed: options?.signed,
          decimals: options?.inrDecimals ?? options?.decimals,
        });
      }
      return formatUsdAmount(usdAmount, {
        signed: options?.signed,
        decimals: options?.usdDecimals ?? options?.decimals,
      });
    },
    [showInr, usdInrRate]
  );

  return {
    currency,
    setCurrency,
    showInr,
    setShowInr,
    usdInrRate,
    setUsdInrRate,
    isLiveRate,
    refreshLiveRate,
    toInr,
    convertValue,
    formatInr,
    formatCurrency,
    currencySymbol: showInr ? '\u20B9' : '$',
    currencyLabel: showInr ? 'INR' : 'USD',
  };
}

interface InrCurrencyToggleProps {
  compact?: boolean;
}

export const InrCurrencyToggle: React.FC<InrCurrencyToggleProps> = ({ compact = false }) => {
  const { currency, setCurrency, showInr, usdInrRate, isLiveRate, refreshLiveRate } = useInrCurrency();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLiveRate();
    setTimeout(() => setIsRefreshing(false), 350);
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-mono"
      title="Select currency ($ USD or ₹ INR) for Trade Value, Margin, Fees, and Return"
    >
      <span className="text-[10px] font-sans font-semibold text-[var(--theme-text-muted)] pl-1 hidden sm:inline">
        Currency:
      </span>
      <div className="inline-flex rounded-md p-0.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]">
        <button
          type="button"
          onClick={() => setCurrency('USD')}
          className={`px-2 py-0.5 rounded text-[10px] font-sans font-extrabold transition-colors cursor-pointer ${
            currency === 'USD'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          $ (USD)
        </button>
        <button
          type="button"
          onClick={() => setCurrency('INR')}
          className={`px-2 py-0.5 rounded text-[10px] font-sans font-extrabold transition-colors cursor-pointer ${
            currency === 'INR'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          &#8377; (INR)
        </button>
      </div>

      {showInr && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold pr-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveRate ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
            title={isLiveRate ? 'Live USD/INR Exchange Rate Connected' : 'Fallback USD/INR Rate'}
          />
          <span>1$=&#8377;{usdInrRate.toFixed(2)}</span>
          {!compact && (
            <button
              type="button"
              onClick={handleRefresh}
              className="p-0.5 rounded hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-emerald-600 cursor-pointer"
              title="Refresh live USD/INR exchange rate"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
