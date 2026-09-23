import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MarketAsset, PriceAlert } from '../types/trading';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  playAlertChime,
  NotificationPermState,
} from '../utils/browserNotifications';

export const STORAGE_KEY_ALERTS = 'aurumx_price_alerts_v1';

export function usePriceAlerts(
  asset: MarketAsset,
  allAssets?: Record<string, MarketAsset>,
  onNotify?: (type: 'success' | 'info' | 'warning' | 'danger', title: string, message: string) => void
) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [permState, setPermState] = useState<NotificationPermState>('default');

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const allAssetsRef = useRef(allAssets);
  allAssetsRef.current = allAssets;

  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  const assetRef = useRef(asset);
  assetRef.current = asset;

  // Initialize and check notification permission
  useEffect(() => {
    setPermState(getNotificationPermission());
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.warn('Failed to save alerts to storage', e);
    }
  }, [alerts]);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermState(res);
    if (res === 'granted') {
      sendBrowserNotification('🔔 Price Alerts Enabled', {
        body: 'Browser push notifications are active for target prices!',
      });
      if (onNotify) {
        onNotify('success', 'Browser Notifications Enabled', 'You will receive desktop alerts when targets are reached.');
      }
    } else if (res === 'denied') {
      if (onNotify) {
        onNotify('warning', 'Notifications Blocked', 'Please grant notification permission in your browser URL bar.');
      }
    }
    return res;
  }, [onNotify]);

  // Test notification sound and browser popup
  const testAlert = useCallback(() => {
    playAlertChime();
    if (permState === 'granted') {
      sendBrowserNotification(`🔔 Test Alert: ${asset.symbol} @ $${asset.price.toFixed(2)}`, {
        body: `Test notification successful! You will be alerted when ${asset.symbol} hits your targets.`,
      });
    }
    if (onNotify) {
      onNotify('info', `Test Alert Fired: ${asset.symbol}`, 'Chime played and notification dispatched.');
    }
  }, [asset.symbol, asset.price, permState, onNotify]);

  // Create new alert
  const createAlert = useCallback(
    (targetPrice: number, condition: 'ABOVE' | 'BELOW', note?: string) => {
      if (permState === 'default') {
        requestPermission();
      }

      const newAlert: PriceAlert = {
        id: Math.random().toString(36).substring(2, 9),
        symbol: asset.symbol,
        targetPrice,
        condition,
        initialPrice: asset.price,
        note: note ? note.trim() : undefined,
        createdAt: Date.now(),
        triggered: false,
      };

      setAlerts((prev) => [newAlert, ...prev]);

      if (onNotify) {
        onNotify(
          'success',
          `Alert Set: ${asset.symbol} ${condition === 'ABOVE' ? '≥' : '≤'} $${targetPrice.toFixed(2)}`,
          `Target registered. Desktop push & audio will trigger when hit.`
        );
      }
      return newAlert;
    },
    [asset.symbol, asset.price, permState, requestPermission, onNotify]
  );

  // Delete alert
  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Clear triggered history
  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  }, []);

  // REAL-TIME PRICE ALERT EVALUATION ENGINE
  useEffect(() => {
    // If no pending alerts exist, avoid any evaluation or state checks
    if (!alertsRef.current.some((a: PriceAlert) => !a.triggered)) return;

    const pool = allAssetsRef.current || { [assetRef.current.symbol]: assetRef.current };

    setAlerts((prevAlerts) => {
      let changed = false;
      const nextAlerts = prevAlerts.map((alert) => {
        if (alert.triggered) return alert;

        const currentData = pool[alert.symbol];
        if (!currentData) return alert;

        const currentPrice = currentData.price;
        const isHit =
          alert.condition === 'ABOVE'
            ? currentPrice >= alert.targetPrice
            : currentPrice <= alert.targetPrice;

        if (isHit) {
          changed = true;
          // 1. Desktop Browser Notification
          sendBrowserNotification(
            `🔔 Target Hit: ${alert.symbol} reached $${currentPrice.toFixed(2)}!`,
            {
              body: `${alert.symbol} has crossed your target price of $${alert.targetPrice.toFixed(
                2
              )} (${alert.condition === 'ABOVE' ? 'Crossed Above' : 'Fell Below'}).${
                alert.note ? ` Note: "${alert.note}"` : ''
              }`,
            }
          );

          // 2. In-app Alert Toast
          if (onNotifyRef.current) {
            onNotifyRef.current(
              'warning',
              `Target Price Reached: ${alert.symbol} @ $${currentPrice.toFixed(2)}`,
              `Your alert for $${alert.targetPrice.toFixed(2)} has been triggered!${
                alert.note ? ` (${alert.note})` : ''
              }`
            );
          }

          return {
            ...alert,
            triggered: true,
            triggeredAt: Date.now(),
            browserNotified: true,
          };
        }

        return alert;
      });

      return changed ? nextAlerts : prevAlerts;
    });
  }, [asset.price]);

  const activeAlertsThisAsset = useMemo(
    () => alerts.filter((a) => !a.triggered && a.symbol === asset.symbol),
    [alerts, asset.symbol]
  );

  const activeAlertsAll = useMemo(
    () => alerts.filter((a) => !a.triggered),
    [alerts]
  );

  const triggeredAlerts = useMemo(
    () => alerts.filter((a) => a.triggered),
    [alerts]
  );

  return {
    alerts,
    activeAlertsThisAsset,
    activeAlertsAll,
    triggeredAlerts,
    permState,
    requestPermission,
    testAlert,
    createAlert,
    deleteAlert,
    clearTriggered,
  };
}
