import { COMPLETE_NSE_FNO_STOCKS } from './fnoStocksList';

export interface MarketTableRow {
  rank?: number;
  id: string;
  name: string;
  symbol: string;
  price: number;
  change1d: number;
  change1dPts?: number;
  category?: string;
  exchange?: string;
  sector?: string;
  tier?: string;
  currency?: string;
  marketCap?: number | string;
  high24h?: number;
  low24h?: number;
  peRatio?: number;
  volume24h?: number;
  status?: string;
  unit?: string;
  dataTimestamp?: number;
  updatedAtMs?: number;
  updatedAt?: string;
}

export const MASTER_GLOBAL_INDICES: MarketTableRow[] = [
  // US & Americas
  { id: 'sp500', name: 'S&P 500', symbol: 'US500', price: 5985.50, change1d: 0.42, change1dPts: 25.10, category: 'Cash Index', sector: 'US & Americas', high24h: 6005.00, low24h: 5952.00, status: 'OPEN', currency: 'USD' },
  { id: 'nasdaq100', name: 'NASDAQ 100', symbol: 'US100', price: 21180.25, change1d: 0.65, change1dPts: 136.80, category: 'Cash Index', sector: 'US & Americas', high24h: 21245.00, low24h: 21010.00, status: 'OPEN', currency: 'USD' },
  { id: 'dow30', name: 'Dow Jones Industrial Average', symbol: 'US30', price: 44150.80, change1d: 0.28, change1dPts: 123.40, category: 'Cash Index', sector: 'US & Americas', high24h: 44280.00, low24h: 43990.00, status: 'OPEN', currency: 'USD' },
  { id: 'russell2000', name: 'Russell 2000 Small Cap', symbol: 'US2000', price: 2385.40, change1d: -0.31, change1dPts: -7.42, category: 'Cash Index', sector: 'US & Americas', high24h: 2402.00, low24h: 2371.00, status: 'OPEN', currency: 'USD' },
  { id: 'vix', name: 'CBOE Volatility Index (VIX)', symbol: 'VIX', price: 14.25, change1d: -3.45, change1dPts: -0.51, category: 'Cash Index', sector: 'US & Americas', high24h: 15.10, low24h: 13.95, status: 'OPEN', currency: 'USD' },
  { id: 'tsx', name: 'S&P/TSX Composite (Canada)', symbol: 'TSX', price: 25140.60, change1d: 0.34, change1dPts: 85.20, category: 'Cash Index', sector: 'US & Americas', high24h: 25210.00, low24h: 25030.00, status: 'OPEN', currency: 'CAD' },
  { id: 'bovespa', name: 'Bovespa Index (Brazil)', symbol: 'BVSP', price: 128450.00, change1d: 0.52, change1dPts: 665.00, category: 'Cash Index', sector: 'US & Americas', high24h: 129100.00, low24h: 127600.00, status: 'OPEN', currency: 'BRL' },
  { id: 'ipc_mex', name: 'S&P/BMV IPC (Mexico)', symbol: 'MXX', price: 51280.40, change1d: -0.18, change1dPts: -92.50, category: 'Cash Index', sector: 'US & Americas', high24h: 51520.00, low24h: 51090.00, status: 'OPEN', currency: 'MXN' },

  // Europe
  { id: 'ftse100', name: 'FTSE 100 (UK)', symbol: 'UK100', price: 8295.40, change1d: 0.24, change1dPts: 19.85, category: 'Cash Index', sector: 'Europe', high24h: 8322.00, low24h: 8260.00, status: 'OPEN', currency: 'GBP' },
  { id: 'dax40', name: 'DAX 40 Performance (Germany)', symbol: 'GER40', price: 19480.75, change1d: 0.58, change1dPts: 112.30, category: 'Cash Index', sector: 'Europe', high24h: 19540.00, low24h: 19350.00, status: 'OPEN', currency: 'EUR' },
  { id: 'cac40', name: 'CAC 40 (France)', symbol: 'FRA40', price: 7435.20, change1d: -0.14, change1dPts: -10.45, category: 'Cash Index', sector: 'Europe', high24h: 7470.00, low24h: 7398.00, status: 'OPEN', currency: 'EUR' },
  { id: 'eurostoxx50', name: 'Euro Stoxx 50', symbol: 'EU50', price: 4915.60, change1d: 0.39, change1dPts: 19.10, category: 'Cash Index', sector: 'Europe', high24h: 4938.00, low24h: 4888.00, status: 'OPEN', currency: 'EUR' },
  { id: 'smi20', name: 'Swiss Market Index (SMI)', symbol: 'SWI20', price: 11890.30, change1d: 0.21, change1dPts: 24.90, category: 'Cash Index', sector: 'Europe', high24h: 11930.00, low24h: 11845.00, status: 'OPEN', currency: 'CHF' },
  { id: 'ibex35', name: 'IBEX 35 (Spain)', symbol: 'ESP35', price: 11680.50, change1d: 0.47, change1dPts: 54.60, category: 'Cash Index', sector: 'Europe', high24h: 11725.00, low24h: 11610.00, status: 'OPEN', currency: 'EUR' },
  { id: 'ftsemib', name: 'FTSE MIB (Italy)', symbol: 'ITA40', price: 34260.00, change1d: 0.33, change1dPts: 112.50, category: 'Cash Index', sector: 'Europe', high24h: 34410.00, low24h: 34090.00, status: 'OPEN', currency: 'EUR' },
  { id: 'aex25', name: 'AEX Index (Netherlands)', symbol: 'NED25', price: 892.45, change1d: 0.44, change1dPts: 3.91, category: 'Cash Index', sector: 'Europe', high24h: 896.80, low24h: 887.20, status: 'OPEN', currency: 'EUR' },

  // Asia-Pacific
  { id: 'giftnifty', name: 'GIFT NIFTY (SGX / NSE IX)', symbol: 'GIFTNIFTY', price: 24385.50, change1d: 0.48, change1dPts: 116.50, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 24450.00, low24h: 24260.00, status: 'OPEN', currency: 'INR' },
  { id: 'nikkei225', name: 'Nikkei 225 (Japan)', symbol: 'JP225', price: 38940.00, change1d: 0.72, change1dPts: 278.40, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 39120.00, low24h: 38650.00, status: 'OPEN', currency: 'JPY' },
  { id: 'hangseng', name: 'Hang Seng Index (Hong Kong)', symbol: 'HK50', price: 19860.40, change1d: -0.54, change1dPts: -107.80, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 20040.00, low24h: 19740.00, status: 'OPEN', currency: 'HKD' },
  { id: 'shanghai', name: 'Shanghai Composite (China)', symbol: 'CN50', price: 3345.80, change1d: 0.31, change1dPts: 10.35, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 3368.00, low24h: 3322.00, status: 'OPEN', currency: 'CNY' },
  { id: 'kospi', name: 'KOSPI Composite (South Korea)', symbol: 'KR200', price: 2542.60, change1d: 0.38, change1dPts: 9.62, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 2558.00, low24h: 2526.00, status: 'OPEN', currency: 'KRW' },
  { id: 'asx200', name: 'S&P/ASX 200 (Australia)', symbol: 'AU200', price: 8340.20, change1d: 0.29, change1dPts: 24.10, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 8368.00, low24h: 8305.00, status: 'OPEN', currency: 'AUD' },
  { id: 'taiex', name: 'TAIEX Weighted (Taiwan)', symbol: 'TW50', price: 23190.50, change1d: 0.84, change1dPts: 193.20, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 23280.00, low24h: 23010.00, status: 'OPEN', currency: 'TWD' },
  { id: 'sti', name: 'Straits Times Index (Singapore)', symbol: 'STI', price: 3742.80, change1d: 0.19, change1dPts: 7.10, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 3756.00, low24h: 3728.00, status: 'OPEN', currency: 'SGD' },
  { id: 'set_index', name: 'SET Index (Thailand)', symbol: 'SET', price: 1450.20, change1d: 0.12, change1dPts: 1.70, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 1462.00, low24h: 1445.00, status: 'OPEN', currency: 'THB' },
  { id: 'klci_index', name: 'FTSE Bursa Malaysia KLCI', symbol: 'KLCI', price: 1625.50, change1d: -0.05, change1dPts: -0.80, category: 'Cash Index', sector: 'Asia-Pacific', high24h: 1632.00, low24h: 1621.00, status: 'OPEN', currency: 'MYR' },
];

export const MASTER_FUTURES: MarketTableRow[] = [
  { id: 'es_fut', name: 'E-Mini S&P 500 Futures (CME)', symbol: 'ES1!', price: 6012.25, change1d: 0.45, change1dPts: 27.00, category: 'Futures', sector: 'US & Americas', high24h: 6030.00, low24h: 5978.00, status: 'OPEN', currency: 'USD' },
  { id: 'nq_fut', name: 'E-Mini Nasdaq 100 Futures (CME)', symbol: 'NQ1!', price: 21265.50, change1d: 0.68, change1dPts: 143.50, category: 'Futures', sector: 'US & Americas', high24h: 21330.00, low24h: 21095.00, status: 'OPEN', currency: 'USD' },
  { id: 'ym_fut', name: 'E-Mini Dow Jones ($5) Futures', symbol: 'YM1!', price: 44290.00, change1d: 0.31, change1dPts: 136.00, category: 'Futures', sector: 'US & Americas', high24h: 44410.00, low24h: 44120.00, status: 'OPEN', currency: 'USD' },
  { id: 'rty_fut', name: 'E-Mini Russell 2000 Futures', symbol: 'RTY1!', price: 2394.80, change1d: -0.28, change1dPts: -6.70, category: 'Futures', sector: 'US & Americas', high24h: 2412.00, low24h: 2380.00, status: 'OPEN', currency: 'USD' },
  { id: 'dxy_fut', name: 'US Dollar Index Futures (ICE)', symbol: 'DX1!', price: 105.42, change1d: 0.18, change1dPts: 0.19, category: 'Futures', sector: 'US & Americas', high24h: 105.75, low24h: 105.10, status: 'OPEN', currency: 'USD' },
  { id: 'zn_fut', name: 'US 10-Year T-Note Futures (CBOT)', symbol: 'ZN1!', price: 110.15, change1d: -0.12, change1dPts: -0.13, category: 'Futures', sector: 'US & Americas', high24h: 110.48, low24h: 109.92, status: 'OPEN', currency: 'USD' },
  { id: 'zb_fut', name: 'US 30-Year T-Bond Futures (CBOT)', symbol: 'ZB1!', price: 117.62, change1d: -0.22, change1dPts: -0.26, category: 'Futures', sector: 'US & Americas', high24h: 118.10, low24h: 117.20, status: 'OPEN', currency: 'USD' },
  { id: 'btc_fut', name: 'CME Bitcoin Reference Futures', symbol: 'BTC1!', price: 96850.00, change1d: 1.85, change1dPts: 1760.00, category: 'Futures', sector: 'US & Americas', high24h: 97600.00, low24h: 94900.00, status: 'OPEN', currency: 'USD' },
  { id: 'eth_fut', name: 'CME Ether Reference Futures', symbol: 'ETH1!', price: 3472.50, change1d: 1.42, change1dPts: 48.60, category: 'Futures', sector: 'US & Americas', high24h: 3525.00, low24h: 3410.00, status: 'OPEN', currency: 'USD' },
  { id: 'fdax_fut', name: 'Eurex DAX Futures', symbol: 'FDAX1!', price: 19515.00, change1d: 0.61, change1dPts: 118.00, category: 'Futures', sector: 'Europe', high24h: 19580.00, low24h: 19380.00, status: 'OPEN', currency: 'EUR' },
  { id: 'fesx_fut', name: 'Eurex Euro Stoxx 50 Futures', symbol: 'FESX1!', price: 4928.00, change1d: 0.41, change1dPts: 20.00, category: 'Futures', sector: 'Europe', high24h: 4950.00, low24h: 4895.00, status: 'OPEN', currency: 'EUR' },
  { id: 'nkd_fut', name: 'CME Nikkei 225 USD Futures', symbol: 'NKD1!', price: 39020.00, change1d: 0.75, change1dPts: 290.00, category: 'Futures', sector: 'Asia-Pacific', high24h: 39210.00, low24h: 38720.00, status: 'OPEN', currency: 'USD' },
  { id: 'cl_fut', name: 'Crude Oil WTI Futures', symbol: 'CL1!', price: 71.50, change1d: 0.90, change1dPts: 0.65, category: 'Futures', sector: 'Commodities', high24h: 72.30, low24h: 70.80, status: 'OPEN', currency: 'USD' },
  { id: 'gc_fut', name: 'Gold Comex Futures', symbol: 'GC1!', price: 2675.00, change1d: 0.45, change1dPts: 12.00, category: 'Futures', sector: 'Commodities', high24h: 2690.00, low24h: 2660.00, status: 'OPEN', currency: 'USD' },
  { id: 'si_fut', name: 'Silver Comex Futures', symbol: 'SI1!', price: 31.50, change1d: -0.25, change1dPts: -0.08, category: 'Futures', sector: 'Commodities', high24h: 31.90, low24h: 31.10, status: 'OPEN', currency: 'USD' },
];

export const MASTER_FOREX: MarketTableRow[] = [
  // G10 Majors
  { id: 'eurusd', name: 'Euro / US Dollar', symbol: 'EUR/USD', price: 1.0542, change1d: -0.18, category: 'Major', high24h: 1.0588, low24h: 1.0512 },
  { id: 'usdjpy', name: 'US Dollar / Japanese Yen', symbol: 'USD/JPY', price: 154.28, change1d: 0.42, category: 'Major', high24h: 154.85, low24h: 153.60 },
  { id: 'gbpusd', name: 'British Pound / US Dollar', symbol: 'GBP/USD', price: 1.2685, change1d: 0.14, category: 'Major', high24h: 1.2730, low24h: 1.2640 },
  { id: 'usdchf', name: 'US Dollar / Swiss Franc', symbol: 'USD/CHF', price: 0.8834, change1d: 0.11, category: 'Major', high24h: 0.8865, low24h: 0.8802 },
  { id: 'audusd', name: 'Australian Dollar / US Dollar', symbol: 'AUD/USD', price: 0.6518, change1d: -0.24, category: 'Major', high24h: 0.6552, low24h: 0.6495 },
  { id: 'usdcad', name: 'US Dollar / Canadian Dollar', symbol: 'USD/CAD', price: 1.3982, change1d: 0.19, category: 'Major', high24h: 1.4018, low24h: 1.3945 },
  { id: 'nzdusd', name: 'New Zealand Dollar / US Dollar', symbol: 'NZD/USD', price: 0.5892, change1d: -0.31, category: 'Major', high24h: 0.5925, low24h: 0.5870 },

  // Minor Crosses
  { id: 'eurgbp', name: 'Euro / British Pound', symbol: 'EUR/GBP', price: 0.8311, change1d: -0.29, category: 'Minor Cross', high24h: 0.8342, low24h: 0.8295 },
  { id: 'eurjpy', name: 'Euro / Japanese Yen', symbol: 'EUR/JPY', price: 162.64, change1d: 0.24, category: 'Minor Cross', high24h: 163.20, low24h: 161.95 },
  { id: 'gbpjpy', name: 'British Pound / Japanese Yen', symbol: 'GBP/JPY', price: 195.71, change1d: 0.56, category: 'Minor Cross', high24h: 196.45, low24h: 194.80 },
  { id: 'eurchf', name: 'Euro / Swiss Franc', symbol: 'EUR/CHF', price: 0.9313, change1d: -0.08, category: 'Minor Cross', high24h: 0.9340, low24h: 0.9290 },
  { id: 'audjpy', name: 'Australian Dollar / Japanese Yen', symbol: 'AUD/JPY', price: 100.56, change1d: 0.18, category: 'Minor Cross', high24h: 101.05, low24h: 99.98 },
  { id: 'chfjpy', name: 'Swiss Franc / Japanese Yen', symbol: 'CHF/JPY', price: 174.64, change1d: 0.31, category: 'Minor Cross', high24h: 175.30, low24h: 173.90 },
  { id: 'euraud', name: 'Euro / Australian Dollar', symbol: 'EUR/AUD', price: 1.6174, change1d: 0.09, category: 'Minor Cross', high24h: 1.6230, low24h: 1.6115 },
  { id: 'gbpaud', name: 'British Pound / Australian Dollar', symbol: 'GBP/AUD', price: 1.9462, change1d: 0.38, category: 'Minor Cross', high24h: 1.9540, low24h: 1.9380 },
  { id: 'eurcad', name: 'Euro / Canadian Dollar', symbol: 'EUR/CAD', price: 1.4740, change1d: 0.04, category: 'Minor Cross', high24h: 1.4790, low24h: 1.4695 },

  // Emerging & INR Pairs
  { id: 'usdinr', name: 'US Dollar / Indian Rupee', symbol: 'USD/INR', price: 84.42, change1d: 0.08, category: 'Emerging', high24h: 84.52, low24h: 84.31 },
  { id: 'eurinr', name: 'Euro / Indian Rupee', symbol: 'EUR/INR', price: 88.99, change1d: -0.11, category: 'Emerging', high24h: 89.32, low24h: 88.74 },
  { id: 'gbpinr', name: 'British Pound / Indian Rupee', symbol: 'GBP/INR', price: 107.09, change1d: 0.22, category: 'Emerging', high24h: 107.48, low24h: 106.72 },
  { id: 'jpyinr', name: 'Japanese Yen / Indian Rupee', symbol: 'JPY/INR', price: 0.5472, change1d: -0.34, category: 'Emerging', high24h: 0.5510, low24h: 0.5445 },
  { id: 'aedinr', name: 'UAE Dirham / Indian Rupee', symbol: 'AED/INR', price: 22.98, change1d: 0.06, category: 'Emerging', high24h: 23.04, low24h: 22.93 },
  { id: 'sgdinr', name: 'Singapore Dollar / Indian Rupee', symbol: 'SGD/INR', price: 63.12, change1d: -0.05, category: 'Emerging', high24h: 63.35, low24h: 62.94 },
  { id: 'usdcnh', name: 'US Dollar / Offshore Chinese Yuan', symbol: 'USD/CNH', price: 7.2415, change1d: 0.15, category: 'Emerging', high24h: 7.2560, low24h: 7.2280 },
  { id: 'usdsgd', name: 'US Dollar / Singapore Dollar', symbol: 'USD/SGD', price: 1.3375, change1d: 0.12, category: 'Emerging', high24h: 1.3410, low24h: 1.3340 },
  { id: 'usdmxn', name: 'US Dollar / Mexican Peso', symbol: 'USD/MXN', price: 20.3450, change1d: 0.48, category: 'Emerging', high24h: 20.4800, low24h: 20.1900 },
  { id: 'usdzar', name: 'US Dollar / South African Rand', symbol: 'USD/ZAR', price: 18.1240, change1d: -0.26, category: 'Emerging', high24h: 18.2600, low24h: 18.0100 },
  { id: 'usdbrl', name: 'US Dollar / Brazilian Real', symbol: 'USD/BRL', price: 5.4520, change1d: 0.15, category: 'Emerging', high24h: 5.4850, low24h: 5.4210 },
  { id: 'usdmxn_pair', name: 'US Dollar / Mexican Peso', symbol: 'USD/MXN', price: 20.3540, change1d: 0.45, category: 'Emerging', high24h: 20.4800, low24h: 20.2100 },
];

export const MASTER_COMMODITIES: MarketTableRow[] = [
  // Energy
  { id: 'oil_wti', name: 'Crude Oil WTI (NYMEX)', symbol: 'CL', price: 71.45, change1d: 0.85, category: 'Energy', unit: 'USD / Barrel', high24h: 72.30, low24h: 70.60 },
  { id: 'oil_brent', name: 'Brent Crude Oil (ICE)', symbol: 'BZ', price: 75.28, change1d: 0.78, category: 'Energy', unit: 'USD / Barrel', high24h: 76.10, low24h: 74.45 },
  { id: 'natgas', name: 'Henry Hub Natural Gas', symbol: 'NG', price: 2.84, change1d: -1.20, category: 'Energy', unit: 'USD / MMBtu', high24h: 2.93, low24h: 2.78 },
  { id: 'rbob_gas', name: 'RBOB Gasoline Futures', symbol: 'RB', price: 2.06, change1d: 0.64, category: 'Energy', unit: 'USD / Gallon', high24h: 2.09, low24h: 2.03 },
  { id: 'heating_oil', name: 'ULSD Heating Oil Futures', symbol: 'HO', price: 2.28, change1d: 0.52, category: 'Energy', unit: 'USD / Gallon', high24h: 2.32, low24h: 2.25 },

  // Precious Metals
  { id: 'gold', name: 'Gold Spot / COMEX', symbol: 'GC', price: 2668.40, change1d: 0.42, category: 'Precious Metals', unit: 'USD / Troy Oz', high24h: 2682.00, low24h: 2651.00 },
  { id: 'silver', name: 'Silver Spot / COMEX', symbol: 'SI', price: 31.42, change1d: -0.35, category: 'Precious Metals', unit: 'USD / Troy Oz', high24h: 31.85, low24h: 31.05 },
  { id: 'platinum', name: 'Platinum Futures (NYMEX)', symbol: 'PL', price: 968.50, change1d: 0.62, category: 'Precious Metals', unit: 'USD / Troy Oz', high24h: 978.00, low24h: 958.00 },
  { id: 'palladium', name: 'Palladium Futures (NYMEX)', symbol: 'PA', price: 1012.80, change1d: 1.15, category: 'Precious Metals', unit: 'USD / Troy Oz', high24h: 1028.00, low24h: 996.00 },

  // Industrial Metals
  { id: 'copper', name: 'High Grade Copper (COMEX)', symbol: 'HG', price: 4.18, change1d: 0.55, category: 'Industrial Metals', unit: 'USD / Lb', high24h: 4.24, low24h: 4.13 },
  { id: 'aluminum', name: 'Aluminum Futures (COMEX/LME)', symbol: 'ALI', price: 2615.00, change1d: 0.38, category: 'Industrial Metals', unit: 'USD / Metric Ton', high24h: 2640.00, low24h: 2592.00 },
  { id: 'zinc', name: 'Zinc Special High Grade (LME)', symbol: 'ZNC', price: 3045.00, change1d: -0.28, category: 'Industrial Metals', unit: 'USD / Metric Ton', high24h: 3080.00, low24h: 3018.00 },
  { id: 'nickel', name: 'Primary Nickel (LME)', symbol: 'NICKEL', price: 15920.00, change1d: -0.64, category: 'Industrial Metals', unit: 'USD / Metric Ton', high24h: 16150.00, low24h: 15780.00 },
  { id: 'iron_ore', name: 'Iron Ore 62% Fe CFR (SGX)', symbol: 'TIO', price: 102.40, change1d: 0.92, category: 'Industrial Metals', unit: 'USD / Dry Metric Ton', high24h: 103.80, low24h: 101.10 },

  // Agriculture
  { id: 'wheat', name: 'Chicago SRW Wheat (CBOT)', symbol: 'ZW', price: 562.50, change1d: -0.45, category: 'Agriculture', unit: 'USd / Bushel', high24h: 569.00, low24h: 557.00 },
  { id: 'corn', name: 'Corn Futures (CBOT)', symbol: 'ZC', price: 428.75, change1d: 0.32, category: 'Agriculture', unit: 'USd / Bushel', high24h: 433.00, low24h: 425.00 },
  { id: 'soybeans', name: 'Soybeans Futures (CBOT)', symbol: 'ZS', price: 994.25, change1d: -0.18, category: 'Agriculture', unit: 'USd / Bushel', high24h: 1004.00, low24h: 988.00 },
  { id: 'coffee', name: 'Coffee Arabica (ICE)', symbol: 'KC', price: 284.60, change1d: 1.45, category: 'Agriculture', unit: 'USd / Lb', high24h: 288.50, low24h: 279.80 },
  { id: 'sugar_ice', name: 'Sugar #11 World (ICE)', symbol: 'SB', price: 21.65, change1d: 0.48, category: 'Agriculture', unit: 'USd / Lb', high24h: 21.92, low24h: 21.40 },
  { id: 'cotton_ice', name: 'Cotton #2 Futures (ICE)', symbol: 'CT', price: 71.20, change1d: -0.22, category: 'Agriculture', unit: 'USd / Lb', high24h: 71.85, low24h: 70.65 },
  { id: 'cocoa', name: 'Cocoa Futures (ICE)', symbol: 'CC', price: 8450.00, change1d: 1.82, category: 'Agriculture', unit: 'USD / Metric Ton', high24h: 8590.00, low24h: 8290.00 },
  { id: 'sugar_fut', name: 'Sugar #11 Futures', symbol: 'SB', price: 21.65, change1d: 0.45, category: 'Agriculture', unit: 'USd / Lb', high24h: 21.95, low24h: 21.40 },
  { id: 'cotton_fut', name: 'Cotton #2 Futures', symbol: 'CT', price: 71.20, change1d: -0.15, category: 'Agriculture', unit: 'USd / Lb', high24h: 71.85, low24h: 70.60 },
];

export const MASTER_INDIAN_INDICES: MarketTableRow[] = [
  { id: 'nifty50', name: 'NIFTY 50', symbol: 'NIFTY 50', price: 24320.50, change1d: 0.45, change1dPts: 108.20, category: 'Benchmark', status: 'Active' },
  { id: 'banknifty', name: 'NIFTY BANK', symbol: 'BANKNIFTY', price: 51240.30, change1d: -0.15, change1dPts: -76.40, category: 'Benchmark', status: 'Active' },
  { id: 'nifty500', name: 'NIFTY 500', symbol: 'NIFTY 500', price: 22850.40, change1d: 0.52, change1dPts: 118.50, category: 'Broad Market', status: 'Active' },
  { id: 'midcap100', name: 'NIFTY MIDCAP 100', symbol: 'MIDCAP100', price: 58200.00, change1d: 0.85, change1dPts: 492.30, category: 'Broad Market', status: 'Active' },
  { id: 'smallcap100', name: 'NIFTY SMALLCAP 100', symbol: 'SMALLCAP100', price: 18450.00, change1d: -0.24, change1dPts: -44.20, category: 'Broad Market', status: 'Active' },
];

export const MASTER_NIFTY_500: MarketTableRow[] = COMPLETE_NSE_FNO_STOCKS.map((s, idx) => ({
  rank: idx + 1,
  id: s.symbol.toLowerCase(),
  name: s.name,
  symbol: s.symbol,
  price: s.defaultPrice,
  change1d: 0.45,
  exchange: 'NSE',
  sector: s.sector as any,
  tier: idx < 50 ? 'Nifty 50' : idx < 100 ? 'Nifty Next 50' : 'Nifty Midcap 150',
  currency: 'INR',
  marketCap: `₹${Math.round(100000 / (idx + 1))} Cr`,
  peRatio: Number((20 + Math.random() * 15).toFixed(2)),
}));

export const PREFERENCE_COIN_SYMBOLS = ['BTC', 'XAUT', 'PAXG', 'ZEC', 'SOL', 'CL', 'XAG'] as const;

const BINANCE_CRYPTO_SEEDS: {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  category: string;
}[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 96500, marketCap: 1910000000000, category: 'Layer 1' },
  { symbol: 'XAUT', name: 'Tether Gold', price: 4335.5, marketCap: 1920000000, category: 'Gold & RWA' },
  { symbol: 'PAXG', name: 'PAX Gold', price: 4332.2, marketCap: 1880000000, category: 'Gold & RWA' },
  { symbol: 'ZEC', name: 'Zcash', price: 48.5, marketCap: 790000000, category: 'Layer 1' },
  { symbol: 'SOL', name: 'Solana', price: 210, marketCap: 98500000000, category: 'Layer 1' },
  { symbol: 'CL', name: 'Crude Oil (WTI)', price: 71.45, marketCap: 145000000000, category: 'Gold & RWA' },
  { symbol: 'XAG', name: 'Silver (XAG)', price: 31.42, marketCap: 18200000000, category: 'Gold & RWA' },
  { symbol: 'ETH', name: 'Ethereum', price: 3450, marketCap: 415000000000, category: 'Layer 1' },
  { symbol: 'XRP', name: 'Ripple', price: 1.85, marketCap: 106000000000, category: 'Layer 1' },
  { symbol: 'BNB', name: 'Binance Coin', price: 620, marketCap: 91000000000, category: 'Layer 1' },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.28, marketCap: 41200000000, category: 'Meme' },
  { symbol: 'ADA', name: 'Cardano', price: 0.85, marketCap: 30200000000, category: 'Layer 1' },
  { symbol: 'TRX', name: 'TRON', price: 0.24, marketCap: 20800000000, category: 'Layer 1' },
  { symbol: 'AVAX', name: 'Avalanche', price: 38.4, marketCap: 15800000000, category: 'Layer 1' },
  { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000024, marketCap: 14100000000, category: 'Meme' },
  { symbol: 'TON', name: 'Toncoin', price: 5.45, marketCap: 13800000000, category: 'Layer 1' },
  { symbol: 'LINK', name: 'Chainlink', price: 18.6, marketCap: 11700000000, category: 'DeFi' },
  { symbol: 'DOT', name: 'Polkadot', price: 7.4, marketCap: 10500000000, category: 'Layer 1' },
  { symbol: 'SUI', name: 'Sui', price: 3.35, marketCap: 9600000000, category: 'Layer 1' },
  { symbol: 'BCH', name: 'Bitcoin Cash', price: 465, marketCap: 9200000000, category: 'Layer 1' },
  { symbol: 'LTC', name: 'Litecoin', price: 102.5, marketCap: 7700000000, category: 'Layer 1' },
  { symbol: 'PEPE', name: 'Pepe', price: 0.000018, marketCap: 7600000000, category: 'Meme' },
  { symbol: 'NEAR', name: 'NEAR Protocol', price: 5.85, marketCap: 7100000000, category: 'AI' },
  { symbol: 'APT', name: 'Aptos', price: 11.4, marketCap: 6100000000, category: 'Layer 1' },
  { symbol: 'UNI', name: 'Uniswap', price: 9.85, marketCap: 5950000000, category: 'DeFi' },
  { symbol: 'ICP', name: 'Internet Computer', price: 10.9, marketCap: 5150000000, category: 'Web3' },
  { symbol: 'RENDER', name: 'Render', price: 7.65, marketCap: 3950000000, category: 'AI' },
  { symbol: 'POL', name: 'Polygon', price: 0.49, marketCap: 3900000000, category: 'Layer 2' },
  { symbol: 'FET', name: 'Artificial Superintelligence', price: 1.46, marketCap: 3720000000, category: 'AI' },
  { symbol: 'TAO', name: 'Bittensor', price: 485, marketCap: 3580000000, category: 'AI' },
  { symbol: 'ETC', name: 'Ethereum Classic', price: 27.4, marketCap: 4100000000, category: 'Layer 1' },
  { symbol: 'XLM', name: 'Stellar', price: 0.42, marketCap: 12100000000, category: 'Layer 1' },
  { symbol: 'HBAR', name: 'Hedera', price: 0.26, marketCap: 9800000000, category: 'Layer 1' },
  { symbol: 'FIL', name: 'Filecoin', price: 5.4, marketCap: 3300000000, category: 'Web3' },
  { symbol: 'ATOM', name: 'Cosmos', price: 6.8, marketCap: 2650000000, category: 'Layer 1' },
  { symbol: 'ARB', name: 'Arbitrum', price: 0.74, marketCap: 2950000000, category: 'Layer 2' },
  { symbol: 'MNT', name: 'Mantle', price: 0.88, marketCap: 2920000000, category: 'Layer 2' },
  { symbol: 'AAVE', name: 'Aave', price: 168, marketCap: 2520000000, category: 'DeFi' },
  { symbol: 'WIF', name: 'dogwifhat', price: 2.42, marketCap: 2410000000, category: 'Meme' },
  { symbol: 'OP', name: 'Optimism', price: 1.78, marketCap: 2280000000, category: 'Layer 2' },
  { symbol: 'INJ', name: 'Injective', price: 23.5, marketCap: 2310000000, category: 'DeFi' },
  { symbol: 'BONK', name: 'Bonk', price: 0.000031, marketCap: 2250000000, category: 'Meme' },
  { symbol: 'STX', name: 'Stacks', price: 1.85, marketCap: 2750000000, category: 'Layer 2' },
  { symbol: 'IMX', name: 'Immutable', price: 1.52, marketCap: 2540000000, category: 'Layer 2' },
  { symbol: 'ONDO', name: 'Ondo Finance', price: 1.15, marketCap: 1650000000, category: 'Gold & RWA' },
  { symbol: 'TIA', name: 'Celestia', price: 5.8, marketCap: 2480000000, category: 'Layer 1' },
  { symbol: 'SEI', name: 'Sei', price: 0.48, marketCap: 1920000000, category: 'Layer 1' },
  { symbol: 'FLOKI', name: 'Floki', price: 0.00019, marketCap: 1850000000, category: 'Meme' },
  { symbol: 'GRT', name: 'The Graph', price: 0.21, marketCap: 2010000000, category: 'AI' },
  { symbol: 'THETA', name: 'Theta Network', price: 1.95, marketCap: 1950000000, category: 'Web3' },
  { symbol: 'RUNE', name: 'THORChain', price: 5.2, marketCap: 1760000000, category: 'DeFi' },
  { symbol: 'ALGO', name: 'Algorand', price: 0.34, marketCap: 2820000000, category: 'Layer 1' },
  { symbol: 'VET', name: 'VeChain', price: 0.042, marketCap: 3400000000, category: 'Layer 1' },
  { symbol: 'LDO', name: 'Lido DAO', price: 1.62, marketCap: 1450000000, category: 'DeFi' },
  { symbol: 'MKR', name: 'Maker', price: 1540, marketCap: 1380000000, category: 'DeFi' },
  { symbol: 'AR', name: 'Arweave', price: 19.5, marketCap: 1280000000, category: 'Web3' },
  { symbol: 'GALA', name: 'Gala', price: 0.036, marketCap: 1320000000, category: 'Web3' },
  { symbol: 'STRK', name: 'Starknet', price: 0.54, marketCap: 1120000000, category: 'Layer 2' },
  { symbol: 'JASMY', name: 'JasmyCoin', price: 0.028, marketCap: 1380000000, category: 'Web3' },
  { symbol: 'PYTH', name: 'Pyth Network', price: 0.41, marketCap: 1480000000, category: 'DeFi' },
  { symbol: 'JUP', name: 'Jupiter', price: 0.98, marketCap: 1320000000, category: 'DeFi' },
  { symbol: 'ENA', name: 'Ethena', price: 0.68, marketCap: 1920000000, category: 'DeFi' },
  { symbol: 'WLD', name: 'Worldcoin', price: 2.35, marketCap: 1650000000, category: 'AI' },
  { symbol: 'AKT', name: 'Akash Network', price: 3.65, marketCap: 910000000, category: 'AI' },
  { symbol: 'PENDLE', name: 'Pendle', price: 5.12, marketCap: 840000000, category: 'DeFi' },
  { symbol: 'QNT', name: 'Quant', price: 98.0, marketCap: 1180000000, category: 'Layer 1' },
  { symbol: 'EOS', name: 'EOS', price: 0.88, marketCap: 1340000000, category: 'Layer 1' },
  { symbol: 'XTZ', name: 'Tezos', price: 1.28, marketCap: 1290000000, category: 'Layer 1' },
  { symbol: 'FLOW', name: 'Flow', price: 0.85, marketCap: 1310000000, category: 'Layer 1' },
  { symbol: 'EGLD', name: 'MultiversX', price: 36.5, marketCap: 1010000000, category: 'Layer 1' },
  { symbol: 'NEO', name: 'Neo', price: 14.8, marketCap: 1040000000, category: 'Layer 1' },
  { symbol: 'SAND', name: 'The Sandbox', price: 0.58, marketCap: 1410000000, category: 'Web3' },
  { symbol: 'MANA', name: 'Decentraland', price: 0.54, marketCap: 1030000000, category: 'Web3' },
  { symbol: 'AXS', name: 'Axie Infinity', price: 6.95, marketCap: 1060000000, category: 'Web3' },
  { symbol: 'CHZ', name: 'Chiliz', price: 0.089, marketCap: 810000000, category: 'Web3' },
  { symbol: 'CRV', name: 'Curve DAO Token', price: 0.72, marketCap: 910000000, category: 'DeFi' },
  { symbol: 'SNX', name: 'Synthetix', price: 2.15, marketCap: 710000000, category: 'DeFi' },
  { symbol: 'COMP', name: 'Compound', price: 68.5, marketCap: 610000000, category: 'DeFi' },
  { symbol: '1INCH', name: '1inch Network', price: 0.39, marketCap: 510000000, category: 'DeFi' },
  { symbol: 'DYDX', name: 'dYdX', price: 1.48, marketCap: 960000000, category: 'DeFi' },
  { symbol: 'GMX', name: 'GMX', price: 29.4, marketCap: 290000000, category: 'DeFi' },
  { symbol: 'CAKE', name: 'PancakeSwap', price: 2.65, marketCap: 760000000, category: 'DeFi' },
  { symbol: 'SUSHI', name: 'SushiSwap', price: 1.18, marketCap: 310000000, category: 'DeFi' },
  { symbol: 'YFI', name: 'yearn.finance', price: 7450, marketCap: 250000000, category: 'DeFi' },
  { symbol: 'ZRO', name: 'LayerZero', price: 4.15, marketCap: 460000000, category: 'Layer 2' },
  { symbol: 'ZK', name: 'ZKsync', price: 0.175, marketCap: 640000000, category: 'Layer 2' },
  { symbol: 'METIS', name: 'Metis', price: 46.0, marketCap: 280000000, category: 'Layer 2' },
  { symbol: 'MANTA', name: 'Manta Network', price: 0.98, marketCap: 380000000, category: 'Layer 2' },
  { symbol: 'ORDI', name: 'ORDI', price: 38.5, marketCap: 810000000, category: 'Meme' },
  { symbol: 'NOT', name: 'Notcoin', price: 0.0082, marketCap: 840000000, category: 'Web3' },
  { symbol: 'DOGS', name: 'Dogs', price: 0.00072, marketCap: 370000000, category: 'Meme' },
  { symbol: 'MEME', name: 'Memecoin', price: 0.014, marketCap: 420000000, category: 'Meme' },
  { symbol: 'PEOPLE', name: 'ConstitutionDAO', price: 0.068, marketCap: 345000000, category: 'Meme' },
  { symbol: 'TURBO', name: 'Turbo', price: 0.0092, marketCap: 630000000, category: 'Meme' },
  { symbol: 'NEIRO', name: 'First Neiro On Ethereum', price: 0.0018, marketCap: 750000000, category: 'Meme' },
  { symbol: 'PNUT', name: 'Peanut the Squirrel', price: 1.15, marketCap: 1150000000, category: 'Meme' },
  { symbol: 'ACT', name: 'Act I : The AI Prophecy', price: 0.42, marketCap: 400000000, category: 'AI' },
  { symbol: 'IO', name: 'io.net', price: 2.45, marketCap: 310000000, category: 'AI' },
  { symbol: 'ARKM', name: 'Arkham', price: 1.95, marketCap: 440000000, category: 'AI' },
  { symbol: 'NMR', name: 'Numeraire', price: 18.2, marketCap: 130000000, category: 'AI' },
  { symbol: 'RLC', name: 'iExec RLC', price: 2.15, marketCap: 160000000, category: 'AI' },
  { symbol: 'PHB', name: 'Phoenix', price: 1.68, marketCap: 90000000, category: 'AI' },
  { symbol: 'POLYX', name: 'Polymesh', price: 0.31, marketCap: 280000000, category: 'Gold & RWA' },
  { symbol: 'OM', name: 'MANTRA', price: 3.65, marketCap: 3100000000, category: 'Gold & RWA' },
  { symbol: 'TRU', name: 'TrueFi', price: 0.11, marketCap: 130000000, category: 'Gold & RWA' },
  { symbol: 'RSR', name: 'Reserve Rights', price: 0.0094, marketCap: 500000000, category: 'Gold & RWA' },
  { symbol: 'KAVA', name: 'Kava', price: 0.48, marketCap: 520000000, category: 'Layer 1' },
  { symbol: 'MINA', name: 'Mina', price: 0.68, marketCap: 790000000, category: 'Layer 1' },
  { symbol: 'ZIL', name: 'Zilliqa', price: 0.021, marketCap: 400000000, category: 'Layer 1' },
  { symbol: 'IOTA', name: 'IOTA', price: 0.24, marketCap: 840000000, category: 'Layer 1' },
  { symbol: 'KSM', name: 'Kusama', price: 28.5, marketCap: 440000000, category: 'Layer 1' },
  { symbol: 'ASTR', name: 'Astar', price: 0.072, marketCap: 520000000, category: 'Layer 1' },
  { symbol: 'CELO', name: 'Celo', price: 0.78, marketCap: 430000000, category: 'Layer 1' },
  { symbol: 'ONE', name: 'Harmony', price: 0.022, marketCap: 310000000, category: 'Layer 1' },
  { symbol: 'ROSE', name: 'Oasis', price: 0.092, marketCap: 650000000, category: 'Layer 1' },
  { symbol: 'ENS', name: 'Ethereum Name Service', price: 28.4, marketCap: 940000000, category: 'Web3' },
  { symbol: 'LPT', name: 'Livepeer', price: 13.8, marketCap: 490000000, category: 'AI' },
  { symbol: 'ANKR', name: 'Ankr', price: 0.038, marketCap: 380000000, category: 'Web3' },
  { symbol: 'BAT', name: 'Basic Attention Token', price: 0.24, marketCap: 360000000, category: 'Web3' },
  { symbol: 'ENJ', name: 'Enjin Coin', price: 0.25, marketCap: 430000000, category: 'Web3' },
  { symbol: 'GMT', name: 'STEPN', price: 0.19, marketCap: 510000000, category: 'Web3' },
  { symbol: 'APE', name: 'ApeCoin', price: 1.25, marketCap: 900000000, category: 'Web3' },
  { symbol: 'BLUR', name: 'Blur', price: 0.29, marketCap: 580000000, category: 'Web3' },
];

export const MASTER_CRYPTO_250: MarketTableRow[] = BINANCE_CRYPTO_SEEDS.map((c, idx) => ({
  rank: idx + 1,
  id: c.symbol.toLowerCase(),
  name: c.name,
  symbol: c.symbol,
  price: c.price,
  change1d: Number(((((idx * 17) % 19) - 8) * 0.65).toFixed(2)),
  category: c.category,
  exchange: 'BINANCE',
  currency: 'USDT',
  marketCap: c.marketCap,
  volume24h: Math.floor(c.marketCap * 0.08),
}));

let cachedBinanceTableRows: MarketTableRow[] | null = null;
let cachedBinanceTableTimestamp = 0;

export async function fetchBinanceCryptoTableRows(): Promise<MarketTableRow[]> {
  if (cachedBinanceTableRows && Date.now() - cachedBinanceTableTimestamp < 30000) {
    return cachedBinanceTableRows;
  }
  try {
    // Request only top seeded USDT pairs (~12KB payload instead of 2.5MB full exchange dump)
    const nonBinanceDirect = new Set(['XAUT', 'CL', 'XAG']);
    const querySymbols = BINANCE_CRYPTO_SEEDS
      .map((s) => s.symbol.toUpperCase())
      .filter((sym) => !nonBinanceDirect.has(sym))
      .slice(0, 45)
      .map((sym) => `"${sym}USDT"`);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${querySymbols.join(',')}]`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const seedBySymbol = new Map(BINANCE_CRYPTO_SEEDS.map((s) => [s.symbol.toUpperCase(), s]));
        const excludedBases = new Set(['USDC', 'FDUSD', 'TUSD', 'USDP', 'DAI', 'BUSD', 'AEUR', 'EUR', 'GBP', 'TRY', 'BRL']);
        const usdtTickers = data
          .filter(
            (t: any) =>
              typeof t.symbol === 'string' &&
              t.symbol.endsWith('USDT') &&
              parseFloat(t.lastPrice) > 0
          )
          .map((t: any) => {
            const sym = t.symbol.slice(0, -4).toUpperCase();
            return {
              sym,
              lastPrice: parseFloat(t.lastPrice),
              changePct: parseFloat(t.priceChangePercent) || 0,
              high24h: parseFloat(t.highPrice) || parseFloat(t.lastPrice),
              low24h: parseFloat(t.lowPrice) || parseFloat(t.lastPrice),
              quoteVolume: parseFloat(t.quoteVolume) || 0,
            };
          })
          .filter((t) => !excludedBases.has(t.sym));

        if (usdtTickers.length > 0) {
          const tickerBySym = new Map(usdtTickers.map((t) => [t.sym, t]));
          const paxgLive = tickerBySym.get('PAXG');

          // Ensure all 7 preference coins (BTC, XAUT, PAXG, ZEC, SOL, CL, XAG) are always pinned at the top in exact preference order
          const preferredSet = new Set<string>(PREFERENCE_COIN_SYMBOLS);
          const preferredRows: MarketTableRow[] = PREFERENCE_COIN_SYMBOLS.map((sym, idx) => {
            const seed = seedBySymbol.get(sym);
            const live = tickerBySym.get(sym);
            if (live) {
              return {
                rank: idx + 1,
                id: sym.toLowerCase(),
                name: seed?.name || `${sym} / USDT`,
                symbol: sym,
                price: live.lastPrice,
                change1d: Number(live.changePct.toFixed(2)),
                high24h: live.high24h,
                low24h: live.low24h,
                category: seed?.category || 'Layer 1',
                exchange: 'BINANCE',
                currency: 'USDT',
                marketCap: seed?.marketCap || Math.round(live.quoteVolume * 14),
                volume24h: Math.round(live.quoteVolume),
              };
            }
            if (sym === 'XAUT' && paxgLive) {
              const xautPrice = Number((paxgLive.lastPrice * 1.0005).toFixed(2));
              return {
                rank: idx + 1,
                id: 'xaut',
                name: seed?.name || 'Tether Gold',
                symbol: 'XAUT',
                price: xautPrice,
                change1d: Number(paxgLive.changePct.toFixed(2)),
                high24h: Number((paxgLive.high24h * 1.0005).toFixed(2)),
                low24h: Number((paxgLive.low24h * 1.0005).toFixed(2)),
                category: 'Gold & RWA',
                exchange: 'BITFINEX',
                currency: 'USDT',
                marketCap: seed?.marketCap || 1920000000,
                volume24h: Math.round(paxgLive.quoteVolume * 1.05),
              };
            }
            return {
              rank: idx + 1,
              id: sym.toLowerCase(),
              name: seed?.name || sym,
              symbol: sym,
              price: seed?.price || 100,
              change1d: sym === 'CL' ? 0.85 : sym === 'XAG' ? 1.15 : 0.45,
              category: seed?.category || 'Gold & RWA',
              exchange: sym === 'CL' ? 'NYMEX' : sym === 'XAG' ? 'COMEX' : 'BINANCE',
              currency: 'USDT',
              marketCap: seed?.marketCap || 1000000000,
              volume24h: Math.floor((seed?.marketCap || 1000000000) * 0.08),
            };
          });

          const remainingSeeds = BINANCE_CRYPTO_SEEDS.filter((s) => !preferredSet.has(s.symbol.toUpperCase()));
          const remainingRows: MarketTableRow[] = remainingSeeds.map((seed, idx) => {
            const sym = seed.symbol.toUpperCase();
            const live = tickerBySym.get(sym);
            return {
              rank: preferredRows.length + idx + 1,
              id: sym.toLowerCase(),
              name: seed.name,
              symbol: sym,
              price: live ? live.lastPrice : seed.price,
              change1d: live ? Number(live.changePct.toFixed(2)) : Number(((((idx * 17) % 19) - 8) * 0.65).toFixed(2)),
              high24h: live ? live.high24h : Number((seed.price * 1.03).toFixed(4)),
              low24h: live ? live.low24h : Number((seed.price * 0.97).toFixed(4)),
              category: seed.category || 'Layer 1',
              exchange: 'BINANCE',
              currency: 'USDT',
              marketCap: seed.marketCap || (live ? Math.round(live.quoteVolume * 14) : 1000000000),
              volume24h: live ? Math.round(live.quoteVolume) : Math.floor(seed.marketCap * 0.08),
            };
          });

          const combined = [...preferredRows, ...remainingRows];
          cachedBinanceTableRows = combined;
          cachedBinanceTableTimestamp = Date.now();
          return combined;
        }
      }
    }
  } catch {
    // Fallback to MASTER_CRYPTO_250
  }
  return MASTER_CRYPTO_250;
}

export function subscribeMarketTable(
  _tableName: string,
  _callback: (data: { data: MarketTableRow[]; dataTimestamp?: number; updatedAtMs?: number; updatedAt?: string }) => void
) {
  return () => {};
}

export async function fetchMarketTable(
  tableName: string
): Promise<{ data: MarketTableRow[]; dataTimestamp?: number; updatedAtMs?: number; updatedAt?: string }> {
  if (tableName === 'nifty_500') {
    return { 
      data: MASTER_NIFTY_500,
      dataTimestamp: Date.now(),
      updatedAtMs: Date.now()
    };
  }
  return { data: [] as MarketTableRow[] };
}
