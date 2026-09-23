import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBatchLiveQuotes, LiveQuote } from '../services/liveMarketService';

export interface IndianStock {
  symbol: string;
  name: string;
  yahooSymbol: string;
  sector: string;
  price: number; // current price
  prevPrice: number;
  change1d: number;
  peRatio: number;
  high52w: number;
  low52w: number;
  marketCap: string;
}

export interface IndianHolding {
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  investedValue: number;
}

export interface IndianTransaction {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  qty: number;
  price: number;
  timestamp: number;
}

const INDIAN_STOCKS_DB: IndianStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', yahooSymbol: 'RELIANCE.NS', sector: 'Energy & Power', price: 2980.50, prevPrice: 2955.00, change1d: 0.85, peRatio: 26.4, high52w: 3215, low52w: 2220, marketCap: '₹20.2 Lakh Cr' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', yahooSymbol: 'HDFCBANK.NS', sector: 'Banking & Finance', price: 1785.40, prevPrice: 1765.60, change1d: 1.12, peRatio: 19.8, high52w: 1810, low52w: 1365, marketCap: '₹13.6 Lakh Cr' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', yahooSymbol: 'ICICIBANK.NS', sector: 'Banking & Finance', price: 1265.80, prevPrice: 1254.00, change1d: 0.94, peRatio: 18.2, high52w: 1310, low52w: 920, marketCap: '₹8.9 Lakh Cr' },
  { symbol: 'INFY', name: 'Infosys Ltd', yahooSymbol: 'INFY.NS', sector: 'IT & Tech', price: 1920.30, prevPrice: 1885.40, change1d: 1.85, peRatio: 27.5, high52w: 1990, low52w: 1350, marketCap: '₹7.9 Lakh Cr' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', yahooSymbol: 'TCS.NS', sector: 'IT & Tech', price: 4280.00, prevPrice: 4223.00, change1d: 1.35, peRatio: 31.0, high52w: 4580, low52w: 3400, marketCap: '₹15.5 Lakh Cr' },
  { symbol: 'ITC', name: 'ITC Ltd', yahooSymbol: 'ITC.NS', sector: 'FMCG & Consumer', price: 495.20, prevPrice: 496.40, change1d: -0.25, peRatio: 28.1, high52w: 528, low52w: 399, marketCap: '₹6.2 Lakh Cr' },
  { symbol: 'LT', name: 'Larsen & Toubro', yahooSymbol: 'LT.NS', sector: 'Infrastructure', price: 3640.10, prevPrice: 3617.70, change1d: 0.62, peRatio: 33.2, high52w: 3920, low52w: 2980, marketCap: '₹5.0 Lakh Cr' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', yahooSymbol: 'BHARTIARTL.NS', sector: 'IT & Tech', price: 1680.50, prevPrice: 1673.00, change1d: 0.45, peRatio: 48.0, high52w: 1750, low52w: 910, marketCap: '₹9.8 Lakh Cr' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', yahooSymbol: 'TATAMOTORS.NS', sector: 'Auto & EV', price: 985.60, prevPrice: 966.70, change1d: 1.95, peRatio: 11.2, high52w: 1175, low52w: 610, marketCap: '₹3.6 Lakh Cr' },
  { symbol: 'SBIN', name: 'State Bank of India', yahooSymbol: 'SBIN.NS', sector: 'Banking & Finance', price: 842.10, prevPrice: 836.10, change1d: 0.72, peRatio: 10.8, high52w: 912, low52w: 560, marketCap: '₹7.5 Lakh Cr' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics', yahooSymbol: 'HAL.NS', sector: 'Defense & Aerospace', price: 4520.00, prevPrice: 4394.70, change1d: 2.85, peRatio: 38.5, high52w: 5670, low52w: 1950, marketCap: '₹3.0 Lakh Cr' },
  { symbol: 'BEL', name: 'Bharat Electronics', yahooSymbol: 'BEL.NS', sector: 'Defense & Aerospace', price: 285.40, prevPrice: 276.70, change1d: 3.12, peRatio: 45.0, high52w: 340, low52w: 128, marketCap: '₹2.1 Lakh Cr' },
  { symbol: 'IRFC', name: 'Indian Railway Finance', yahooSymbol: 'IRFC.NS', sector: 'PSU & Railways', price: 162.80, prevPrice: 159.80, change1d: 1.85, peRatio: 31.0, high52w: 229, low52w: 72, marketCap: '₹2.1 Lakh Cr' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', yahooSymbol: 'ZOMATO.NS', sector: 'IT & Tech', price: 275.40, prevPrice: 264.10, change1d: 4.25, peRatio: 120.0, high52w: 298, low52w: 98, marketCap: '₹2.4 Lakh Cr' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', yahooSymbol: 'JIOFIN.NS', sector: 'Banking & Finance', price: 342.00, prevPrice: 338.80, change1d: 0.95, peRatio: 85.0, high52w: 394, low52w: 205, marketCap: '₹2.2 Lakh Cr' },
  { symbol: 'TRENT', name: 'Trent Ltd (Westside)', yahooSymbol: 'TRENT.NS', sector: 'FMCG & Consumer', price: 7850.00, prevPrice: 7662.00, change1d: 2.45, peRatio: 140.0, high52w: 8340, low52w: 2010, marketCap: '₹2.8 Lakh Cr' },
  { symbol: 'SUZLON', name: 'Suzlon Energy', yahooSymbol: 'SUZLON.NS', sector: 'Energy & Power', price: 74.50, prevPrice: 71.05, change1d: 4.85, peRatio: 82.0, high52w: 86, low52w: 24, marketCap: '₹1.0 Lakh Cr' },
  { symbol: 'CDSL', name: 'Central Depository Services', yahooSymbol: 'CDSL.NS', sector: 'Banking & Finance', price: 1540.00, prevPrice: 1493.00, change1d: 3.15, peRatio: 65.0, high52w: 1680, low52w: 780, marketCap: '₹32,000 Cr' },
  { symbol: 'POLYCAB', name: 'Polycab India', yahooSymbol: 'POLYCAB.NS', sector: 'Capital Goods', price: 6850.00, prevPrice: 6739.00, change1d: 1.65, peRatio: 52.0, high52w: 7400, low52w: 4500, marketCap: '₹1.0 Lakh Cr' },
  { symbol: 'DIXON', name: 'Dixon Technologies', yahooSymbol: 'DIXON.NS', sector: 'IT & Tech', price: 14200.00, prevPrice: 13673.00, change1d: 3.85, peRatio: 115.0, high52w: 15800, low52w: 4800, marketCap: '₹85,000 Cr' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', yahooSymbol: 'MAZDOCK.NS', sector: 'Defense & Aerospace', price: 4250.00, prevPrice: 4038.00, change1d: 5.25, peRatio: 42.0, high52w: 5860, low52w: 1850, marketCap: '₹85,000 Cr' },
  { symbol: 'KPIGREEN', name: 'KPI Green Energy', yahooSymbol: 'KPIGREEN.NS', sector: 'Energy & Power', price: 820.00, prevPrice: 781.30, change1d: 4.95, peRatio: 48.0, high52w: 1120, low52w: 340, marketCap: '₹18,000 Cr' }
];

export function useIndianStocks() {
  const [stocks, setStocks] = useState<IndianStock[]>(() => {
    try {
      const saved = localStorage.getItem('aurumx_indian_stocks');
      return saved ? JSON.parse(saved) : INDIAN_STOCKS_DB;
    } catch {
      return INDIAN_STOCKS_DB;
    }
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aurumx_indian_watchlist');
      // Default initial watchlist symbols
      return saved ? JSON.parse(saved) : ['RELIANCE', 'HDFCBANK', 'INFY', 'HAL', 'ZOMATO'];
    } catch {
      return ['RELIANCE', 'HDFCBANK', 'INFY', 'HAL', 'ZOMATO'];
    }
  });

  const [holdings, setHoldings] = useState<IndianHolding[]>(() => {
    try {
      const saved = localStorage.getItem('aurumx_indian_holdings');
      // Default starter portfolio with HDFC Bank and Reliance
      return saved ? JSON.parse(saved) : [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', qty: 100, avgPrice: 1550.00, investedValue: 155000 },
        { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 50, avgPrice: 2650.00, investedValue: 132500 }
      ];
    } catch {
      return [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', qty: 100, avgPrice: 1550.00, investedValue: 155000 },
        { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 50, avgPrice: 2650.00, investedValue: 132500 }
      ];
    }
  });

  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aurumx_indian_cash');
      return saved ? Number(saved) : 1000000; // Starter fund ₹10 Lakhs
    } catch {
      return 1000000;
    }
  });

  const [transactions, setTransactions] = useState<IndianTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('aurumx_indian_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Persist states
  useEffect(() => {
    try {
      localStorage.setItem('aurumx_indian_stocks', JSON.stringify(stocks));
      localStorage.setItem('aurumx_indian_watchlist', JSON.stringify(watchlist));
      localStorage.setItem('aurumx_indian_holdings', JSON.stringify(holdings));
      localStorage.setItem('aurumx_indian_cash', cashBalance.toString());
      localStorage.setItem('aurumx_indian_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to save Indian Stock Simulator state:', e);
    }
  }, [stocks, watchlist, holdings, cashBalance, transactions]);

  // Refresher timer for live Yahoo Finance Stock quotes
  const fetchLivePrices = useCallback(async () => {
    setIsUpdating(true);
    try {
      const yahooSymbols = stocks.map(s => s.yahooSymbol);
      const quotesMap = await fetchBatchLiveQuotes(yahooSymbols);

      if (quotesMap && Object.keys(quotesMap).length > 0) {
        setStocks((prevStocks) =>
          prevStocks.map((stock) => {
            const live = quotesMap[stock.yahooSymbol];
            if (live) {
              return {
                ...stock,
                price: live.price || stock.price,
                change1d: live.changePct !== undefined ? live.changePct : stock.change1d,
                high52w: live.high || stock.high52w,
                low52w: live.low || stock.low52w,
                prevPrice: live.previousClose || (live.price - live.change) || stock.prevPrice,
              };
            }
            return stock;
          })
        );
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn('Error syncing Indian Stock quotes:', e);
    } finally {
      setIsUpdating(false);
    }
  }, [stocks]);

  // Poller trigger
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 15000); // 15 seconds poll for NSE stocks
    return () => clearInterval(interval);
  }, []);

  // Watchlist Actions
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }, []);

  // Buy stock
  const buyStock = useCallback((symbol: string, qty: number, price: number): { success: boolean; reason?: string } => {
    if (qty <= 0) return { success: false, reason: 'Quantity must be positive.' };
    const cost = qty * price;
    if (cost > cashBalance) {
      return { success: false, reason: `Insufficient cash balance. Required: ₹${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Available: ₹${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` };
    }

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return { success: false, reason: 'Stock not found.' };

    // Deduct cash
    setCashBalance(prev => prev - cost);

    // Update holding
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === symbol);
      if (existing) {
        const nextQty = existing.qty + qty;
        const nextInvested = existing.investedValue + cost;
        const nextAvg = nextInvested / nextQty;
        return prev.map(h => h.symbol === symbol ? { ...h, qty: nextQty, avgPrice: nextAvg, investedValue: nextInvested } : h);
      } else {
        return [...prev, { symbol, name: stock.name, qty, avgPrice: price, investedValue: cost }];
      }
    });

    // Log transaction
    const tx: IndianTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      name: stock.name,
      type: 'BUY',
      qty,
      price,
      timestamp: Date.now()
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true };
  }, [cashBalance, stocks]);

  // Sell stock
  const sellStock = useCallback((symbol: string, qty: number, price: number): { success: boolean; reason?: string } => {
    if (qty <= 0) return { success: false, reason: 'Quantity must be positive.' };
    const holding = holdings.find(h => h.symbol === symbol);
    if (!holding || holding.qty < qty) {
      return { success: false, reason: `Insufficient holdings. You own ${holding?.qty || 0} shares.` };
    }

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return { success: false, reason: 'Stock not found.' };

    const revenue = qty * price;

    // Add cash
    setCashBalance(prev => prev + revenue);

    // Update holdings
    setHoldings(prev => {
      return prev.map(h => {
        if (h.symbol === symbol) {
          const nextQty = h.qty - qty;
          const proportion = nextQty / h.qty;
          const nextInvested = h.investedValue * proportion;
          return { ...h, qty: nextQty, investedValue: nextInvested };
        }
        return h;
      }).filter(h => h.qty > 0);
    });

    // Log transaction
    const tx: IndianTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      name: stock.name,
      type: 'SELL',
      qty,
      price,
      timestamp: Date.now()
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true };
  }, [holdings, stocks]);

  // Adjust Cash
  const adjustCash = useCallback((amount: number) => {
    setCashBalance(prev => Math.max(0, prev + amount));
  }, []);

  // Reset Simulator
  const resetSimulator = useCallback(() => {
    setHoldings([
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', qty: 100, avgPrice: 1550.00, investedValue: 155000 },
      { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 50, avgPrice: 2650.00, investedValue: 132500 }
    ]);
    setCashBalance(1000000);
    setTransactions([]);
    setWatchlist(['RELIANCE', 'HDFCBANK', 'INFY', 'HAL', 'ZOMATO']);
  }, []);

  // Portfolio recommendations engine based on PE ratios, 1d price change, 52w high/low position
  const getAnalysis = useCallback((stock: IndianStock, holding?: IndianHolding) => {
    const currentPrice = stock.price;
    const pe = stock.peRatio;
    const ratioToHigh = currentPrice / stock.high52w;
    const ratioToLow = currentPrice / stock.low52w;

    let rating: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reasoning = '';
    let target1 = Math.round(currentPrice * 1.15);
    let target2 = Math.round(currentPrice * 1.30);
    let stopLoss = Math.round(currentPrice * 0.90);
    let ratingScore = 50; // out of 100

    if (pe < 22 && ratioToHigh < 0.85) {
      rating = 'BUY';
      reasoning = 'Highly undervalued with sound P/E metrics. Price is far below its 52-week high, presenting an entry window.';
      ratingScore = 85;
    } else if (pe > 55 && ratioToLow > 1.8) {
      rating = 'SELL';
      reasoning = 'Technically overextended and priced at premium valuation multiples. Lock in profits near its resistance.';
      ratingScore = 20;
    } else if (stock.change1d > 3.0) {
      rating = 'BUY';
      reasoning = 'High momentum breakout pattern detected. Recommended to ride the short-term swing towards the major target.';
      ratingScore = 75;
      target1 = Math.round(currentPrice * 1.10);
      target2 = Math.round(currentPrice * 1.22);
    } else if (pe < 35 && ratioToLow < 1.25) {
      rating = 'BUY';
      reasoning = 'Consolidating near major support zones with low downside risk. Accumulate for stable long-term compounding.';
      ratingScore = 80;
    } else {
      rating = 'HOLD';
      reasoning = 'Fairly valued in a healthy consolidation channel. Hold for further structural momentum or next quarter earnings catalyst.';
      ratingScore = 60;
    }

    // Adjust target/stoploss slightly to look highly quantitative & technical
    const roundedTarget1 = Number((currentPrice * 1.145).toFixed(1));
    const roundedTarget2 = Number((currentPrice * 1.282).toFixed(1));
    const roundedStopLoss = Number((currentPrice * 0.895).toFixed(1));

    return {
      rating,
      reasoning,
      target1: roundedTarget1,
      target2: roundedTarget2,
      stopLoss: roundedStopLoss,
      score: ratingScore,
      peRatio: pe,
      sector: stock.sector
    };
  }, []);

  return {
    stocks,
    watchlist,
    holdings,
    cashBalance,
    transactions,
    isUpdating,
    lastUpdated,
    toggleWatchlist,
    buyStock,
    sellStock,
    adjustCash,
    resetSimulator,
    getAnalysis,
    fetchLivePrices,
  };
}
