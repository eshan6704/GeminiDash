import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_SHOW_INR = 'aurumx_show_inr_v1';
const STORAGE_KEY_USD_INR_RATE = 'aurumx_usd_inr_rate_v1';
const SYNC_EVENT_NAME = 'aurumx-inr-currency-sync';

export const DEFAULT_USD_INR_RATE = 86.5;

function readInitialShowInr(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHOW_INR);
    if (raw === null) return true; // Enabled by default so user can view all derived values in INR
    return raw === 'true';
  } catch {
    return true;
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

export function formatUsdToInr(
  usdAmount: number,
  rate: number = DEFAULT_USD_INR_RATE,
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
    else if (absInr < 10) decimals = 2;
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

export function useInrCurrency() {
  const [showInr, setShowInrState] = useState<boolean>(readInitialShowInr);
  const [usdInrRate, setUsdInrRateState] = useState<number>(readInitialUsdInrRate);

  useEffect(() => {
    const handleSync = () => {
      setShowInrState(readInitialShowInr());
      setUsdInrRateState(readInitialUsdInrRate());
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setShowInr = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setShowInrState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY_SHOW_INR, String(resolved));
      } catch {
        // ignore storage error
      }
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
      return resolved;
    });
  }, []);

  const setUsdInrRate = useCallback((nextRate: number) => {
    const clean = !isNaN(nextRate) && nextRate > 0 ? nextRate : DEFAULT_USD_INR_RATE;
    setUsdInrRateState(clean);
    try {
      localStorage.setItem(STORAGE_KEY_USD_INR_RATE, String(clean));
    } catch {
      // ignore storage error
    }
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }, []);

  const toInr = useCallback(
    (usdAmount: number) => (Number.isFinite(usdAmount) ? usdAmount * usdInrRate : 0),
    [usdInrRate]
  );

  const formatInr = useCallback(
    (usdAmount: number, options?: { signed?: boolean; decimals?: number }) =>
      formatUsdToInr(usdAmount, usdInrRate, options),
    [usdInrRate]
  );

  return {
    showInr,
    setShowInr,
    usdInrRate,
    setUsdInrRate,
    toInr,
    formatInr,
  };
}

interface InrCurrencyToggleProps {
  compact?: boolean;
}

export const InrCurrencyToggle: React.FC<InrCurrencyToggleProps> = ({ compact = false }) => {
  const { showInr, setShowInr, usdInrRate, setUsdInrRate } = useInrCurrency();
  const [rateInput, setRateInput] = useState<string>(usdInrRate.toString());

  useEffect(() => {
    setRateInput(usdInrRate.toString());
  }, [usdInrRate]);

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-mono">
      <button
        type="button"
        onClick={() => setShowInr((prev) => !prev)}
        className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
          showInr
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border-subtle)]'
        }`}
        title="Enable or disable Indian Rupee (₹ INR) conversion for Trade Value, Return/PnL, Fees, and Margin across all simulators"
      >
        <span>&#8377; INR: {showInr ? 'ON' : 'OFF'}</span>
      </button>

      {showInr && !compact && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--theme-text-secondary)]">
          <span>1$=&#8377;</span>
          <input
            type="number"
            min="1"
            step="0.5"
            value={rateInput}
            onChange={(e) => {
              setRateInput(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                setUsdInrRate(val);
              }
            }}
            className="w-12 px-1 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-bold text-[10px] focus:outline-none focus:border-emerald-600"
            title="USD to INR Conversion Rate"
          />
        </div>
      )}
    </div>
  );
};
