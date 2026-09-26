import { useState } from 'react';

export function usePersistentSymbols() {
  const [prices, setPrices] = useState<Record<string, any>>({});
  return {
    isPersisted: false,
    symbolCount: 0,
    prices,
  };
}
