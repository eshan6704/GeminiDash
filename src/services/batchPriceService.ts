import { useState } from 'react';

export interface MultiAssetSymbol {
  symbol: string;
  name: string;
  basePrice: number;
  category: string;
  currency: string;
}

export const TOP_500_MULTI_ASSET_SYMBOLS: MultiAssetSymbol[] = [];

export function useTop500BatchPrices(intervalMs: number = 30000) {
  return {
    isLoading: false,
    totalSymbols: 0,
    latencyMs: 0,
    triggerBulkSync: async (manual: boolean = false) => {},
  };
}
