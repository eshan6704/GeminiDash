import { useCallback, useEffect, useRef } from 'react';
import { useTradeSimulator } from './useTradeSimulator';
import { useIndianStocks } from './useIndianStocks';
import { getAccessToken } from '../services/authService';

const SPREADSHEET_ID = '1DmPu-ddeeJN_Z3vcUsDyZ4ISZ8PeWgVxqbfs4lOZUgc';

export function useSheetsSync() {
  const tradeSimulator = useTradeSimulator();
  const indianStocks = useIndianStocks();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      console.warn('Sync failed: No auth token.');
      return;
    }

    // Collect all app data
    const snapshot = [
      ['Timestamp', new Date().toLocaleString()],
      ['---', '---'],
      ['Category', 'Symbol', 'Data'],
      ...tradeSimulator.positions.map(p => ['Crypto Position', p.assetSymbol, JSON.stringify(p)]),
      ...tradeSimulator.spotHoldings.map(h => ['Crypto Holding', h.symbol, JSON.stringify(h)]),
      ['Crypto Cash', 'USD', tradeSimulator.cashBalance],
      ...indianStocks.holdings.map(h => ['Indian Holding', h.symbol, JSON.stringify(h)]),
      ['Indian Cash', 'INR', indianStocks.cashBalance],
    ];

    try {
      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_ID,
          range: 'DataSnapshot!A1',
          values: snapshot
        }),
      });
      const result = await response.json();
      console.log('Sync successful:', result);
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, [tradeSimulator, indianStocks]);

  const enableAutoSync = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(performSync, 15 * 60 * 1000); // 15 mins
  }, [performSync]);

  return { performSync, enableAutoSync };
}
