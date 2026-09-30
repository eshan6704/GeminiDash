import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MarketAsset,
  Position,
  LimitOrder,
  TradeRecord,
  SpotHolding,
  SimulatorConfig,
  OrderSide,
  TradeMode,
  SHARK_EXCHANGE,
} from '../types/trading';
import { INITIAL_ASSETS, fetchLiveMarketData } from '../services/marketData';
import { liveWebSocketFeed } from '../services/liveWebSocketFeed';
import { updateRememberedPrice, getHydratedPrice } from '../services/priceMemoryStore';
import { usePersistentSymbols } from '../services/symbolPersistenceService';

const DEFAULT_CONFIG: SimulatorConfig = {
  initialBalance: 1000,
  brokerName: SHARK_EXCHANGE.name, // 'Shark Exchange'
  takerFeeRate: SHARK_EXCHANGE.takerBrokerageRateDecimal, // 0.064% of trade value (4x maker)
  makerFeeRate: SHARK_EXCHANGE.makerBrokerageRateDecimal, // 0.016% of trade value (0.00016)
  slippageRate: 0.0004, // 0.04% average market slippage
  enableSlippage: false,
  enableFees: true,
};

const STORAGE_KEYS = {
  CONFIG: 'aurumx_config_v5',
  CASH: 'aurumx_manual_cash_v5',
  FORECAST_BALANCE: 'aurumx_forecast_balance_v5',
  GRID_CASH: 'aurumx_grid_cash_v5',
  GRID_INITIAL: 'aurumx_grid_initial_v5',
  POSITIONS: 'aurumx_positions_v2',
  LIMIT_ORDERS: 'aurumx_limits_v2',
  HISTORY: 'aurumx_history_v2',
  SPOT: 'aurumx_spot_v2',
  ALERTS: 'aurumx_alerts_v2',
};

export interface PriceAlert {
  id: string;
  assetSymbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: number;
  isActive: boolean;
  isTriggered: boolean;
}

export interface AlertNotification {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

export function useTradeSimulator(isActiveCryptoOrCoinPage: boolean = true) {
  const [assets, setAssets] = useState<Record<string, MarketAsset>>(() => {
    const hydrated: Record<string, MarketAsset> = {};
    Object.entries(INITIAL_ASSETS).forEach(([sym, asset]) => {
      if (sym && asset) {
        hydrated[sym] = getHydratedPrice(asset);
      }
    });
    return hydrated;
  });
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Local stablePrice ref to maintain last recorded price and timestamp per asset
  // Prevents price bouncing caused by network latency or race conditions between live feeds
  const stablePriceRef = useRef<Record<string, { price: number; dataTimestamp: number }>>({});

  // Keep ref synchronized on initial render
  if (Object.keys(stablePriceRef.current).length === 0 && Object.keys(assets).length > 0) {
    Object.entries(assets).forEach(([sym, asset]) => {
      if (sym && asset) {
        stablePriceRef.current[sym.toUpperCase()] = {
          price: asset.price,
          dataTimestamp: asset.dataTimestamp || asset.lastUpdated || 0,
        };
      }
    });
  }

  // Simulator state
  const [config, setConfig] = useState<SimulatorConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          makerFeeRate: SHARK_EXCHANGE.makerBrokerageRateDecimal, // 0.016%
          takerFeeRate: SHARK_EXCHANGE.takerBrokerageRateDecimal, // 0.064% (4x maker)
          enableSlippage: false,
        };
      }
      return DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH);
      return saved !== null ? Number(saved) : DEFAULT_CONFIG.initialBalance;
    } catch {
      return DEFAULT_CONFIG.initialBalance;
    }
  });

  // Separate PnL Forecasting Balance ($1,000 default, editable)
  const [forecastBalance, setForecastBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FORECAST_BALANCE);
      return saved !== null ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  // Separate Grid-Based Auto Simulation Balance ($1,000 default, editable)
  const [gridInitialBalance, setGridInitialBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRID_INITIAL);
      return saved !== null ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  const [gridCashBalance, setGridCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRID_CASH);
      return saved !== null ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIMIT_ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [spotHoldings, setSpotHoldings] = useState<SpotHolding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPOT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep references to avoid stale closures in market poll intervals
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const limitOrdersRef = useRef(limitOrders);
  limitOrdersRef.current = limitOrders;
  const priceAlertsRef = useRef(priceAlerts);
  priceAlertsRef.current = priceAlerts;
  const cashRef = useRef(cashBalance);
  cashRef.current = cashBalance;
  const gridCashRef = useRef(gridCashBalance);
  gridCashRef.current = gridCashBalance;
  const gridInitialRef = useRef(gridInitialBalance);
  gridInitialRef.current = gridInitialBalance;
  const forecastBalanceRef = useRef(forecastBalance);
  forecastBalanceRef.current = forecastBalance;
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const configRef = useRef(config);
  configRef.current = config;
  const spotHoldingsRef = useRef(spotHoldings);
  spotHoldingsRef.current = spotHoldings;

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CASH, cashBalance.toString());
      localStorage.setItem(STORAGE_KEYS.FORECAST_BALANCE, forecastBalance.toString());
      localStorage.setItem(STORAGE_KEYS.GRID_CASH, gridCashBalance.toString());
      localStorage.setItem(STORAGE_KEYS.GRID_INITIAL, gridInitialBalance.toString());
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
      localStorage.setItem(STORAGE_KEYS.LIMIT_ORDERS, JSON.stringify(limitOrders));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(tradeHistory));
      localStorage.setItem(STORAGE_KEYS.SPOT, JSON.stringify(spotHoldings));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(priceAlerts));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [cashBalance, forecastBalance, gridCashBalance, gridInitialBalance, positions, limitOrders, tradeHistory, spotHoldings, priceAlerts]);

  // Push notification helper (max 1 toast allowed at a time)
  const addNotification = useCallback((type: AlertNotification['type'], title: string, message: string) => {
    const newNotif: AlertNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setNotifications([newNotif]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const { prices: persistentPrices } = usePersistentSymbols();

  // Instant update from B2 Storage persistent store
  useEffect(() => {
    if (!persistentPrices || Object.keys(persistentPrices).length === 0) return;

    setAssets((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(persistentPrices).forEach(([sym, p]) => {
        if (!sym || !p) return;
        const cleanSym = sym.toUpperCase();
        if (next[cleanSym] && p.price && typeof p.price === 'number') {
          const existing = next[cleanSym];
          const incomingTimestamp = p.dataTimestamp || p.updatedAtMs || (p.updatedAt ? new Date(p.updatedAt).getTime() : 0);
          
          const stable = stablePriceRef.current[cleanSym] || {
            price: existing.price,
            dataTimestamp: existing.dataTimestamp || existing.lastUpdated || 0,
          };

          // Stable Price Ref Mechanism:
          // Update ONLY if incoming Cloud Storage data is newer (based on dataTimestamp) AND differs from last recorded price
          const isNewer = incomingTimestamp > stable.dataTimestamp;
          const isPriceDifferent = p.price !== stable.price;

          if (incomingTimestamp > 0 && isNewer && isPriceDifferent) {
            changed = true;
            stablePriceRef.current[cleanSym] = {
              price: p.price,
              dataTimestamp: incomingTimestamp,
            };

            next[cleanSym] = {
              ...existing,
              price: p.price,
              change24h: p.changePct !== undefined ? p.changePct : existing.change24h,
              high24h: p.high || existing.high24h,
              low24h: p.low || existing.low24h,
              lastUpdated: incomingTimestamp,
              dataTimestamp: incomingTimestamp,
            };
            updateRememberedPrice(cleanSym, p.price, incomingTimestamp, {
              change24h: p.changePct,
              high24h: p.high,
              low24h: p.low,
            });
          }
        }
      });

      if (changed) {
        setLastTickTime(Date.now());
        checkTriggersAndOrders(next);
        return next;
      }
      return prev;
    });
  }, [persistentPrices]);

  const selectedSymbolRef = useRef(selectedSymbol);
  selectedSymbolRef.current = selectedSymbol;
  const isActivePageRef = useRef(isActiveCryptoOrCoinPage);
  isActivePageRef.current = isActiveCryptoOrCoinPage;

  // Update WebSocket stream scope so only active page/tab symbols are streamed
  useEffect(() => {
    const openSymbols = Array.from(
      new Set([
        ...positions.map((p) => p.assetSymbol),
        ...limitOrders.map((o) => o.assetSymbol),
      ])
    );
    liveWebSocketFeed.setNetworkScope({
      isActivePage: isActiveCryptoOrCoinPage,
      activeSymbol: selectedSymbol,
      requiredSymbols: openSymbols,
    });
  }, [isActiveCryptoOrCoinPage, selectedSymbol, positions, limitOrders]);

  // Initial REST fetch & relaxed background fallback (scoped to active coin + open positions)
  const refreshPrices = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const hasOpenPositionsOrOrders =
      positionsRef.current.length > 0 || limitOrdersRef.current.length > 0;
    if (!isActivePageRef.current && !hasOpenPositionsOrOrders) return;

    try {
      const targetSymbols = Array.from(
        new Set([
          selectedSymbolRef.current,
          ...positionsRef.current.map((p) => p.assetSymbol),
          ...limitOrdersRef.current.map((o) => o.assetSymbol),
        ])
      );
      const updated = await fetchLiveMarketData(assetsRef.current, targetSymbols);
      setAssets((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.entries(updated).forEach(([sym, newAsset]) => {
          if (newAsset && typeof newAsset.price === 'number' && !isNaN(newAsset.price) && newAsset.price > 0) {
            const existing = next[sym];
            if (!existing && !sym) return;
            const incomingTimestamp = newAsset.dataTimestamp || newAsset.lastUpdated || 0;
            const stable = stablePriceRef.current[sym] || {
              price: existing?.price || 0,
              dataTimestamp: existing?.dataTimestamp || existing?.lastUpdated || 0,
            };

            const isNewer = !existing || incomingTimestamp > stable.dataTimestamp;
            const isPriceDifferent = newAsset.price !== stable.price;

            if (incomingTimestamp > 0 && isNewer && isPriceDifferent) {
              changed = true;
              stablePriceRef.current[sym] = {
                price: newAsset.price,
                dataTimestamp: incomingTimestamp,
              };

              next[sym] = {
                ...existing,
                ...newAsset,
                price: newAsset.price,
                lastUpdated: incomingTimestamp,
                dataTimestamp: incomingTimestamp,
              };
              updateRememberedPrice(sym, newAsset.price, incomingTimestamp, {
                change24h: newAsset.change24h,
                high24h: newAsset.high24h,
                low24h: newAsset.low24h,
              });
            }
          }
        });
        if (changed) {
          checkTriggersAndOrders(next);
          return next;
        }
        return prev;
      });
      setIsLiveConnected(true);
      setLastTickTime(Date.now());
    } catch (err) {
      console.error('REST market refresh fallback failed', err);
    }
  }, []);

  useEffect(() => {
    if (!isActiveCryptoOrCoinPage && positionsRef.current.length === 0) return;
    refreshPrices();
    const interval = setInterval(refreshPrices, 90000); // 90s relaxed fallback
    return () => clearInterval(interval);
  }, [refreshPrices, isActiveCryptoOrCoinPage, selectedSymbol]);

  // Real-time Exchange WebSocket Stream (Binance & Bitfinex)
  useEffect(() => {
    const unsubscribe = liveWebSocketFeed.subscribe((updates) => {
      setAssets((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.keys(updates).forEach((sym) => {
          const update = updates[sym];
          if (update && next[sym]) {
            const existing = next[sym];
            const incomingTimestamp = update.dataTimestamp || update.lastUpdated || 0;
            const newPrice = update.price !== undefined ? update.price : existing.price;
            const stable = stablePriceRef.current[sym] || {
              price: existing.price,
              dataTimestamp: existing.dataTimestamp || existing.lastUpdated || 0,
            };

            const isNewer = incomingTimestamp > stable.dataTimestamp;
            const isPriceDifferent = newPrice !== stable.price;

            if (incomingTimestamp > 0 && isNewer && isPriceDifferent) {
              changed = true;
              stablePriceRef.current[sym] = {
                price: newPrice,
                dataTimestamp: incomingTimestamp,
              };

              next[sym] = {
                ...existing,
                ...update,
                price: newPrice,
                lastUpdated: incomingTimestamp,
                dataTimestamp: incomingTimestamp,
              };
              updateRememberedPrice(sym, newPrice, incomingTimestamp, {
                change24h: update.change24h,
                high24h: update.high24h,
                low24h: update.low24h,
              });
            }
          }
        });

        if (changed) {
          setLastTickTime(Date.now());
          setIsLiveConnected(true);
          checkTriggersAndOrders(next);
        }

        return changed ? next : prev;
      });
    });

    return () => unsubscribe();
  }, []);

  // Monitor TP, SL, Liquidation, and Pending Limit Orders
  const checkTriggersAndOrders = (currentAssets: Record<string, MarketAsset>) => {
    const currentPositions = positionsRef.current;
    const currentLimits = limitOrdersRef.current;
    const currentConfig = configRef.current;

    // 1. Update active positions PnL and check triggers
    if (currentPositions.length > 0) {
      const remainingPositions: Position[] = [];
      const closedRecords: TradeRecord[] = [];
      let manualCashRefund = 0;
      let gridCashRefund = 0;

      for (const pos of currentPositions) {
        const asset = currentAssets[pos.assetSymbol];
        if (!asset) {
          remainingPositions.push(pos);
          continue;
        }

        const price = asset.price;
        const isLong = pos.side === 'LONG';
        
        // --- Smart Trailing Stop Logic ---
        let peakPrice = pos.peakPrice || pos.entryPrice;
        let stopLossPrice = pos.stopLossPrice;

        if (isLong) {
          if (price > peakPrice) {
            peakPrice = price;
            if (pos.trailingStopPercent) {
              const newSL = price * (1 - pos.trailingStopPercent / 100);
              // Trailing stop only moves UP for longs
              if (stopLossPrice === undefined || newSL > stopLossPrice) {
                stopLossPrice = newSL;
              }
            }
          }
        } else {
          if (price < peakPrice) {
            peakPrice = price;
            if (pos.trailingStopPercent) {
              const newSL = price * (1 + pos.trailingStopPercent / 100);
              // Trailing stop only moves DOWN for shorts
              if (stopLossPrice === undefined || newSL < stopLossPrice) {
                stopLossPrice = newSL;
              }
            }
          }
        }
        // ---------------------------------

        const entryTradeValue = pos.entryPrice * pos.amount;
        const currentTradeValue = price * pos.amount;
        const tradeValueDiff = isLong
          ? currentTradeValue - entryTradeValue
          : entryTradeValue - currentTradeValue;
        const unrealizedPnL = tradeValueDiff;
        const unrealizedPnLPercent = pos.margin > 0 ? (unrealizedPnL / pos.margin) * 100 : 0;

        // After liquidation price is reached, treat position as still OPEN so loss is not capped and keeps increasing

        // Check Take Profit
        const isTP = pos.takeProfitPrice && (
          isLong ? price >= pos.takeProfitPrice : price <= pos.takeProfitPrice
        );
        if (isTP && pos.takeProfitPrice) {
          const exitPrice = pos.takeProfitPrice;
          const exitTradeValue = exitPrice * pos.amount;
          const exitTradeValueDiff = isLong
            ? exitTradeValue - entryTradeValue
            : entryTradeValue - exitTradeValue;
          const pnl = exitTradeValueDiff;
          const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
          if (pos.accountSource === 'AUTO_GRID') {
            gridCashRefund += pos.margin + pnl;
          } else {
            manualCashRefund += pos.margin + pnl;
          }

          closedRecords.push({
            id: Math.random().toString(36).substring(2, 9),
            assetSymbol: pos.assetSymbol,
            side: pos.side,
            mode: 'LEVERAGED',
            entryPrice: pos.entryPrice,
            exitPrice: exitPrice,
            amount: pos.amount,
            leverage: pos.leverage,
            realizedPnL: pnl,
            realizedPnLPercent: pnlPct,
            fees: pos.feePaid,
            openTime: pos.openTime,
            closeTime: Date.now(),
            closeReason: 'TAKE_PROFIT',
            accountSource: pos.accountSource || 'MANUAL',
          });
          addNotification(
            'success',
            `Take-Profit Hit: ${pos.assetSymbol}`,
            `Position closed at target $${exitPrice.toFixed(2)}. Return (Change in Trade Value): +$${pnl.toFixed(4)} (+${pnlPct.toFixed(1)}%)`
          );
          continue;
        }

        // Check Stop Loss (including Trailing SL)
        const isSL = stopLossPrice && (
          isLong ? price <= stopLossPrice : price >= stopLossPrice
        );
        if (isSL && stopLossPrice) {
          const exitPrice = stopLossPrice;
          const exitTradeValue = exitPrice * pos.amount;
          const exitTradeValueDiff = isLong
            ? exitTradeValue - entryTradeValue
            : entryTradeValue - exitTradeValue;
          const pnl = exitTradeValueDiff;
          const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
          if (pos.accountSource === 'AUTO_GRID') {
            gridCashRefund += pos.margin + pnl;
          } else {
            manualCashRefund += pos.margin + pnl;
          }

          closedRecords.push({
            id: Math.random().toString(36).substring(2, 9),
            assetSymbol: pos.assetSymbol,
            side: pos.side,
            mode: 'LEVERAGED',
            entryPrice: pos.entryPrice,
            exitPrice: exitPrice,
            amount: pos.amount,
            leverage: pos.leverage,
            realizedPnL: pnl,
            realizedPnLPercent: pnlPct,
            fees: pos.feePaid,
            openTime: pos.openTime,
            closeTime: Date.now(),
            closeReason: 'STOP_LOSS',
            accountSource: pos.accountSource || 'MANUAL',
          });
          addNotification(
            'warning',
            `Stop-Loss Triggered: ${pos.assetSymbol}`,
            `Protected capital at $${exitPrice.toFixed(2)}. Return (Change in Trade Value): -$${Math.abs(pnl).toFixed(4)} (${pnlPct.toFixed(1)}%)`
          );
          continue;
        }

        // Keep position active with live mark PnL (uncapped even past liquidation) and updated SL/Peak
        remainingPositions.push({
          ...pos,
          peakPrice,
          stopLossPrice,
          unrealizedPnL,
          unrealizedPnLPercent,
        });
      }

      if (closedRecords.length > 0) {
        setPositions(remainingPositions);
        setTradeHistory((prev) => [...closedRecords, ...prev]);
        if (manualCashRefund !== 0) {
          setCashBalance((prev) => prev + manualCashRefund);
        }
        if (gridCashRefund !== 0) {
          setGridCashBalance((prev) => prev + gridCashRefund);
        }
      } else {
        setPositions(remainingPositions);
      }
    }

    // 2. Check Pending Limit Orders
    if (currentLimits.length > 0) {
      const remainingLimits: LimitOrder[] = [];

      for (const order of currentLimits) {
        const asset = currentAssets[order.assetSymbol];
        if (!asset) {
          remainingLimits.push(order);
          continue;
        }

        const price = asset.price;
        const isBuy = order.side === 'BUY';
        const triggered = isBuy ? price <= order.targetPrice : price >= order.targetPrice;

        if (triggered) {
          // Execute limit order as filled
          if (order.mode === 'SPOT') {
            if (isBuy) {
              // Spot buy fill
              const fillPrice = order.targetPrice;
              const fee = currentConfig.enableFees ? order.margin * currentConfig.makerFeeRate : 0;
              setSpotHoldings((prev) => {
                const existing = prev.find((h) => h.symbol === order.assetSymbol);
                if (existing) {
                  const newAmt = existing.amount + order.amount;
                  const newCost = (existing.amount * existing.avgCostPrice + order.amount * fillPrice) / newAmt;
                  return prev.map((h) => (h.symbol === order.assetSymbol ? { ...h, amount: newAmt, avgCostPrice: newCost } : h));
                }
                return [...prev, { symbol: order.assetSymbol, amount: order.amount, avgCostPrice: fillPrice }];
              });
              addNotification(
                'success',
                `Limit Order Filled: Bought ${order.amount} ${order.assetSymbol}`,
                `Order filled at $${fillPrice.toFixed(2)}. Fee: $${fee.toFixed(2)}`
              );
            }
          } else {
            // Check max 10 running trades limit
            if (currentPositions.length >= 10) {
              remainingLimits.push(order);
              continue;
            }

            // Leveraged position fill (Limit Order = Maker Order = 0.016% fee on Trade Value)
            const isLong = order.side === 'BUY';
            const leverage = order.leverage;
            const limitLiqCap = 3; // $3 default lot-based liquidation buffer (e.g. 3 / 0.002 = 1500 pts)
            const limitLiqPoints = order.amount > 0 ? limitLiqCap / order.amount : 0;
            const liqPrice = isLong
              ? Math.max(0, order.targetPrice - limitLiqPoints)
              : order.targetPrice + limitLiqPoints;

            const fillTradeValue = order.targetPrice * order.amount;
            const fillMargin = fillTradeValue / leverage;
            const makerFee = currentConfig.enableFees
              ? fillTradeValue * SHARK_EXCHANGE.makerBrokerageRateDecimal
              : 0;

            const newPos: Position = {
              id: Math.random().toString(36).substring(2, 9),
              assetSymbol: order.assetSymbol,
              side: isLong ? 'LONG' : 'SHORT',
              entryPrice: order.targetPrice,
              amount: order.amount,
              margin: fillMargin,
              leverage: order.leverage,
              liquidationPrice: liqPrice,
              takeProfitPrice: order.takeProfitPrice,
              stopLossPrice: order.stopLossPrice,
              trailingStopPercent: order.trailingStopPercent,
              peakPrice: order.targetPrice,
              openTime: Date.now(),
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
              feePaid: makerFee,
              accountSource: order.accountSource || 'MANUAL',
            };

            setPositions((prev) => [newPos, ...prev]);
            addNotification(
              'success',
              `Limit Order Filled: ${order.assetSymbol} ${order.leverage}x ${newPos.side}`,
              `Filled at $${order.targetPrice.toFixed(2)}.`
            );
          }
        } else {
          remainingLimits.push(order);
        }
      }

      if (remainingLimits.length !== currentLimits.length) {
        setLimitOrders(remainingLimits);
      }
    }

    // 3. Check Price Alerts
    const currentAlerts = priceAlertsRef.current;
    if (currentAlerts.length > 0) {
      const activeAlerts = currentAlerts.filter(a => a.isActive && !a.isTriggered);
      if (activeAlerts.length > 0) {
        let alertsUpdated = false;
        const nextAlerts = currentAlerts.map(alert => {
          if (!alert.isActive || alert.isTriggered) return alert;

          const asset = currentAssets[alert.assetSymbol];
          if (!asset) return alert;

          const currentPrice = asset.price;
          const isTriggered = alert.condition === 'ABOVE' 
            ? currentPrice >= alert.targetPrice 
            : currentPrice <= alert.targetPrice;

          if (isTriggered) {
            alertsUpdated = true;
            addNotification(
              'warning',
              `🚨 Alert: ${alert.assetSymbol} target hit!`,
              `Price is now ${alert.condition.toLowerCase()} $${alert.targetPrice.toLocaleString()} (Current: $${currentPrice.toLocaleString()})`
            );
            return { ...alert, isTriggered: true, isActive: false };
          }
          return alert;
        });

        if (alertsUpdated) {
          setPriceAlerts(nextAlerts);
        }
      }
    }
  };

  // Place Order Action (Market or Limit) — supports separate MANUAL vs AUTO_GRID balances
  const placeOrder = useCallback(
    (params: {
      symbol: string;
      mode: TradeMode;
      side: OrderSide;
      orderType: 'MARKET' | 'LIMIT';
      margin: number; // USDT margin allocated (tradeValue / leverage)
      leverage: number; // 1 to 150
      amount?: number; // Explicit lot size (e.g. 0.002)
      isMaker?: boolean; // Explicit Maker (0.016%) vs Taker (0.064% / 4x) fee selection
      customSymbolPrice?: number; // Optional override symbol price (e.g. 80000)
      targetPrice?: number;
      takeProfitPrice?: number;
      stopLossPrice?: number;
      trailingStopPercent?: number;
      liqDollarCap?: number; // Dollar liquidation/SL buffer (default $3 -> 1500 pts at 0.002 lot)
      accountSource?: 'MANUAL' | 'AUTO_GRID';
    }) => {
      const {
        symbol,
        mode,
        side,
        orderType,
        margin,
        leverage,
        amount: explicitLot,
        isMaker,
        customSymbolPrice,
        targetPrice,
        takeProfitPrice,
        stopLossPrice,
        trailingStopPercent,
        liqDollarCap = 3,
        accountSource = 'MANUAL',
      } = params;

      const currentAssets = assetsRef.current;
      const isGridAccount = accountSource === 'AUTO_GRID';
      const currentCash = isGridAccount ? gridCashRef.current : cashRef.current;
      const currentConfig = configRef.current;
      const currentSpot = spotHoldingsRef.current;

      const asset = currentAssets[symbol];
      if (!asset) {
        addNotification('danger', 'Error', 'Asset not found');
        return false;
      }

      const effLeverage = mode === 'SPOT' ? 1 : Math.max(1, leverage);
      const isLong = side === 'BUY';

      // Base symbol price
      let execPrice = customSymbolPrice && customSymbolPrice > 0 ? customSymbolPrice : asset.price;
      if (orderType === 'MARKET' && currentConfig.enableSlippage && !customSymbolPrice) {
        const slippage = asset.price * currentConfig.slippageRate;
        execPrice = isLong ? asset.price + slippage : asset.price - slippage;
      }

      // Formula:
      // Let symbol price = execPrice (e.g. 80000), lot = amount (e.g. 0.002), leverage = 150x
      // Trade value = symbolPrice * lot
      // Margin required = trade value / leverage
      const amount =
        explicitLot && explicitLot > 0
          ? explicitLot
          : execPrice > 0
          ? (margin * effLeverage) / execPrice
          : 0;
      const tradeValue = execPrice * amount;
      const requiredMargin = effLeverage > 0 ? tradeValue / effLeverage : tradeValue;

      if (requiredMargin <= 0 || amount <= 0) {
        addNotification('warning', 'Invalid Order Size', 'Please specify a positive lot size or margin amount.');
        return false;
      }

      // Max running live trades is 10
      if (mode === 'LEVERAGED' && positionsRef.current.length >= 10) {
        addNotification(
          'danger',
          'Max Live Trades Reached (10/10)',
          'Maximum running live trade limit is 10. You currently have 10/10 active positions. Close an active trade before opening a new one.'
        );
        return false;
      }

      // Fees = tradeValue * 0.016% if Maker order (Taker has 4x brokerage = 0.064%)
      const useMakerFee = isMaker !== undefined ? isMaker : orderType === 'LIMIT';
      const feeRate = useMakerFee
        ? SHARK_EXCHANGE.makerBrokerageRateDecimal // 0.016% (0.00016)
        : SHARK_EXCHANGE.takerBrokerageRateDecimal; // 0.064% (4x maker = 0.00064)
      const fee = currentConfig.enableFees ? tradeValue * feeRate : 0;

      // Check balance against active account (Grid Auto Sim vs Manual Trade)
      if (requiredMargin + fee > currentCash) {
        addNotification(
          'danger',
          isGridAccount ? 'Auto Grid: Insufficient Balance' : 'Insufficient Manual Trade Balance',
          `Required Margin ($${requiredMargin.toFixed(4)}) + Fee ($${fee.toFixed(4)}) = $${(requiredMargin + fee).toFixed(4)} USDT, Available: $${currentCash.toFixed(2)} USDT`
        );
        return false;
      }

      // 1. LIMIT ORDER
      if (orderType === 'LIMIT') {
        if (!targetPrice || targetPrice <= 0) {
          addNotification('warning', 'Target Price Required', 'Please provide a valid limit target price.');
          return false;
        }

        const limitAmount = explicitLot && explicitLot > 0 ? explicitLot : (requiredMargin * effLeverage) / targetPrice;
        const limitTradeValue = targetPrice * limitAmount;
        const limitMargin = effLeverage > 0 ? limitTradeValue / effLeverage : limitTradeValue;

        const newLimit: LimitOrder = {
          id: Math.random().toString(36).substring(2, 9),
          assetSymbol: symbol,
          side,
          mode,
          targetPrice,
          amount: limitAmount,
          margin: limitMargin,
          leverage: effLeverage,
          takeProfitPrice,
          stopLossPrice,
          trailingStopPercent,
          createdAt: Date.now(),
          accountSource,
        };

        if (isGridAccount) {
          setGridCashBalance((prev) => prev - limitMargin);
        } else {
          setCashBalance((prev) => prev - limitMargin);
        }
        setLimitOrders((prev) => [newLimit, ...prev]);
        addNotification(
          'info',
          `Limit (Maker 0.016%) Order Placed`,
          `${side} ${limitAmount.toFixed(4)} ${symbol} @ $${targetPrice.toFixed(2)} | Trade Value: $${limitTradeValue.toFixed(2)} | Margin Req: $${limitMargin.toFixed(4)}`
        );
        return true;
      }

      // 2. SPOT MARKET ORDER
      if (mode === 'SPOT') {
        if (side === 'BUY') {
          setCashBalance((prev) => prev - (requiredMargin + fee));
          setSpotHoldings((prev) => {
            const existing = prev.find((h) => h.symbol === symbol);
            if (existing) {
              const newAmount = existing.amount + amount;
              const newAvg = (existing.amount * existing.avgCostPrice + amount * execPrice) / newAmount;
              return prev.map((h) => (h.symbol === symbol ? { ...h, amount: newAmount, avgCostPrice: newAvg } : h));
            }
            return [...prev, { symbol, amount, avgCostPrice: execPrice }];
          });

          addNotification(
            'success',
            `Spot Buy Filled: ${symbol}`,
            `Bought ${amount.toFixed(4)} ${symbol} @ $${execPrice.toFixed(2)} (Trade Value: $${tradeValue.toFixed(2)}, Fee: $${fee.toFixed(4)})`
          );
          return true;
        } else {
          // Spot SELL: checks holding
          const holding = currentSpot.find((h) => h.symbol === symbol);
          if (!holding || holding.amount <= 0) {
            addNotification('danger', 'No Spot Balance', `You do not hold any spot ${symbol} to sell.`);
            return false;
          }

          const sellAmount = Math.min(holding.amount, amount);
          const grossUsdt = sellAmount * execPrice;
          const sellFee = currentConfig.enableFees ? grossUsdt * feeRate : 0;
          const netUsdt = grossUsdt - sellFee;
          const costBasis = sellAmount * holding.avgCostPrice;
          const pnl = grossUsdt - costBasis; // Return = Change in Trade Value
          const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

          setSpotHoldings((prev) =>
            prev
              .map((h) => (h.symbol === symbol ? { ...h, amount: h.amount - sellAmount } : h))
              .filter((h) => h.amount > 0.000001)
          );

          setCashBalance((prev) => prev + netUsdt);

          const record: TradeRecord = {
            id: Math.random().toString(36).substring(2, 9),
            assetSymbol: symbol,
            side: 'SELL',
            mode: 'SPOT',
            entryPrice: holding.avgCostPrice,
            exitPrice: execPrice,
            amount: sellAmount,
            leverage: 1,
            realizedPnL: pnl,
            realizedPnLPercent: pnlPct,
            fees: sellFee,
            openTime: Date.now(),
            closeTime: Date.now(),
            closeReason: 'SPOT_SELL',
            accountSource: 'MANUAL',
          };

          setTradeHistory((prev) => [record, ...prev]);

          addNotification(
            pnl >= 0 ? 'success' : 'warning',
            `Spot Sold: ${symbol}`,
            `Sold ${sellAmount.toFixed(4)} ${symbol} @ $${execPrice.toFixed(2)}. Return (Change in Trade Value): ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(4)} (${pnlPct.toFixed(1)}%)`
          );
          return true;
        }
      }

      // 3. LEVERAGED ORDER (Futures / Margin Long or Short)
      // Liquidation depends on contract lot size:
      // Points = Dollar Cap (default $3) / Lot Size
      // 1 lot -> 3 pts | 0.1 lot -> 30 pts | 0.01 lot -> 300 pts | 0.002 lot -> 1500 pts
      // Example: Buy at 80000 with 0.002 lot & $3 cap -> 80000 - 1500 = 78500
      const effectiveLiqCap = liqDollarCap && liqDollarCap > 0 ? liqDollarCap : 3;
      const liqPoints = amount > 0 ? effectiveLiqCap / amount : 0;
      const liqPrice = isLong
        ? Math.max(0, execPrice - liqPoints)
        : execPrice + liqPoints;

      const newPosition: Position = {
        id: Math.random().toString(36).substring(2, 9),
        assetSymbol: symbol,
        side: isLong ? 'LONG' : 'SHORT',
        entryPrice: execPrice,
        amount,
        margin: requiredMargin,
        leverage: effLeverage,
        liquidationPrice: Math.max(0, liqPrice),
        takeProfitPrice,
        stopLossPrice,
        trailingStopPercent,
        peakPrice: execPrice,
        openTime: Date.now(),
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        feePaid: fee,
        accountSource,
      };

      // Deduct requiredMargin when opening; when closed, requiredMargin + Return (Change in Trade Value) is refunded
      if (isGridAccount) {
        setGridCashBalance((prev) => prev - requiredMargin);
      } else {
        setCashBalance((prev) => prev - requiredMargin);
      }
      setPositions((prev) => [newPosition, ...prev]);

      addNotification(
        'success',
        `Position Opened: ${symbol} ${effLeverage}x ${newPosition.side}`,
        `Price: $${execPrice.toFixed(2)} × Lot ${amount} = Trade Value $${tradeValue.toFixed(2)} | Margin Req: $${requiredMargin.toFixed(4)} | Fee (${useMakerFee ? 'Maker 0.016%' : 'Taker 4x 0.064%'}): $${fee.toFixed(4)}`
      );
      return true;
    },
    [addNotification]
  );

  // Close Leveraged Position Manually (partial or full)
  // Return = Change in Trade Value
  const closePosition = useCallback(
    (positionId: string, percentage: number = 100) => {
      const pos = positionsRef.current.find((p) => p.id === positionId);
      if (!pos) return;

      const currentAssets = assetsRef.current;
      const currentConfig = configRef.current;
      const asset = currentAssets[pos.assetSymbol];
      const curPrice = asset ? asset.price : pos.entryPrice;

      let exitPrice = curPrice;
      if (currentConfig.enableSlippage) {
        const slippage = curPrice * currentConfig.slippageRate;
        exitPrice = pos.side === 'LONG' ? curPrice - slippage : curPrice + slippage;
      }

      const fraction = Math.min(100, Math.max(1, percentage)) / 100;
      const closedAmount = pos.amount * fraction;
      const closedMargin = pos.margin * fraction;

      const isLong = pos.side === 'LONG';
      const entryTradeValue = pos.entryPrice * closedAmount;
      const exitTradeValue = exitPrice * closedAmount;
      const tradeValueDiff = isLong
        ? exitTradeValue - entryTradeValue
        : entryTradeValue - exitTradeValue;

      const fees = (pos.feePaid || 0) * fraction;
      const netPnL = tradeValueDiff;
      const netPnLPercent = closedMargin > 0 ? (netPnL / closedMargin) * 100 : 0;
      const cashReturned = closedMargin + netPnL;

      if (pos.accountSource === 'AUTO_GRID') {
        setGridCashBalance((prev) => prev + cashReturned);
      } else {
        setCashBalance((prev) => prev + cashReturned);
      }

      const record: TradeRecord = {
        id: Math.random().toString(36).substring(2, 9),
        assetSymbol: pos.assetSymbol,
        side: pos.side,
        mode: 'LEVERAGED',
        entryPrice: pos.entryPrice,
        exitPrice,
        amount: closedAmount,
        leverage: pos.leverage,
        realizedPnL: netPnL,
        realizedPnLPercent: netPnLPercent,
        fees,
        openTime: pos.openTime,
        closeTime: Date.now(),
        closeReason: 'MANUAL',
        accountSource: pos.accountSource || 'MANUAL',
      };

      setTradeHistory((prev) => [record, ...prev]);

      if (fraction >= 0.999) {
        setPositions((prev) => prev.filter((p) => p.id !== positionId));
      } else {
        setPositions((prev) =>
          prev.map((p) =>
            p.id === positionId
              ? {
                  ...p,
                  amount: p.amount - closedAmount,
                  margin: p.margin - closedMargin,
                  feePaid: Math.max(0, (p.feePaid || 0) - fees),
                }
              : p
          )
        );
      }

      addNotification(
        netPnL >= 0 ? 'success' : 'warning',
        `Closed ${pos.assetSymbol} ${pos.side}`,
        `Exit @ $${exitPrice.toFixed(2)} | Entry Val $${entryTradeValue.toFixed(2)} → Exit Val $${exitTradeValue.toFixed(2)} | Return (Change in Trade Value): ${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(4)} (${netPnLPercent.toFixed(1)}%)`
      );
    },
    [addNotification]
  );

  // Cancel Pending Limit Order
  const cancelLimitOrder = useCallback(
    (orderId: string) => {
      const order = limitOrdersRef.current.find((o) => o.id === orderId);
      if (!order) return;

      if (order.accountSource === 'AUTO_GRID') {
        setGridCashBalance((prev) => prev + order.margin);
      } else {
        setCashBalance((prev) => prev + order.margin);
      }
      setLimitOrders((prev) => prev.filter((o) => o.id !== orderId));
      addNotification('info', 'Order Cancelled', `Refunded $${order.margin.toFixed(2)} USDT collateral.`);
    },
    [addNotification]
  );

  // Update SL/TP of an active position
  const updatePositionSLTP = useCallback(
    (positionId: string, stopLoss?: number, takeProfit?: number, trailingStopPercent?: number) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId
            ? { ...p, stopLossPrice: stopLoss, takeProfitPrice: takeProfit, trailingStopPercent }
            : p
        )
      );
      addNotification('success', 'Risk Levels Updated', 'Risk parameters updated.');
    },
    [addNotification]
  );

  // Reset previous closed trade returns & trade history log while preserving live running positions
  const resetTradeHistory = useCallback(() => {
    const manualLockedMargin = positionsRef.current
      .filter((p) => p.accountSource !== 'AUTO_GRID')
      .reduce((acc, p) => acc + p.margin, 0);
    const manualLockedLimit = limitOrdersRef.current
      .filter((o) => o.accountSource !== 'AUTO_GRID')
      .reduce((acc, o) => acc + o.margin, 0);
    const spotCost = spotHoldingsRef.current.reduce((acc, s) => acc + s.amount * s.avgCostPrice, 0);
    const baseInitial = configRef.current.initialBalance || 1000;
    const restoredCash = Math.max(0, Number((baseInitial - manualLockedMargin - manualLockedLimit - spotCost).toFixed(2)));

    const gridLockedMargin = positionsRef.current
      .filter((p) => p.accountSource === 'AUTO_GRID')
      .reduce((acc, p) => acc + p.margin, 0);
    const restoredGridCash = Math.max(0, Number(((gridInitialRef.current || 1000) - gridLockedMargin).toFixed(2)));

    setTradeHistory([]);
    setCashBalance(restoredCash);
    setGridCashBalance(restoredGridCash);
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CASH, restoredCash.toString());
      localStorage.setItem(STORAGE_KEYS.GRID_CASH, restoredGridCash.toString());
    } catch {
      // ignore storage errors
    }
    addNotification(
      'info',
      'Trade Returns & Log Reset',
      `Cleared previous closed trade returns and trade log. Active running positions preserved.`
    );
  }, [addNotification]);

  // Edit Coin Manual Trade Balance directly
  const updateManualBalance = useCallback(
    (newBalance: number) => {
      const clean = Math.max(0, Number(newBalance.toFixed(2)));
      setConfig((prev) => ({ ...prev, initialBalance: clean }));
      setCashBalance(clean);
      addNotification(
        'info',
        'Manual Trade Balance Updated',
        `Coin Manual Trade balance set to $${clean.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT.`
      );
    },
    [addNotification]
  );

  // Edit PnL Forecasting Balance directly
  const updateForecastBalance = useCallback(
    (newBalance: number) => {
      const clean = Math.max(0, Number(newBalance.toFixed(2)));
      setForecastBalance(clean);
      addNotification(
        'info',
        'PnL Forecasting Balance Updated',
        `PnL Forecasting account balance set to $${clean.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT.`
      );
    },
    [addNotification]
  );

  // Edit Grid-Based Auto Simulation Balance directly
  const updateGridBalance = useCallback(
    (newBalance: number) => {
      const clean = Math.max(0, Number(newBalance.toFixed(2)));
      setGridInitialBalance(clean);
      setGridCashBalance(clean);
      addNotification(
        'info',
        'Auto Grid Simulation Balance Updated',
        `Grid-Based Auto Simulation balance set to $${clean.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT.`
      );
    },
    [addNotification]
  );

  // Reset Grid-Based Auto Simulation only
  const resetGridSimulation = useCallback(
    (newBalance?: number) => {
      const balance = newBalance !== undefined ? Math.max(0, Number(newBalance.toFixed(2))) : gridInitialRef.current || 1000;
      setGridInitialBalance(balance);
      setGridCashBalance(balance);
      setPositions((prev) => prev.filter((p) => p.accountSource !== 'AUTO_GRID'));
      setLimitOrders((prev) => prev.filter((o) => o.accountSource !== 'AUTO_GRID'));
      setTradeHistory((prev) => prev.filter((t) => t.accountSource !== 'AUTO_GRID'));
      addNotification(
        'info',
        'Auto Grid Account Reset',
        `Grid-Based Auto Simulation reset with $${balance.toLocaleString()} USDT.`
      );
    },
    [addNotification]
  );

  // Reset entire simulation to initial funds
  const resetSimulation = useCallback(
    (newInitialBalance?: number) => {
      const balance = newInitialBalance || config.initialBalance;
      setConfig((prev) => ({ ...prev, initialBalance: balance }));
      setCashBalance(balance);
      setPositions([]);
      setLimitOrders([]);
      setTradeHistory([]);
      setSpotHoldings([]);
      addNotification(
        'info',
        'Simulator Reset',
        `Account refreshed with $${balance.toLocaleString()} virtual USDT.`
      );
    },
    [config.initialBalance, addNotification]
  );

  // Add virtual deposit / withdrawal
  const adjustCashBalance = useCallback(
    (deltaUsdt: number) => {
      setCashBalance((prev) => Math.max(0, prev + deltaUsdt));
      addNotification(
        'info',
        deltaUsdt >= 0 ? 'Funds Deposited' : 'Funds Withdrawn',
        `${deltaUsdt >= 0 ? '+' : '-'}$${Math.abs(deltaUsdt).toLocaleString()} USDT added to trading balance.`
      );
    },
    [addNotification]
  );

  const addPriceAlert = useCallback((symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => {
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substring(2, 9),
      assetSymbol: symbol,
      targetPrice,
      condition,
      createdAt: Date.now(),
      isActive: true,
      isTriggered: false,
    };
    setPriceAlerts((prev) => [newAlert, ...prev]);
    addNotification(
      'success',
      `Alert Set: ${symbol}`,
      `You will be notified when price goes ${condition.toLowerCase()} $${targetPrice.toLocaleString()}`
    );
  }, [addNotification]);

  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const togglePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  }, []);

  const clearPriceAlerts = useCallback(() => {
    setPriceAlerts([]);
    addNotification('info', 'Alerts Cleared', 'All price alerts have been cleared.');
  }, [addNotification]);

  // Portfolio aggregates (Manual Trade vs Auto Grid Simulation)
  const totalSpotValue = spotHoldings.reduce((acc, h) => {
    const p = assets[h.symbol]?.price || h.avgCostPrice;
    return acc + h.amount * p;
  }, 0);

  const manualPositions = positions.filter((p) => p.accountSource !== 'AUTO_GRID');
  const gridPositions = positions.filter((p) => p.accountSource === 'AUTO_GRID');

  const totalMarginLocked = manualPositions.reduce((acc, p) => acc + p.margin, 0);
  const totalLimitLocked = limitOrders.filter((o) => o.accountSource !== 'AUTO_GRID').reduce((acc, o) => acc + o.margin, 0);
  const totalUnrealizedPnL = manualPositions.reduce((acc, p) => {
    const asset = assets[p.assetSymbol];
    const price = asset ? asset.price : p.entryPrice;
    const isLong = p.side === 'LONG';
    const priceDiff = isLong ? price - p.entryPrice : p.entryPrice - price;
    return acc + p.amount * priceDiff;
  }, 0);

  // Net Manual Trade Portfolio Equity
  const totalEquity = cashBalance + totalMarginLocked + totalUnrealizedPnL + totalSpotValue;

  // Grid-Based Auto Simulation aggregates
  const gridMarginLocked = gridPositions.reduce((acc, p) => acc + p.margin, 0);
  const gridUnrealizedPnL = gridPositions.reduce((acc, p) => {
    const asset = assets[p.assetSymbol];
    const price = asset ? asset.price : p.entryPrice;
    const isLong = p.side === 'LONG';
    const priceDiff = isLong ? price - p.entryPrice : p.entryPrice - price;
    return acc + p.amount * priceDiff;
  }, 0);
  const gridTotalEquity = gridCashBalance + gridMarginLocked + gridUnrealizedPnL;

  // Realized stats
  const totalTrades = tradeHistory.length;
  const winningTrades = tradeHistory.filter((t) => t.realizedPnL > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalRealizedPnL = tradeHistory.reduce((acc, t) => acc + t.realizedPnL, 0);
  const totalFeesPaid = tradeHistory.reduce((acc, t) => acc + t.fees, 0) +
    positions.reduce((acc, p) => acc + p.feePaid, 0);

  // Gold Hedge Ratio calculation
  let totalGoldValue = 0;
  spotHoldings.forEach((h) => {
    if (assets[h.symbol]?.category === 'gold') {
      totalGoldValue += h.amount * (assets[h.symbol]?.price || h.avgCostPrice);
    }
  });
  positions.forEach((p) => {
    if (assets[p.assetSymbol]?.category === 'gold') {
      totalGoldValue += p.margin;
    }
  });
  const goldHedgeRatio = totalEquity > 0 ? (totalGoldValue / totalEquity) * 100 : 0;

  return {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    isLiveConnected,
    lastTickTime,
    notifications,
    dismissNotification,
    refreshPrices,
    // Balances & Analytics (Separate Manual Trade, PnL Forecasting, and Auto Grid Simulation)
    cashBalance,
    totalEquity,
    totalSpotValue,
    totalMarginLocked,
    totalLimitLocked,
    totalUnrealizedPnL,
    totalRealizedPnL,
    totalFeesPaid,
    winRate,
    totalTrades,
    goldHedgeRatio,
    // Separate PnL Forecasting Balance ($1,000 default, editable)
    forecastBalance,
    updateForecastBalance,
    // Separate Grid-Based Auto Simulation Balance ($1,000 default, editable)
    gridCashBalance,
    gridInitialBalance,
    gridMarginLocked,
    gridUnrealizedPnL,
    gridTotalEquity,
    updateGridBalance,
    resetGridSimulation,
    updateManualBalance,
    // Entities
    positions,
    limitOrders,
    tradeHistory,
    spotHoldings,
    priceAlerts,
    config,
    setConfig,
    // Actions
    placeOrder,
    closePosition,
    cancelLimitOrder,
    updatePositionSLTP,
    resetTradeHistory,
    resetSimulation,
    adjustCashBalance,
    addNotification,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    clearPriceAlerts,
  };
}
