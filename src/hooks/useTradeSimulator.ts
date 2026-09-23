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

const DEFAULT_CONFIG: SimulatorConfig = {
  initialBalance: 100,
  brokerName: SHARK_EXCHANGE.name, // 'Shark Exchange'
  takerFeeRate: SHARK_EXCHANGE.takerBrokerageRateDecimal, // 0.064% of trade value (4x maker)
  makerFeeRate: SHARK_EXCHANGE.makerBrokerageRateDecimal, // 0.016% of trade value (0.00016)
  slippageRate: 0.0004, // 0.04% average market slippage
  enableSlippage: true,
  enableFees: true,
};

const STORAGE_KEYS = {
  CONFIG: 'aurumx_config_v4',
  CASH: 'aurumx_cash_v2',
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

export function useTradeSimulator() {
  const [assets, setAssets] = useState<Record<string, MarketAsset>>(INITIAL_ASSETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('PAXG');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Simulator state
  const [config, setConfig] = useState<SimulatorConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
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
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
      localStorage.setItem(STORAGE_KEYS.LIMIT_ORDERS, JSON.stringify(limitOrders));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(tradeHistory));
      localStorage.setItem(STORAGE_KEYS.SPOT, JSON.stringify(spotHoldings));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(priceAlerts));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [cashBalance, positions, limitOrders, tradeHistory, spotHoldings, priceAlerts]);

  // Push notification helper
  const addNotification = useCallback((type: AlertNotification['type'], title: string, message: string) => {
    const newNotif: AlertNotification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 7)]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Initial REST fetch & periodic background refresh
  const refreshPrices = useCallback(async () => {
    try {
      const updated = await fetchLiveMarketData();
      setAssets((prev) => ({ ...prev, ...updated }));
      setIsLiveConnected(true);
      setLastTickTime(Date.now());
      checkTriggersAndOrders({ ...assetsRef.current, ...updated });
    } catch (err) {
      console.error('REST market refresh fallback failed', err);
    }
  }, []);

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, [refreshPrices]);

  // Real-time Exchange WebSocket Stream (Binance & Bitfinex)
  // Replaces all simulated random price jitter with 100% genuine live orderbook ticks!
  useEffect(() => {
    const unsubscribe = liveWebSocketFeed.subscribe((updates) => {
      setAssets((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.keys(updates).forEach((sym) => {
          const update = updates[sym];
          if (update && next[sym]) {
            changed = true;
            next[sym] = {
              ...next[sym],
              ...update,
              price: update.price !== undefined ? update.price : next[sym].price,
              lastUpdated: Date.now(),
            };
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
      let cashRefund = 0;

      for (const pos of currentPositions) {
        const asset = currentAssets[pos.assetSymbol];
        if (!asset) {
          remainingPositions.push(pos);
          continue;
        }

        const price = asset.price;
        const isLong = pos.side === 'LONG';
        const priceDiff = isLong ? price - pos.entryPrice : pos.entryPrice - price;
        const unrealizedPnL = pos.amount * priceDiff;
        const unrealizedPnLPercent = (unrealizedPnL / pos.margin) * 100;

        // Check Liquidation
        const isLiquidated = isLong
          ? price <= pos.liquidationPrice
          : price >= pos.liquidationPrice;

        if (isLiquidated) {
          // Liquidation triggers full margin loss
          closedRecords.push({
            id: Math.random().toString(36).substring(2, 9),
            assetSymbol: pos.assetSymbol,
            side: pos.side,
            mode: 'LEVERAGED',
            entryPrice: pos.entryPrice,
            exitPrice: pos.liquidationPrice,
            amount: pos.amount,
            leverage: pos.leverage,
            realizedPnL: -pos.margin,
            realizedPnLPercent: -100,
            fees: pos.feePaid,
            openTime: pos.openTime,
            closeTime: Date.now(),
            closeReason: 'LIQUIDATION',
          });
          addNotification(
            'danger',
            `Margin Call: ${pos.assetSymbol} Liquidated!`,
            `Your ${pos.leverage}x ${pos.side} position on ${pos.assetSymbol} reached liquidation price $${pos.liquidationPrice.toFixed(2)}. Loss: -$${pos.margin.toFixed(2)}`
          );
          continue;
        }

        // Check Take Profit
        const isTP = pos.takeProfitPrice && (
          isLong ? price >= pos.takeProfitPrice : price <= pos.takeProfitPrice
        );
        if (isTP && pos.takeProfitPrice) {
          const exitPrice = pos.takeProfitPrice;
          const exitDiff = isLong ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
          const pnl = pos.amount * exitDiff;
          const pnlPct = (pnl / pos.margin) * 100;
          cashRefund += pos.margin + pnl;

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
          });
          addNotification(
            'success',
            `Take-Profit Hit: ${pos.assetSymbol}`,
            `Position closed at target $${exitPrice.toFixed(2)}. Realized Profit: +$${pnl.toFixed(2)} (+${pnlPct.toFixed(1)}%)`
          );
          continue;
        }

        // Check Stop Loss
        const isSL = pos.stopLossPrice && (
          isLong ? price <= pos.stopLossPrice : price >= pos.stopLossPrice
        );
        if (isSL && pos.stopLossPrice) {
          const exitPrice = pos.stopLossPrice;
          const exitDiff = isLong ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
          const pnl = pos.amount * exitDiff;
          const pnlPct = (pnl / pos.margin) * 100;
          cashRefund += Math.max(0, pos.margin + pnl);

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
          });
          addNotification(
            'warning',
            `Stop-Loss Triggered: ${pos.assetSymbol}`,
            `Protected capital at $${exitPrice.toFixed(2)}. Realized PnL: -$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(1)}%)`
          );
          continue;
        }

        // Keep position active with live mark PnL
        remainingPositions.push({
          ...pos,
          unrealizedPnL,
          unrealizedPnLPercent,
        });
      }

      if (closedRecords.length > 0) {
        setPositions(remainingPositions);
        setTradeHistory((prev) => [...closedRecords, ...prev]);
        if (cashRefund > 0) {
          setCashBalance((prev) => prev + cashRefund);
        }
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

            // Leveraged position fill
            const isLong = order.side === 'BUY';
            const leverage = order.leverage;
            const mmr = 0.008;
            const liqPrice = isLong
              ? order.targetPrice * (1 - 1 / leverage + mmr)
              : order.targetPrice * (1 + 1 / leverage - mmr);

            const newPos: Position = {
              id: Math.random().toString(36).substring(2, 9),
              assetSymbol: order.assetSymbol,
              side: isLong ? 'LONG' : 'SHORT',
              entryPrice: order.targetPrice,
              amount: order.amount,
              margin: order.margin,
              leverage: order.leverage,
              liquidationPrice: liqPrice,
              takeProfitPrice: order.takeProfitPrice,
              stopLossPrice: order.stopLossPrice,
              openTime: Date.now(),
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
              feePaid: currentConfig.enableFees ? order.margin * leverage * currentConfig.makerFeeRate : 0,
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

  // Place Order Action (Market or Limit)
  const placeOrder = useCallback(
    (params: {
      symbol: string;
      mode: TradeMode;
      side: OrderSide;
      orderType: 'MARKET' | 'LIMIT';
      margin: number; // USDT margin allocated
      leverage: number; // 1 to 50
      targetPrice?: number;
      takeProfitPrice?: number;
      stopLossPrice?: number;
    }) => {
      const {
        symbol,
        mode,
        side,
        orderType,
        margin,
        leverage,
        targetPrice,
        takeProfitPrice,
        stopLossPrice,
      } = params;

      const currentAssets = assetsRef.current;
      const currentCash = cashRef.current;
      const currentConfig = configRef.current;
      const currentSpot = spotHoldingsRef.current;

      const asset = currentAssets[symbol];
      if (!asset) {
        addNotification('danger', 'Error', 'Asset not found');
        return false;
      }

      if (margin <= 0) {
        addNotification('warning', 'Invalid Margin', 'Please specify a positive trade margin amount.');
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

      // Check balance
      if (margin > currentCash) {
        addNotification(
          'danger',
          'Insufficient Funds',
          `Required: $${margin.toFixed(2)} USDT, Available: $${currentCash.toFixed(2)} USDT`
        );
        return false;
      }

      const notional = margin * (mode === 'SPOT' ? 1 : leverage);
      const isLong = side === 'BUY';

      // Estimate real-world slippage
      let execPrice = asset.price;
      if (orderType === 'MARKET' && currentConfig.enableSlippage) {
        const slippage = asset.price * currentConfig.slippageRate;
        execPrice = isLong ? asset.price + slippage : asset.price - slippage;
      }

      const amount = notional / execPrice;
      const feeRate = orderType === 'MARKET' ? currentConfig.takerFeeRate : currentConfig.makerFeeRate;
      const fee = currentConfig.enableFees ? notional * feeRate : 0;

      if (margin + fee > currentCash) {
        addNotification(
          'danger',
          'Insufficient Funds for Fees',
          `Order + fee: $${(margin + fee).toFixed(2)} USDT exceeds balance $${currentCash.toFixed(2)} USDT.`
        );
        return false;
      }

      // 1. LIMIT ORDER
      if (orderType === 'LIMIT') {
        if (!targetPrice || targetPrice <= 0) {
          addNotification('warning', 'Target Price Required', 'Please provide a valid limit target price.');
          return false;
        }

        const limitAmount = notional / targetPrice;
        const newLimit: LimitOrder = {
          id: Math.random().toString(36).substring(2, 9),
          assetSymbol: symbol,
          side,
          mode,
          targetPrice,
          amount: limitAmount,
          margin,
          leverage: mode === 'SPOT' ? 1 : leverage,
          takeProfitPrice,
          stopLossPrice,
          createdAt: Date.now(),
        };

        setCashBalance((prev) => prev - margin);
        setLimitOrders((prev) => [newLimit, ...prev]);
        addNotification(
          'info',
          `Limit Order Placed`,
          `${side} ${limitAmount.toFixed(4)} ${symbol} @ $${targetPrice.toFixed(2)} placed in order book.`
        );
        return true;
      }

      // 2. SPOT MARKET ORDER
      if (mode === 'SPOT') {
        if (side === 'BUY') {
          setCashBalance((prev) => prev - (margin + fee));
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
            `Bought ${amount.toFixed(4)} ${symbol} @ $${execPrice.toFixed(2)} (Fee: $${fee.toFixed(2)})`
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
          const sellFee = currentConfig.enableFees ? grossUsdt * currentConfig.takerFeeRate : 0;
          const netUsdt = grossUsdt - sellFee;
          const costBasis = sellAmount * holding.avgCostPrice;
          const pnl = grossUsdt - costBasis - sellFee;
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
          };

          setTradeHistory((prev) => [record, ...prev]);

          addNotification(
            pnl >= 0 ? 'success' : 'warning',
            `Spot Sold: ${symbol}`,
            `Sold ${sellAmount.toFixed(4)} ${symbol} @ $${execPrice.toFixed(2)}. Realized PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct.toFixed(1)}%)`
          );
          return true;
        }
      }

      // 3. LEVERAGED MARKET ORDER (Futures / Margin Long or Short)
      const mmr = 0.008; // 0.8% maintenance margin
      const liqPrice = isLong
        ? execPrice * (1 - 1 / leverage + mmr)
        : execPrice * (1 + 1 / leverage - mmr);

      const newPosition: Position = {
        id: Math.random().toString(36).substring(2, 9),
        assetSymbol: symbol,
        side: isLong ? 'LONG' : 'SHORT',
        entryPrice: execPrice,
        amount,
        margin,
        leverage,
        liquidationPrice: Math.max(0, liqPrice),
        takeProfitPrice,
        stopLossPrice,
        openTime: Date.now(),
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        feePaid: fee,
      };

      setCashBalance((prev) => prev - (margin + fee));
      setPositions((prev) => [newPosition, ...prev]);

      addNotification(
        'success',
        `Position Opened: ${symbol} ${leverage}x ${newPosition.side}`,
        `Filled @ $${execPrice.toFixed(2)} | Margin: $${margin.toFixed(2)} | Liq: $${liqPrice.toFixed(2)}`
      );
      return true;
    },
    [addNotification]
  );

  // Close Leveraged Position Manually (partial or full)
  const closePosition = useCallback(
    (positionId: string, percentage: number = 100) => {
      const pos = positionsRef.current.find((p) => p.id === positionId);
      if (!pos) return;

      const currentAssets = assetsRef.current;
      const currentConfig = configRef.current;
      const asset = currentAssets[pos.assetSymbol];
      const curPrice = asset ? asset.price : pos.entryPrice;

      // Realistic slippage on close
      let exitPrice = curPrice;
      if (currentConfig.enableSlippage) {
        const slippage = curPrice * currentConfig.slippageRate;
        exitPrice = pos.side === 'LONG' ? curPrice - slippage : curPrice + slippage;
      }

      const fraction = Math.min(100, Math.max(1, percentage)) / 100;
      const closedAmount = pos.amount * fraction;
      const closedMargin = pos.margin * fraction;

      const isLong = pos.side === 'LONG';
      const diff = isLong ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
      const grossPnL = closedAmount * diff;

      const closeFee = currentConfig.enableFees
        ? closedAmount * exitPrice * currentConfig.takerFeeRate
        : 0;

      const netPnL = grossPnL - closeFee;
      const netPnLPercent = (netPnL / closedMargin) * 100;
      const cashReturned = Math.max(0, closedMargin + netPnL);

      setCashBalance((prev) => prev + cashReturned);

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
        fees: pos.feePaid * fraction + closeFee,
        openTime: pos.openTime,
        closeTime: Date.now(),
        closeReason: 'MANUAL',
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
                }
              : p
          )
        );
      }

      addNotification(
        netPnL >= 0 ? 'success' : 'warning',
        `Closed ${pos.assetSymbol} ${pos.side}`,
        `Closed @ $${exitPrice.toFixed(2)}. Net PnL: ${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)} (${netPnLPercent.toFixed(1)}%)`
      );
    },
    [addNotification]
  );

  // Cancel Pending Limit Order
  const cancelLimitOrder = useCallback(
    (orderId: string) => {
      const order = limitOrdersRef.current.find((o) => o.id === orderId);
      if (!order) return;

      setCashBalance((prev) => prev + order.margin);
      setLimitOrders((prev) => prev.filter((o) => o.id !== orderId));
      addNotification('info', 'Order Cancelled', `Refunded $${order.margin.toFixed(2)} USDT collateral.`);
    },
    [addNotification]
  );

  // Update SL/TP of an active position
  const updatePositionSLTP = useCallback(
    (positionId: string, stopLoss?: number, takeProfit?: number) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId
            ? { ...p, stopLossPrice: stopLoss, takeProfitPrice: takeProfit }
            : p
        )
      );
      addNotification('success', 'Risk Levels Updated', 'Stop-Loss / Take-Profit parameters updated.');
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

  // Portfolio aggregates
  const totalSpotValue = spotHoldings.reduce((acc, h) => {
    const p = assets[h.symbol]?.price || h.avgCostPrice;
    return acc + h.amount * p;
  }, 0);

  const totalMarginLocked = positions.reduce((acc, p) => acc + p.margin, 0);
  const totalLimitLocked = limitOrders.reduce((acc, o) => acc + o.margin, 0);
  const totalUnrealizedPnL = positions.reduce((acc, p) => {
    const asset = assets[p.assetSymbol];
    const price = asset ? asset.price : p.entryPrice;
    const isLong = p.side === 'LONG';
    const priceDiff = isLong ? price - p.entryPrice : p.entryPrice - price;
    return acc + p.amount * priceDiff;
  }, 0);

  // Net Portfolio Equity
  const totalEquity = cashBalance + totalMarginLocked + totalUnrealizedPnL + totalSpotValue;

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
    // Balances & Analytics
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
    resetSimulation,
    adjustCashBalance,
    addNotification,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    clearPriceAlerts,
  };
}
