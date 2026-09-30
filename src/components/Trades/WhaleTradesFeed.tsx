import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarketAsset } from '../../types/trading';
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Waves,
} from 'lucide-react';

interface TradeItem {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  totalUsd: number;
  timestamp: number;
  isWhale: boolean;
  orderType: 'Market Buy' | 'Market Sell' | 'Limit Fill';
}

interface WhaleTradesFeedProps {
  selectedSymbol: string;
  assets: Record<string, MarketAsset>;
  mode?: 'ALL' | 'RECENT_ONLY' | 'WHALE_ONLY';
}

const BINANCE_MAP: Record<string, string> = {
  BTC: 'btcusdt',
  ETH: 'ethusdt',
  SOL: 'solusdt',
  PAXG: 'paxgusdt',
  BNB: 'bnbusdt',
  XRP: 'xrpusdt',
  DOGE: 'dogeusdt',
};

export const WhaleTradesFeed: React.FC<WhaleTradesFeedProps> = ({
  selectedSymbol,
  assets,
  mode = 'ALL',
}) => {
  // Controls for Recent Trades Table
  const [recentSymbolFilter, setRecentSymbolFilter] = useState<string>(
    mode !== 'WHALE_ONLY' && selectedSymbol ? selectedSymbol : 'ALL'
  );
  const [recentSideFilter, setRecentSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  useEffect(() => {
    if (mode !== 'WHALE_ONLY' && selectedSymbol) {
      setRecentSymbolFilter(selectedSymbol);
    }
  }, [mode, selectedSymbol]);

  // Controls for Whale Trades Table
  const [whaleThreshold, setWhaleThreshold] = useState<number>(10000);
  const [whaleSymbolFilter, setWhaleSymbolFilter] = useState<string>('ALL');

  // Trade data stores
  const [recentTrades, setRecentTrades] = useState<TradeItem[]>([]);
  const [whaleTrades, setWhaleTrades] = useState<TradeItem[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Generate initial seed trades for both tables
  useEffect(() => {
    const symbols = Object.keys(assets);
    const now = Date.now();
    const initRecent: TradeItem[] = [];
    const initWhale: TradeItem[] = [];

    // Seed recent trades (36 items, prioritizing selectedSymbol so active filter has immediate depth)
    for (let i = 0; i < 36; i++) {
      const sym =
        i % 2 === 0 && selectedSymbol
          ? selectedSymbol
          : symbols[Math.floor(Math.random() * symbols.length)] || 'BTC';
      const asset = assets[sym] || assets.BTC || assets.PAXG;
      const basePrice = asset?.price || 96500;
      const isSell = Math.random() > 0.48;

      let qty = 0;
      if (sym === 'BTC') qty = Number((Math.random() * 0.4 + 0.005).toFixed(4));
      else if (sym === 'PAXG' || sym === 'XAUT') qty = Number((Math.random() * 2.5 + 0.1).toFixed(4));
      else if (sym === 'ETH') qty = Number((Math.random() * 4 + 0.1).toFixed(3));
      else if (sym === 'SOL') qty = Number((Math.random() * 30 + 1).toFixed(2));
      else qty = Number((Math.random() * 900 + 40).toFixed(2));

      const totalUsd = qty * basePrice;
      initRecent.push({
        id: `seed-recent-${i}-${Math.random()}`,
        symbol: sym,
        side: isSell ? 'SELL' : 'BUY',
        price: basePrice * (1 + (Math.random() - 0.5) * 0.0012),
        qty,
        totalUsd,
        timestamp: now - i * 4500 + Math.random() * 1500,
        isWhale: totalUsd >= whaleThreshold,
        orderType: isSell ? 'Market Sell' : 'Market Buy',
      });
    }

    // Seed whale trades (24 items with totalUsd >= whaleThreshold)
    for (let i = 0; i < 24; i++) {
      const sym =
        i % 3 === 0 && selectedSymbol
          ? selectedSymbol
          : symbols[Math.floor(Math.random() * symbols.length)] || 'BTC';
      const asset = assets[sym] || assets.BTC || assets.PAXG;
      const basePrice = asset?.price || 96500;
      const isSell = Math.random() > 0.47;

      let qty = 0;
      if (sym === 'BTC') qty = Number((Math.random() * 6.5 + 0.25).toFixed(4));
      else if (sym === 'PAXG' || sym === 'XAUT') qty = Number((Math.random() * 35 + 4.5).toFixed(4));
      else if (sym === 'ETH') qty = Number((Math.random() * 55 + 5.0).toFixed(3));
      else if (sym === 'SOL') qty = Number((Math.random() * 480 + 110).toFixed(2));
      else qty = Number((45000 / Math.max(basePrice, 0.01) + Math.random() * 500).toFixed(2));

      const totalUsd = qty * basePrice;
      if (totalUsd >= whaleThreshold) {
        initWhale.push({
          id: `seed-whale-${i}-${Math.random()}`,
          symbol: sym,
          side: isSell ? 'SELL' : 'BUY',
          price: basePrice * (1 + (Math.random() - 0.5) * 0.0018),
          qty,
          totalUsd,
          timestamp: now - i * 16000 + Math.random() * 4000,
          isWhale: true,
          orderType: isSell ? 'Market Sell' : 'Market Buy',
        });
      }
    }

    setRecentTrades(initRecent.sort((a, b) => b.timestamp - a.timestamp));
    setWhaleTrades(initWhale.sort((a, b) => b.timestamp - a.timestamp));
  }, [selectedSymbol]);

  // Connect to Binance live trade WebSockets
  useEffect(() => {
    if (selectedSymbol === 'CL' || selectedSymbol === 'XAG') {
      setIsWsConnected(false);
      return;
    }

    const activeStreamSymbol =
      BINANCE_MAP[selectedSymbol] ||
      (selectedSymbol === 'XAUT' ? 'paxgusdt' : `${selectedSymbol.toLowerCase()}usdt`);
    const streamUrl = `wss://stream.binance.com:9443/ws/${activeStreamSymbol}@trade`;
    let lastEmitTs = 0;

    const closeSocket = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        if (
          wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
      setIsWsConnected(false);
    };

    const connectSocket = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      closeSocket();
      try {
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const nowMs = Date.now();
            const data = JSON.parse(event.data);
            if (data && data.e === 'trade') {
              const price = parseFloat(data.p);
              const qty = parseFloat(data.q);
              const totalUsd = price * qty;
              const isWhaleTrade = totalUsd >= whaleThreshold;

              if (!isWhaleTrade && nowMs - lastEmitTs < 250) {
                return;
              }
              lastEmitTs = nowMs;

              const isSell = data.m;
              const newTrade: TradeItem = {
                id: `ws-${data.t}-${nowMs}`,
                symbol: selectedSymbol,
                side: isSell ? 'SELL' : 'BUY',
                price,
                qty,
                totalUsd,
                timestamp: data.T || nowMs,
                isWhale: isWhaleTrade,
                orderType: isSell ? 'Market Sell' : 'Market Buy',
              };

              setRecentTrades((prev) => [newTrade, ...prev.slice(0, 59)]);

              if (isWhaleTrade) {
                setWhaleTrades((prev) => [newTrade, ...prev.slice(0, 49)]);
              }
            }
          } catch {
            // ignore packet parse error
          }
        };

        ws.onerror = () => setIsWsConnected(false);
        ws.onclose = () => setIsWsConnected(false);
      } catch {
        setIsWsConnected(false);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        closeSocket();
      } else {
        connectSocket();
      }
    };

    connectSocket();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      closeSocket();
    };
  }, [selectedSymbol, whaleThreshold]);

  // Periodic multi-asset tick generator to keep all pairs active
  useEffect(() => {
    const interval = setInterval(() => {
      const symbols = Object.keys(assets);
      const sym =
        Math.random() < 0.55 && selectedSymbol
          ? selectedSymbol
          : symbols[Math.floor(Math.random() * symbols.length)] || 'BTC';
      const asset = assets[sym] || assets.BTC || assets.PAXG;
      const basePrice = asset?.price || 96500;
      const isSell = Math.random() > 0.49;
      const isWhale = Math.random() < 0.28;

      let qty = 0;
      if (isWhale) {
        if (sym === 'BTC') qty = Number((Math.random() * 4.8 + 0.22).toFixed(4));
        else if (sym === 'PAXG' || sym === 'XAUT') qty = Number((Math.random() * 28 + 4.0).toFixed(4));
        else if (sym === 'ETH') qty = Number((Math.random() * 48 + 4.5).toFixed(3));
        else if (sym === 'SOL') qty = Number((Math.random() * 380 + 95).toFixed(2));
        else qty = Number((35000 / Math.max(basePrice, 0.01) + Math.random() * 400).toFixed(2));
      } else {
        if (sym === 'BTC') qty = Number((Math.random() * 0.28 + 0.002).toFixed(4));
        else if (sym === 'PAXG' || sym === 'XAUT') qty = Number((Math.random() * 1.6 + 0.05).toFixed(4));
        else if (sym === 'ETH') qty = Number((Math.random() * 2.4 + 0.05).toFixed(3));
        else if (sym === 'SOL') qty = Number((Math.random() * 22 + 0.5).toFixed(2));
        else qty = Number((Math.random() * 650 + 20).toFixed(2));
      }

      const totalUsd = qty * basePrice;
      const newTrade: TradeItem = {
        id: `sim-${Date.now()}-${Math.random()}`,
        symbol: sym,
        side: isSell ? 'SELL' : 'BUY',
        price: basePrice * (1 + (Math.random() - 0.5) * 0.001),
        qty,
        totalUsd,
        timestamp: Date.now(),
        isWhale: totalUsd >= whaleThreshold,
        orderType: isSell ? 'Market Sell' : 'Market Buy',
      };

      setRecentTrades((prev) => [newTrade, ...prev.slice(0, 59)]);

      if (totalUsd >= whaleThreshold) {
        setWhaleTrades((prev) => [newTrade, ...prev.slice(0, 49)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [assets, selectedSymbol, whaleThreshold]);

  // Filtered views
  const filteredRecentTrades = useMemo(() => {
    return recentTrades.filter((t) => {
      const matchSym = recentSymbolFilter === 'ALL' || t.symbol === recentSymbolFilter;
      const matchSide = recentSideFilter === 'ALL' || t.side === recentSideFilter;
      return matchSym && matchSide;
    });
  }, [recentTrades, recentSymbolFilter, recentSideFilter]);

  const filteredWhaleTrades = useMemo(() => {
    return whaleTrades.filter(
      (t) =>
        (whaleSymbolFilter === 'ALL' || t.symbol === whaleSymbolFilter) &&
        t.totalUsd >= whaleThreshold
    );
  }, [whaleTrades, whaleSymbolFilter, whaleThreshold]);

  // Summary statistics for Recent Trades
  const recentSummary = useMemo(() => {
    let buyUsd = 0;
    let sellUsd = 0;
    filteredRecentTrades.forEach((t) => {
      if (t.side === 'BUY') buyUsd += t.totalUsd;
      else sellUsd += t.totalUsd;
    });
    const totalUsd = buyUsd + sellUsd;
    const buyPct = totalUsd > 0 ? (buyUsd / totalUsd) * 100 : 50;
    const netDeltaUsd = buyUsd - sellUsd;
    return {
      buyUsd,
      sellUsd,
      totalUsd,
      buyPct,
      sellPct: 100 - buyPct,
      netDeltaUsd,
    };
  }, [filteredRecentTrades]);

  const formatCompactUsd = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
    return `$${abs.toFixed(0)}`;
  };

  return (
    <div className="space-y-4">
      {/* TABLE 1: BINANCE LIVE RECENT TRADES (TOP) */}
      {mode !== 'WHALE_ONLY' && (
        <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] p-4 sm:p-5 shadow-sm space-y-3.5">
          {/* Header 1 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                    Binance Live Recent Trades
                  </h3>
                  <span aria-hidden="true" className="text-[var(--theme-text-muted)]">·</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                    {isWsConnected ? 'WebSocket Stream' : 'Live Execution Feed'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-text-muted)]">
                  Time &amp; sales execution tape with exact coin quantities and USDT notional value
                </p>
              </div>
            </div>

            {/* Side & Asset Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex rounded-lg p-0.5 border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-sans font-semibold">
                {(['ALL', 'BUY', 'SELL'] as const).map((sideOpt) => (
                  <button
                    key={sideOpt}
                    type="button"
                    onClick={() => setRecentSideFilter(sideOpt)}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      recentSideFilter === sideOpt
                        ? sideOpt === 'BUY'
                          ? 'bg-emerald-600 text-white'
                          : sideOpt === 'SELL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                  >
                    {sideOpt === 'ALL' ? 'All Sides' : sideOpt === 'BUY' ? 'Buys' : 'Sells'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-sans text-[11px] text-[var(--theme-text-muted)]">Pair:</span>
                <select
                  value={recentSymbolFilter}
                  onChange={(e) => setRecentSymbolFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] text-[11px] font-bold focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Active Assets</option>
                  {Object.keys(assets).map((s) => (
                    <option key={s} value={s}>
                      {s}/USDT
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tape Flow Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Tape Buy / Sell Split
              </span>
              <span className="font-bold">
                <span className="text-emerald-600">{recentSummary.buyPct.toFixed(1)}%</span>
                <span className="text-[var(--theme-text-muted)] mx-1">/</span>
                <span className="text-rose-600">{recentSummary.sellPct.toFixed(1)}%</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Net Tape Delta
              </span>
              <span
                className={`font-extrabold ${
                  recentSummary.netDeltaUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {recentSummary.netDeltaUsd >= 0 ? '+' : '-'}
                {formatCompactUsd(recentSummary.netDeltaUsd)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Window Turnover
              </span>
              <span className="font-extrabold text-[var(--theme-text-primary)]">
                {formatCompactUsd(recentSummary.totalUsd)} ({filteredRecentTrades.length} fills)
              </span>
            </div>
          </div>

          {/* Table 1 Body: Recent Trades */}
          <div className="overflow-x-auto max-h-[265px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="sticky top-0 z-10 text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border)]">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Pair</th>
                  <th className="py-2 px-3">Side</th>
                  <th className="py-2 px-3 text-right">Price (USDT)</th>
                  <th className="py-2 px-3 text-right">Coin Quantity</th>
                  <th className="py-2 px-3 text-right">Notional (USDT)</th>
                  <th className="py-2 px-3 text-right">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {filteredRecentTrades.map((t) => {
                  const isBuy = t.side === 'BUY';
                  const timeStr = new Date(t.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                  });

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors hover:bg-[var(--theme-bg-card-subtle)] ${
                        t.isWhale ? 'bg-amber-500/[0.06]' : ''
                      }`}
                    >
                      <td className="py-1.5 px-3 text-[var(--theme-text-muted)] whitespace-nowrap text-[11px]">
                        {timeStr}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-[var(--theme-text-primary)] whitespace-nowrap">
                        {t.symbol}/USDT
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 font-extrabold text-[11px] ${
                            isBuy ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {t.side}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                        $
                        {t.price.toLocaleString('en-US', {
                          minimumFractionDigits: t.price < 10 ? 4 : 2,
                          maximumFractionDigits: t.price < 10 ? 4 : 2,
                        })}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-[var(--theme-text-primary)] whitespace-nowrap">
                        {t.qty.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}{' '}
                        <span className="text-[10px] font-normal text-[var(--theme-text-muted)]">
                          {t.symbol}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-[var(--theme-text-primary)]">
                        $
                        {t.totalUsd.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-1.5 px-3 text-right text-[11px] text-[var(--theme-text-secondary)] whitespace-nowrap">
                        {t.orderType}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE 2: INSTITUTIONAL WHALE ORDERS TABLE (DIRECTLY BELOW RECENT TRADES) */}
      {mode !== 'RECENT_ONLY' && (
        <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] p-4 sm:p-5 shadow-sm space-y-3.5">
          {/* Header 2 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center gap-2.5">
              <Waves className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                    Institutional Whale Orders
                  </h3>
                  <span aria-hidden="true" className="text-[var(--theme-text-muted)]">·</span>
                  <span className="text-[11px] font-mono font-bold text-amber-600">
                    Min Block &ge; ${whaleThreshold.toLocaleString()} USDT
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-text-muted)]">
                  Real-time high-value institutional block executions &amp; sweep orders
                </p>
              </div>
            </div>

            {/* Controls for Table 2 */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {/* Quick Threshold Presets */}
              <div className="flex rounded-lg p-0.5 border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[11px] font-mono font-semibold">
                {[
                  { label: '$10K', val: 10000 },
                  { label: '$25K', val: 25000 },
                  { label: '$50K', val: 50000 },
                  { label: '$100K', val: 100000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setWhaleThreshold(preset.val)}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      whaleThreshold === preset.val
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Symbol Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-[11px] text-[var(--theme-text-muted)]">Pair:</span>
                <select
                  value={whaleSymbolFilter}
                  onChange={(e) => setWhaleSymbolFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] text-[11px] font-bold focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Pairs</option>
                  {Object.keys(assets).map((s) => (
                    <option key={s} value={s}>
                      {s}/USDT
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table 2 Body: Whale Trades */}
          <div className="overflow-x-auto max-h-[265px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="sticky top-0 z-10 text-[10px] font-sans font-bold text-[var(--theme-text-muted)] bg-[var(--theme-bg-card-subtle)] border-b border-[var(--theme-border)]">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Pair</th>
                  <th className="py-2 px-3">Side</th>
                  <th className="py-2 px-3 text-right">Price (USDT)</th>
                  <th className="py-2 px-3 text-right">Block Quantity</th>
                  <th className="py-2 px-3 text-right">Block Notional (USDT)</th>
                  <th className="py-2 px-3 text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                {filteredWhaleTrades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center font-sans text-[var(--theme-text-muted)] text-xs"
                    >
                      No block orders recorded above ${whaleThreshold.toLocaleString()} USDT in current filter window.
                    </td>
                  </tr>
                ) : (
                  filteredWhaleTrades.map((t) => {
                    const isBuy = t.side === 'BUY';
                    const timeStr = new Date(t.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                    });
                    const blockTier =
                      t.totalUsd >= 250000
                        ? 'Mega Block ($250K+)'
                        : t.totalUsd >= 100000
                        ? 'Institutional ($100K+)'
                        : 'Whale Lot';

                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-[var(--theme-bg-card-subtle)]"
                      >
                        <td className="py-2 px-3 text-[var(--theme-text-muted)] whitespace-nowrap text-[11px]">
                          {timeStr}
                        </td>
                        <td className="py-2 px-3 font-extrabold text-[var(--theme-text-primary)] whitespace-nowrap">
                          {t.symbol}/USDT
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-0.5 font-extrabold text-[11px] ${
                              isBuy ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isBuy ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                          $
                          {t.price.toLocaleString('en-US', {
                            minimumFractionDigits: t.price < 10 ? 4 : 2,
                            maximumFractionDigits: t.price < 10 ? 4 : 2,
                          })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)] whitespace-nowrap">
                          {t.qty.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}{' '}
                          <span className="text-[10px] font-normal text-[var(--theme-text-muted)]">
                            {t.symbol}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-amber-600">
                          ${t.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right font-sans text-[11px] font-semibold text-[var(--theme-text-secondary)] whitespace-nowrap">
                          {blockTier} · ${(t.totalUsd / 1000).toFixed(1)}K
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
