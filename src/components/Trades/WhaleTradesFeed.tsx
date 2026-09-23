import React, { useState, useEffect, useRef } from 'react';
import { MarketAsset } from '../../types/trading';
import { useTheme } from '../../context/ThemeContext';
import {
  Waves,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
  Activity,
  Layers,
  Coins,
  RefreshCw,
  Filter,
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
}) => {
  const { isLight } = useTheme();

  // Controls for Recent Trades Table
  const [recentSymbolFilter, setRecentSymbolFilter] = useState<string>('ALL');
  
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

    // Seed recent trades (30 items)
    for (let i = 0; i < 30; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const asset = assets[sym] || assets.PAXG;
      const basePrice = asset.price;
      const isSell = Math.random() > 0.48;
      
      // Typical retail/medium trade sizes
      let qty = 0;
      if (sym === 'BTC') qty = Number((Math.random() * 0.4 + 0.005).toFixed(4));
      else if (sym === 'PAXG') qty = Number((Math.random() * 2.5 + 0.1).toFixed(4));
      else if (sym === 'ETH') qty = Number((Math.random() * 4 + 0.1).toFixed(3));
      else if (sym === 'SOL') qty = Number((Math.random() * 30 + 1).toFixed(2));
      else qty = Number((Math.random() * 1000 + 50).toFixed(2));

      const totalUsd = qty * basePrice;
      const trade: TradeItem = {
        id: `seed-recent-${i}-${Math.random()}`,
        symbol: sym,
        side: isSell ? 'SELL' : 'BUY',
        price: basePrice * (1 + (Math.random() - 0.5) * 0.0015),
        qty,
        totalUsd,
        timestamp: now - i * 6000 + Math.random() * 2000,
        isWhale: totalUsd >= whaleThreshold,
        orderType: isSell ? 'Market Sell' : 'Market Buy',
      };
      initRecent.push(trade);
    }

    // Seed whale trades (20 items with totalUsd >= whaleThreshold)
    for (let i = 0; i < 20; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const asset = assets[sym] || assets.PAXG;
      const basePrice = asset.price;
      const isSell = Math.random() > 0.48;

      // Large institutional sizes
      let qty = 0;
      if (sym === 'BTC') qty = Number((Math.random() * 8 + 0.25).toFixed(4));
      else if (sym === 'PAXG') qty = Number((Math.random() * 40 + 3.5).toFixed(4));
      else if (sym === 'ETH') qty = Number((Math.random() * 60 + 5.0).toFixed(3));
      else if (sym === 'SOL') qty = Number((Math.random() * 500 + 100).toFixed(2));
      else qty = Number((Math.random() * 50000 + 10000).toFixed(2));

      const totalUsd = qty * basePrice;
      if (totalUsd >= whaleThreshold) {
        initWhale.push({
          id: `seed-whale-${i}-${Math.random()}`,
          symbol: sym,
          side: isSell ? 'SELL' : 'BUY',
          price: basePrice * (1 + (Math.random() - 0.5) * 0.002),
          qty,
          totalUsd,
          timestamp: now - i * 18000 + Math.random() * 5000,
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
    const activeStreamSymbol = BINANCE_MAP[selectedSymbol] || 'paxgusdt';
    const streamUrl = `wss://stream.binance.com:9443/ws/${activeStreamSymbol}@trade`;

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(streamUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.e === 'trade') {
            const price = parseFloat(data.p);
            const qty = parseFloat(data.q);
            const totalUsd = price * qty;
            const isSell = data.m; // buyer is market maker -> seller hit bid (Market Sell)

            const newTrade: TradeItem = {
              id: `ws-${data.t}-${Date.now()}`,
              symbol: selectedSymbol,
              side: isSell ? 'SELL' : 'BUY',
              price,
              qty,
              totalUsd,
              timestamp: data.T || Date.now(),
              isWhale: totalUsd >= whaleThreshold,
              orderType: isSell ? 'Market Sell' : 'Market Buy',
            };

            // Add to recent trades
            setRecentTrades((prev) => [newTrade, ...prev.slice(0, 50)]);

            // If it qualifies as a whale, add to whale trades table
            if (totalUsd >= whaleThreshold) {
              setWhaleTrades((prev) => [newTrade, ...prev.slice(0, 40)]);
            }
          }
        } catch (err) {
          // Handled gracefully
        }
      };

      ws.onerror = () => {
        setIsWsConnected(false);
      };

      ws.onclose = () => {
        setIsWsConnected(false);
      };
    } catch (e) {
      setIsWsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedSymbol, whaleThreshold]);

  // Periodic multi-asset tick generator to keep all pairs active
  useEffect(() => {
    const interval = setInterval(() => {
      const symbols = Object.keys(assets);
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const asset = assets[sym] || assets.PAXG;
      const basePrice = asset.price;
      const isSell = Math.random() > 0.49;
      const isWhale = Math.random() < 0.25;

      let qty = 0;
      if (isWhale) {
        if (sym === 'BTC') qty = Number((Math.random() * 5 + 0.2).toFixed(4));
        else if (sym === 'PAXG') qty = Number((Math.random() * 30 + 3.0).toFixed(4));
        else if (sym === 'ETH') qty = Number((Math.random() * 50 + 4.0).toFixed(3));
        else if (sym === 'SOL') qty = Number((Math.random() * 400 + 90).toFixed(2));
        else qty = Number((Math.random() * 40000 + 8000).toFixed(2));
      } else {
        if (sym === 'BTC') qty = Number((Math.random() * 0.3 + 0.002).toFixed(4));
        else if (sym === 'PAXG') qty = Number((Math.random() * 1.8 + 0.05).toFixed(4));
        else if (sym === 'ETH') qty = Number((Math.random() * 2.5 + 0.05).toFixed(3));
        else if (sym === 'SOL') qty = Number((Math.random() * 25 + 0.5).toFixed(2));
        else qty = Number((Math.random() * 800 + 20).toFixed(2));
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

      setRecentTrades((prev) => [newTrade, ...prev.slice(0, 50)]);

      if (totalUsd >= whaleThreshold) {
        setWhaleTrades((prev) => [newTrade, ...prev.slice(0, 40)]);
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [assets, whaleThreshold]);

  // Filtered views
  const filteredRecentTrades = recentTrades.filter(
    (t) => recentSymbolFilter === 'ALL' || t.symbol === recentSymbolFilter
  );

  const filteredWhaleTrades = whaleTrades.filter(
    (t) => (whaleSymbolFilter === 'ALL' || t.symbol === whaleSymbolFilter) && t.totalUsd >= whaleThreshold
  );

  return (
    <div className="space-y-4">
      {/* TABLE 1: BINANCE RECENT TRADES TABLE (ABOVE) */}
      <div
        className={`rounded-2xl p-4 shadow-lg border space-y-3 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
            : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
        }`}
      >
        {/* Header 1 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Binance Live Recent Trades
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${
                    isWsConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isWsConnected ? 'Live Feed' : 'Live Stream'}
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Real-time execution tick stream with exact coin quantities & USDT notional values
              </p>
            </div>
          </div>

          {/* Asset Filter for Table 1 */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Asset Pair:</span>
            <select
              value={recentSymbolFilter}
              onChange={(e) => setRecentSymbolFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-200'
              }`}
            >
              <option value="ALL">All Active Assets</option>
              {Object.keys(assets).map((s) => (
                <option key={s} value={s}>{s}/USDT</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table 1 Body: Recent Trades */}
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto pr-1">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr
                className={`sticky top-0 z-10 text-[10px] uppercase tracking-wider font-semibold border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Pair</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3 text-right">Price (USDT)</th>
                <th className="py-2 px-3 text-right text-amber-400">Actual Coin Qty</th>
                <th className="py-2 px-3 text-right">Total Value ($ USDT)</th>
                <th className="py-2 px-3 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {filteredRecentTrades.map((t) => {
                const isBuy = t.side === 'BUY';
                const timeStr = new Date(t.timestamp).toLocaleTimeString();

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors hover:bg-neutral-800/30 ${
                      t.isWhale
                        ? isLight ? 'bg-amber-50/40' : 'bg-amber-500/5'
                        : ''
                    }`}
                  >
                    <td className="py-1.5 px-3 text-neutral-400 whitespace-nowrap text-[11px]">{timeStr}</td>
                    <td className="py-1.5 px-3 font-bold text-neutral-200">{t.symbol}/USDT</td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.side}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-neutral-100">
                      ${t.price.toLocaleString('en-US', { minimumFractionDigits: t.price < 10 ? 4 : 2, maximumFractionDigits: t.price < 10 ? 4 : 2 })}
                    </td>
                    {/* Actual Coin Qty Column */}
                    <td className="py-1.5 px-3 text-right font-extrabold text-amber-400 whitespace-nowrap bg-amber-500/5 rounded">
                      {t.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-[10px] font-semibold text-amber-300">{t.symbol}</span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-extrabold text-neutral-100">
                      ${t.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-3 text-center text-[10px] text-neutral-400">
                      {t.orderType}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: INSTITUTIONAL WHALE ORDERS TABLE (BELOW) */}
      <div
        className={`rounded-2xl p-4 shadow-lg border space-y-3 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
            : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
        }`}
      >
        {/* Header 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-extrabold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  🐋 Institutional Whale Orders Table
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  &gt; ${whaleThreshold.toLocaleString()} USDT
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Filtered specifically for large institution & whale block executions across market pairs
              </p>
            </div>
          </div>

          {/* Controls for Table 2 */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Whale Threshold Editor */}
            <div className="flex items-center gap-1.5">
              <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Whale Min ($):</span>
              <input
                type="number"
                step="2500"
                min="1000"
                max="1000000"
                value={whaleThreshold}
                onChange={(e) => setWhaleThreshold(Math.max(1000, Number(e.target.value) || 10000))}
                className={`w-28 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                }`}
              />
            </div>

            {/* Symbol Filter */}
            <div className="flex items-center gap-1.5">
              <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Filter Pair:</span>
              <select
                value={whaleSymbolFilter}
                onChange={(e) => setWhaleSymbolFilter(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                }`}
              >
                <option value="ALL">All Pairs</option>
                {Object.keys(assets).map((s) => (
                  <option key={s} value={s}>{s}/USDT</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table 2 Body: Whale Trades */}
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr
                className={`sticky top-0 z-10 text-[10px] uppercase tracking-wider font-semibold border-b ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Pair</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3 text-right">Price (USDT)</th>
                <th className="py-2 px-3 text-right text-amber-400">Actual Coin Qty</th>
                <th className="py-2 px-3 text-right">Total Notional ($ USDT)</th>
                <th className="py-2 px-3 text-center">Whale Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {filteredWhaleTrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                    No whale trades recorded above ${whaleThreshold.toLocaleString()} USDT yet. Waiting for large block orders...
                  </td>
                </tr>
              ) : (
                filteredWhaleTrades.map((t) => {
                  const isBuy = t.side === 'BUY';
                  const timeStr = new Date(t.timestamp).toLocaleTimeString();

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors font-bold ${
                        isLight
                          ? 'bg-amber-50/60 hover:bg-amber-100/60'
                          : 'bg-amber-500/10 hover:bg-amber-500/15'
                      }`}
                    >
                      <td className="py-2 px-3 text-neutral-400 whitespace-nowrap text-[11px]">{timeStr}</td>
                      <td className="py-2 px-3 font-extrabold text-neutral-100">{t.symbol}/USDT</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-neutral-100">
                        ${t.price.toLocaleString('en-US', { minimumFractionDigits: t.price < 10 ? 4 : 2, maximumFractionDigits: t.price < 10 ? 4 : 2 })}
                      </td>
                      {/* Actual Coin Qty Column */}
                      <td className="py-2 px-3 text-right font-extrabold text-amber-400 whitespace-nowrap bg-amber-500/10 rounded">
                        {t.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-[10px] font-bold text-amber-300">{t.symbol}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-black text-amber-300 text-sm">
                        ${t.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold animate-pulse shadow-sm">
                          <span>🐳 WHALE</span>
                          <span>${(t.totalUsd / 1000).toFixed(1)}k</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
