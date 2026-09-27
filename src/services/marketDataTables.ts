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
  { id: 'sugar', name: 'Sugar #11 World (ICE)', symbol: 'SB', price: 21.65, change1d: 0.48, category: 'Agriculture', unit: 'USd / Lb', high24h: 21.92, low24h: 21.40 },
  { id: 'cotton', name: 'Cotton #2 Futures (ICE)', symbol: 'CT', price: 71.20, change1d: -0.22, category: 'Agriculture', unit: 'USd / Lb', high24h: 71.85, low24h: 70.65 },
  { id: 'cocoa', name: 'Cocoa Futures (ICE)', symbol: 'CC', price: 8450.00, change1d: 1.82, category: 'Agriculture', unit: 'USD / Metric Ton', high24h: 8590.00, low24h: 8290.00 },
];

export const MASTER_INDIAN_INDICES: MarketTableRow[] = [
  { id: 'nifty50', name: 'NIFTY 50', symbol: 'NIFTY 50', price: 24320.50, change1d: 0.45, change1dPts: 108.20, category: 'Benchmark', status: 'Active' },
  { id: 'banknifty', name: 'NIFTY BANK', symbol: 'BANKNIFTY', price: 51240.30, change1d: -0.15, change1dPts: -76.40, category: 'Benchmark', status: 'Active' },
];

export const MASTER_NIFTY_500: MarketTableRow[] = [];
export const MASTER_CRYPTO_250: MarketTableRow[] = [];

export function subscribeMarketTable(
  _tableName: string,
  _callback: (data: { data: MarketTableRow[]; dataTimestamp?: number; updatedAtMs?: number; updatedAt?: string }) => void
) {
  return () => {};
}

export async function fetchMarketTable(
  _tableName: string
): Promise<{ data: MarketTableRow[]; dataTimestamp?: number; updatedAtMs?: number; updatedAt?: string }> {
  return { data: [] as MarketTableRow[] };
}
