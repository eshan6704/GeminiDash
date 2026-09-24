export interface TrackedAsset {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'GLOBAL_INDEX' | 'FOREX' | 'COMMODITY' | 'INDIAN_INDEX' | 'INDIAN_STOCK' | 'US_STOCK' | 'OPTION_CHAIN';
  marketCapCategory?: 'LARGECAP' | 'MIDCAP' | 'SMALLCAP' | 'MICROCAP' | 'TOTAL_MARKET';
  sector?: string;
  region?: string;
  price: number;
  change1d: number;
  currency: string;
  yahooSymbol?: string;
  isTerminalAsset?: boolean; // Can be traded directly in AurumX Simulator terminal
  fnoSymbol?: string;
}

export const ALL_TRACKED_ASSETS: TrackedAsset[] = [
  // --- CRYPTO & GOLD TERMINAL ASSETS ---
  { symbol: 'PAXG', name: 'PAX Gold (Gold Backed Token)', category: 'CRYPTO', price: 3042.80, change1d: 1.15, currency: 'USD', yahooSymbol: 'PAXG-USD', isTerminalAsset: true, sector: 'Precious Metals / Crypto' },
  { symbol: 'BTC', name: 'Bitcoin', category: 'CRYPTO', price: 91450.00, change1d: 2.34, currency: 'USD', yahooSymbol: 'BTC-USD', isTerminalAsset: true, sector: 'Layer 1 Crypto' },
  { symbol: 'ETH', name: 'Ethereum', category: 'CRYPTO', price: 3340.50, change1d: 1.82, currency: 'USD', yahooSymbol: 'ETH-USD', isTerminalAsset: true, sector: 'Smart Contracts' },
  { symbol: 'SOL', name: 'Solana', category: 'CRYPTO', price: 198.70, change1d: 4.15, currency: 'USD', yahooSymbol: 'SOL-USD', isTerminalAsset: true, sector: 'High Speed L1' },
  { symbol: 'BNB', name: 'BNB Chain', category: 'CRYPTO', price: 645.20, change1d: 0.95, currency: 'USD', yahooSymbol: 'BNB-USD', isTerminalAsset: true, sector: 'Exchange Token' },
  { symbol: 'XRP', name: 'Ripple XRP', category: 'CRYPTO', price: 2.38, change1d: 5.60, currency: 'USD', yahooSymbol: 'XRP-USD', isTerminalAsset: true, sector: 'Payments' },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'CRYPTO', price: 0.285, change1d: 3.40, currency: 'USD', yahooSymbol: 'DOGE-USD', isTerminalAsset: true, sector: 'Memecoin' },
  { symbol: 'ADA', name: 'Cardano', category: 'CRYPTO', price: 0.88, change1d: 1.45, currency: 'USD', yahooSymbol: 'ADA-USD', isTerminalAsset: true, sector: 'Smart Contracts' },
  { symbol: 'AVAX', name: 'Avalanche', category: 'CRYPTO', price: 36.40, change1d: 2.10, currency: 'USD', yahooSymbol: 'AVAX-USD', isTerminalAsset: true, sector: 'Layer 1' },
  { symbol: 'LINK', name: 'Chainlink', category: 'CRYPTO', price: 18.90, change1d: 3.10, currency: 'USD', yahooSymbol: 'LINK-USD', isTerminalAsset: true, sector: 'Oracle Network' },
  { symbol: 'SUI', name: 'Sui Network', category: 'CRYPTO', price: 3.25, change1d: 6.80, currency: 'USD', yahooSymbol: 'SUI-USD', isTerminalAsset: true, sector: 'Move L1' },
  { symbol: 'RENDER', name: 'Render Network', category: 'CRYPTO', price: 8.40, change1d: 4.20, currency: 'USD', yahooSymbol: 'RENDER-USD', isTerminalAsset: true, sector: 'AI / DePIN' },

  // --- NIFTY & INDIAN BENCHMARK & TOTAL MARKET INDICES ---
  { symbol: 'NIFTY 50', name: 'Nifty 50 Benchmark', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 23650.40, change1d: 0.65, currency: 'INR', yahooSymbol: '^NSEI', fnoSymbol: 'NIFTY' },
  { symbol: 'BANK NIFTY', name: 'Nifty Bank Index', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 50420.80, change1d: 0.82, currency: 'INR', yahooSymbol: '^NSEBANK', fnoSymbol: 'BANKNIFTY' },
  { symbol: 'SENSEX', name: 'BSE Sensex 30', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 77850.20, change1d: 0.58, currency: 'INR', yahooSymbol: '^BSESN' },
  { symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50 (Junior Nifty)', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 68420.00, change1d: 1.15, currency: 'INR', yahooSymbol: '^NSENEXT50' },
  { symbol: 'NIFTY 100', name: 'Nifty 100 Largecap', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 24520.00, change1d: 0.72, currency: 'INR', yahooSymbol: '^CNX100' },
  { symbol: 'NIFTY MIDCAP 150', name: 'Nifty Midcap 150 Index', category: 'INDIAN_INDEX', marketCapCategory: 'MIDCAP', price: 20850.50, change1d: 1.34, currency: 'INR', yahooSymbol: '^NSEMDCP50' },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50 Benchmark', category: 'INDIAN_INDEX', marketCapCategory: 'MIDCAP', price: 15480.00, change1d: 1.25, currency: 'INR', yahooSymbol: '^NSEMDCP50' },
  { symbol: 'NIFTY SMALLCAP 250', name: 'Nifty Smallcap 250 Index', category: 'INDIAN_INDEX', marketCapCategory: 'SMALLCAP', price: 17920.00, change1d: 1.62, currency: 'INR', yahooSymbol: '^CNXSC' },
  { symbol: 'NIFTY SMALLCAP 100', name: 'Nifty Smallcap 100 Index', category: 'INDIAN_INDEX', marketCapCategory: 'SMALLCAP', price: 18450.00, change1d: 1.48, currency: 'INR', yahooSymbol: '^CNXSC' },
  { symbol: 'NIFTY MICROCAP 250', name: 'Nifty Microcap 250 Index', category: 'INDIAN_INDEX', marketCapCategory: 'MICROCAP', price: 21340.00, change1d: 2.15, currency: 'INR', yahooSymbol: '^NSEMICRO250' },
  { symbol: 'NIFTY TOTAL MARKET', name: 'Nifty Total Market Index (750 stocks)', category: 'INDIAN_INDEX', marketCapCategory: 'TOTAL_MARKET', price: 13950.00, change1d: 1.05, currency: 'INR', yahooSymbol: '^NSETOTAL' },
  { symbol: 'NIFTY 500', name: 'Nifty 500 Broad Market', category: 'INDIAN_INDEX', marketCapCategory: 'TOTAL_MARKET', price: 21890.00, change1d: 0.92, currency: 'INR', yahooSymbol: '^CRSLDX' },
  { symbol: 'NIFTY IT', name: 'Nifty IT Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 38450.00, change1d: 1.42, currency: 'INR', yahooSymbol: '^CNXIT' },
  { symbol: 'NIFTY AUTO', name: 'Nifty Auto Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 23150.00, change1d: 0.95, currency: 'INR', yahooSymbol: '^CNXAUTO' },
  { symbol: 'NIFTY PHARMA', name: 'Nifty Pharma Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 21980.00, change1d: -0.15, currency: 'INR', yahooSymbol: '^CNXPHARMA' },
  { symbol: 'NIFTY FMCG', name: 'Nifty FMCG Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 58200.00, change1d: 0.32, currency: 'INR', yahooSymbol: '^CNXFMCG' },
  { symbol: 'NIFTY METAL', name: 'Nifty Metal Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 9240.00, change1d: 1.85, currency: 'INR', yahooSymbol: '^CNXMETAL' },
  { symbol: 'NIFTY REALTY', name: 'Nifty Realty Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'MIDCAP', price: 1045.00, change1d: 2.30, currency: 'INR', yahooSymbol: '^CNXREALTY' },
  { symbol: 'NIFTY ENERGY', name: 'Nifty Energy Sectoral', category: 'INDIAN_INDEX', marketCapCategory: 'LARGECAP', price: 39800.00, change1d: 0.75, currency: 'INR', yahooSymbol: '^CNXENERGY' },
  { symbol: 'INDIA VIX', name: 'India Volatility Index', category: 'INDIAN_INDEX', marketCapCategory: 'TOTAL_MARKET', price: 14.85, change1d: -3.20, currency: 'PTS', yahooSymbol: '^INDIAVIX' },
  { symbol: 'GIFT NIFTY', name: 'GIFT Nifty (SGX/GIFT City)', category: 'GLOBAL_INDEX', price: 23710.00, change1d: 0.70, currency: 'INR', yahooSymbol: 'NIFTY.SG' },

  // --- INDIAN STOCKS: LARGECAP (NIFTY 50 & 100) ---
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Energy & Petrochemicals', price: 2980.50, change1d: 0.85, currency: 'INR', yahooSymbol: 'RELIANCE.NS' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Banking & Finance', price: 1785.40, change1d: 1.12, currency: 'INR', yahooSymbol: 'HDFCBANK.NS' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Banking & Finance', price: 1265.80, change1d: 0.94, currency: 'INR', yahooSymbol: 'ICICIBANK.NS' },
  { symbol: 'INFY', name: 'Infosys Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'IT & Software', price: 1920.30, change1d: 1.85, currency: 'INR', yahooSymbol: 'INFY.NS' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'IT & Software', price: 4280.00, change1d: 1.35, currency: 'INR', yahooSymbol: 'TCS.NS' },
  { symbol: 'ITC', name: 'ITC Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'FMCG & Consumer', price: 495.20, change1d: -0.25, currency: 'INR', yahooSymbol: 'ITC.NS' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Infrastructure & Engineering', price: 3640.10, change1d: 0.62, currency: 'INR', yahooSymbol: 'LT.NS' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Telecommunications', price: 1680.50, change1d: 0.45, currency: 'INR', yahooSymbol: 'BHARTIARTL.NS' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Auto & EV', price: 985.60, change1d: 1.95, currency: 'INR', yahooSymbol: 'TATAMOTORS.NS' },
  { symbol: 'SBIN', name: 'State Bank of India', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Banking & PSU', price: 842.10, change1d: 0.72, currency: 'INR', yahooSymbol: 'SBIN.NS' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'FMCG', price: 2480.00, change1d: -0.40, currency: 'INR', yahooSymbol: 'HINDUNILVR.NS' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'NBFC & Finance', price: 6890.00, change1d: 1.50, currency: 'INR', yahooSymbol: 'BAJFINANCE.NS' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Automobile', price: 11450.00, change1d: 0.80, currency: 'INR', yahooSymbol: 'MARUTI.NS' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Pharma', price: 1820.00, change1d: 0.35, currency: 'INR', yahooSymbol: 'SUNPHARMA.NS' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Banking & Finance', price: 1195.00, change1d: 0.85, currency: 'INR', yahooSymbol: 'AXISBANK.NS' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Banking', price: 1740.00, change1d: 0.40, currency: 'INR', yahooSymbol: 'KOTAKBANK.NS' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Consumer & Jewelry', price: 3420.00, change1d: 1.10, currency: 'INR', yahooSymbol: 'TITAN.NS' },
  { symbol: 'NTPC', name: 'NTPC Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Power Generation', price: 395.00, change1d: 1.70, currency: 'INR', yahooSymbol: 'NTPC.NS' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Oil & Gas Exploration', price: 265.00, change1d: 0.90, currency: 'INR', yahooSymbol: 'ONGC.NS' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Metals & Mining', price: 154.50, change1d: 1.65, currency: 'INR', yahooSymbol: 'TATASTEEL.NS' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Power Transmission', price: 325.00, change1d: 0.60, currency: 'INR', yahooSymbol: 'POWERGRID.NS' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Automobile & Tractors', price: 2950.00, change1d: 2.10, currency: 'INR', yahooSymbol: 'M&M.NS' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Conglomerate', price: 2840.00, change1d: 1.90, currency: 'INR', yahooSymbol: 'ADANIENT.NS' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Ports & Logistics', price: 1260.00, change1d: 1.20, currency: 'INR', yahooSymbol: 'ADANIPORTS.NS' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'IT Services', price: 545.00, change1d: 1.10, currency: 'INR', yahooSymbol: 'WIPRO.NS' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'IT Services', price: 1780.00, change1d: 1.40, currency: 'INR', yahooSymbol: 'HCLTECH.NS' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Mining & Coal', price: 410.00, change1d: 0.75, currency: 'INR', yahooSymbol: 'COALINDIA.NS' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Cement & Materials', price: 11200.00, change1d: 0.50, currency: 'INR', yahooSymbol: 'ULTRACEMCO.NS' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'Paints & Chemicals', price: 2450.00, change1d: -0.80, currency: 'INR', yahooSymbol: 'ASIANPAINT.NS' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'LARGECAP', sector: 'FMCG Foods', price: 2320.00, change1d: 0.10, currency: 'INR', yahooSymbol: 'NESTLEIND.NS' },

  // --- INDIAN STOCKS: MIDCAP (NIFTY MIDCAP 150) ---
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Defense & Aerospace', price: 4520.00, change1d: 2.85, currency: 'INR', yahooSymbol: 'HAL.NS' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Defense Electronics', price: 285.40, change1d: 3.12, currency: 'INR', yahooSymbol: 'BEL.NS' },
  { symbol: 'IRFC', name: 'Indian Railway Finance Corp', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Railways & PSU', price: 162.80, change1d: 1.85, currency: 'INR', yahooSymbol: 'IRFC.NS' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd (Blinkit)', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Quick Commerce & Tech', price: 275.40, change1d: 4.25, currency: 'INR', yahooSymbol: 'ZOMATO.NS' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Fintech & NBFC', price: 342.00, change1d: 0.95, currency: 'INR', yahooSymbol: 'JIOFIN.NS' },
  { symbol: 'TRENT', name: 'Trent Ltd (Tata Retail)', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Retail & Fashion', price: 7850.00, change1d: 2.45, currency: 'INR', yahooSymbol: 'TRENT.NS' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Renewable Wind Energy', price: 74.50, change1d: 4.85, currency: 'INR', yahooSymbol: 'SUZLON.NS' },
  { symbol: 'CDSL', name: 'Central Depository Services', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Capital Markets', price: 1540.00, change1d: 3.15, currency: 'INR', yahooSymbol: 'CDSL.NS' },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Wires & Cables', price: 6850.00, change1d: 1.65, currency: 'INR', yahooSymbol: 'POLYCAB.NS' },
  { symbol: 'DIXON', name: 'Dixon Technologies Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Electronics Manufacturing', price: 14200.00, change1d: 3.85, currency: 'INR', yahooSymbol: 'DIXON.NS' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Defense Shipbuilding', price: 4250.00, change1d: 5.25, currency: 'INR', yahooSymbol: 'MAZDOCK.NS' },
  { symbol: 'KPIGREEN', name: 'KPI Green Energy Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Solar Energy', price: 820.00, change1d: 4.95, currency: 'INR', yahooSymbol: 'KPIGREEN.NS' },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Heavy Engineering', price: 245.00, change1d: 2.30, currency: 'INR', yahooSymbol: 'BHEL.NS' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'IT Services & AI', price: 5650.00, change1d: 2.10, currency: 'INR', yahooSymbol: 'PERSISTENT.NS' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'IT & Cloud', price: 7850.00, change1d: 1.90, currency: 'INR', yahooSymbol: 'COFORGE.NS' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Private Banking', price: 205.00, change1d: 1.10, currency: 'INR', yahooSymbol: 'FEDERALBNK.NS' },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Pharma & Generics', price: 1390.00, change1d: 1.40, currency: 'INR', yahooSymbol: 'AUROPHARMA.NS' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Commercial Vehicles', price: 228.00, change1d: 1.75, currency: 'INR', yahooSymbol: 'ASHOKLEY.NS' },
  { symbol: 'VOLTAS', name: 'Voltas Ltd (Tata AC)', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Consumer Durables', price: 1680.00, change1d: 2.20, currency: 'INR', yahooSymbol: 'VOLTAS.NS' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Real Estate', price: 2950.00, change1d: 3.10, currency: 'INR', yahooSymbol: 'GODREJPROP.NS' },
  { symbol: 'TATACOMM', name: 'Tata Communications Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MIDCAP', sector: 'Telecom & Cloud', price: 1980.00, change1d: 1.25, currency: 'INR', yahooSymbol: 'TATACOMM.NS' },

  // --- INDIAN STOCKS: SMALLCAP (NIFTY SMALLCAP 250) ---
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Rail Infrastructure', price: 445.00, change1d: 3.80, currency: 'INR', yahooSymbol: 'RVNL.NS' },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Green Energy Financing', price: 215.00, change1d: 4.10, currency: 'INR', yahooSymbol: 'IREDA.NS' },
  { symbol: 'KAYNES', name: 'Kaynes Technology India', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Semiconductor / EMS', price: 5450.00, change1d: 4.60, currency: 'INR', yahooSymbol: 'KAYNES.NS' },
  { symbol: 'MOTILALOFS', name: 'Motilal Oswal Financial', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Broking & Wealth', price: 920.00, change1d: 2.90, currency: 'INR', yahooSymbol: 'MOTILALOFS.NS' },
  { symbol: 'NBCC', name: 'NBCC India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Civil Construction', price: 98.50, change1d: 3.40, currency: 'INR', yahooSymbol: 'NBCC.NS' },
  { symbol: 'BSOFT', name: 'Birlasoft Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'IT Services', price: 620.00, change1d: 1.80, currency: 'INR', yahooSymbol: 'BSOFT.NS' },
  { symbol: 'JBMA', name: 'JBM Auto Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'EV Buses & Auto', price: 1850.00, change1d: 3.90, currency: 'INR', yahooSymbol: 'JBMA.NS' },
  { symbol: 'CYIENT', name: 'Cyient Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Engineering & AI', price: 1940.00, change1d: 2.20, currency: 'INR', yahooSymbol: 'CYIENT.NS' },
  { symbol: 'ANGELONE', name: 'Angel One Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Fintech Broking', price: 2850.00, change1d: 3.15, currency: 'INR', yahooSymbol: 'ANGELONE.NS' },
  { symbol: 'HBLPOWER', name: 'HBL Power Systems Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Kavach & Defense Batteries', price: 615.00, change1d: 4.30, currency: 'INR', yahooSymbol: 'HBLPOWER.NS' },
  { symbol: 'CEATLTD', name: 'CEAT Ltd (Tyres)', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Auto Ancillary', price: 2950.00, change1d: 1.60, currency: 'INR', yahooSymbol: 'CEATLTD.NS' },
  { symbol: 'RITES', name: 'RITES Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Rail Transport Consultancy', price: 345.00, change1d: 2.10, currency: 'INR', yahooSymbol: 'RITES.NS' },
  { symbol: 'GRSE', name: 'Garden Reach Shipbuilders', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Warship Building', price: 1680.00, change1d: 4.80, currency: 'INR', yahooSymbol: 'GRSE.NS' },
  { symbol: 'HUDCO', name: 'Housing & Urban Dev Corp', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Housing Finance PSU', price: 218.00, change1d: 3.20, currency: 'INR', yahooSymbol: 'HUDCO.NS' },
  { symbol: 'CAMS', name: 'Computer Age Management', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Mutual Fund Infrastructure', price: 4420.00, change1d: 2.50, currency: 'INR', yahooSymbol: 'CAMS.NS' },
  { symbol: 'OLECTRA', name: 'Olectra Greentech Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: 'Electric Buses', price: 1580.00, change1d: 3.70, currency: 'INR', yahooSymbol: 'OLECTRA.NS' },
  { symbol: 'TEJASNET', name: 'Tejas Networks Ltd (Tata)', category: 'INDIAN_STOCK', marketCapCategory: 'SMALLCAP', sector: '5G & Telecom Hardware', price: 1250.00, change1d: 4.10, currency: 'INR', yahooSymbol: 'TEJASNET.NS' },

  // --- INDIAN STOCKS: MICROCAP (NIFTY MICROCAP 250) ---
  { symbol: 'E2E', name: 'E2E Networks Ltd (AI Cloud)', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'AI GPU Cloud Infra', price: 4250.00, change1d: 5.00, currency: 'INR', yahooSymbol: 'E2E.NS' },
  { symbol: 'SANGHVIMOV', name: 'Sanghvi Movers Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Heavy Crane Infrastructure', price: 920.00, change1d: 3.60, currency: 'INR', yahooSymbol: 'SANGHVIMOV.NS' },
  { symbol: 'DREDGECORP', name: 'Dredging Corp of India', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Maritime Ports', price: 890.00, change1d: 4.20, currency: 'INR', yahooSymbol: 'DREDGECORP.NS' },
  { symbol: 'PITTIENG', name: 'Pitti Engineering Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Electrical Laminations', price: 1380.00, change1d: 3.90, currency: 'INR', yahooSymbol: 'PITTIENG.NS' },
  { symbol: 'SIGNPOST', name: 'Signpost India Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Digital Out-of-Home Media', price: 340.00, change1d: 4.50, currency: 'INR', yahooSymbol: 'SIGNPOST.NS' },
  { symbol: 'WOCKPHARMA', name: 'Wockhardt Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Pharma / Antibiotics', price: 1150.00, change1d: 4.90, currency: 'INR', yahooSymbol: 'WOCKPHARMA.NS' },
  { symbol: 'REFEX', name: 'Refex Industries Ltd', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Refrigerant Gases & Ash', price: 580.00, change1d: 4.10, currency: 'INR', yahooSymbol: 'REFEX.NS' },
  { symbol: 'ORIENTGREEN', name: 'Orient Green Power', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Green Wind Power', price: 21.50, change1d: 4.80, currency: 'INR', yahooSymbol: 'ORIENTGREEN.NS' },
  { symbol: 'SPARC', name: 'Sun Pharma Advanced Research', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Drug Discovery', price: 215.00, change1d: 2.80, currency: 'INR', yahooSymbol: 'SPARC.NS' },
  { symbol: 'RALLIS', name: 'Rallis India Ltd (Tata)', category: 'INDIAN_STOCK', marketCapCategory: 'MICROCAP', sector: 'Agrochemicals', price: 335.00, change1d: 2.10, currency: 'INR', yahooSymbol: 'RALLIS.NS' },

  // --- GLOBAL INDICES & FUTURES ---
  { symbol: 'S&P 500', name: 'S&P 500 Index (US500)', category: 'GLOBAL_INDEX', price: 5985.40, change1d: 0.45, currency: 'USD', yahooSymbol: '^GSPC' },
  { symbol: 'NASDAQ 100', name: 'Nasdaq 100 Tech Index (US100)', category: 'GLOBAL_INDEX', price: 21450.80, change1d: 0.85, currency: 'USD', yahooSymbol: '^NDX' },
  { symbol: 'DOW JONES', name: 'Dow Jones Industrial 30 (US30)', category: 'GLOBAL_INDEX', price: 43850.00, change1d: 0.22, currency: 'USD', yahooSymbol: '^DJI' },
  { symbol: 'RUSSELL 2000', name: 'Russell 2000 US Smallcap', category: 'GLOBAL_INDEX', price: 2315.00, change1d: 1.20, currency: 'USD', yahooSymbol: '^RUT' },
  { symbol: 'FTSE 100', name: 'FTSE 100 London (UK100)', category: 'GLOBAL_INDEX', price: 8390.50, change1d: 0.18, currency: 'GBP', yahooSymbol: '^FTSE' },
  { symbol: 'DAX 40', name: 'DAX 40 Germany (GER40)', category: 'GLOBAL_INDEX', price: 19820.00, change1d: 0.35, currency: 'EUR', yahooSymbol: '^GDAXI' },
  { symbol: 'NIKKEI 225', name: 'Nikkei 225 Tokyo (JP225)', category: 'GLOBAL_INDEX', price: 38950.00, change1d: 0.90, currency: 'JPY', yahooSymbol: '^N225' },
  { symbol: 'HANG SENG', name: 'Hang Seng Hong Kong (HK50)', category: 'GLOBAL_INDEX', price: 19780.00, change1d: 1.45, currency: 'HKD', yahooSymbol: '^HSI' },
  { symbol: 'CAC 40', name: 'CAC 40 Paris (FRA40)', category: 'GLOBAL_INDEX', price: 7450.00, change1d: 0.28, currency: 'EUR', yahooSymbol: '^FCHI' },
  { symbol: 'EURO STOXX 50', name: 'Euro Stoxx 50 Bluechip (EU50)', category: 'GLOBAL_INDEX', price: 4920.00, change1d: 0.32, currency: 'EUR', yahooSymbol: '^STOXX50E' },
  { symbol: 'ASX 200', name: 'ASX 200 Sydney (AU200)', category: 'GLOBAL_INDEX', price: 8350.00, change1d: 0.40, currency: 'AUD', yahooSymbol: '^AXJO' },

  // --- FOREX CURRENCY PAIRS ---
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'FOREX', price: 1.0425, change1d: -0.15, currency: 'USD', yahooSymbol: 'EURUSD=X' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'FOREX', price: 1.2580, change1d: 0.22, currency: 'USD', yahooSymbol: 'GBPUSD=X' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'FOREX', price: 154.65, change1d: 0.38, currency: 'JPY', yahooSymbol: 'USDJPY=X' },
  { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', category: 'FOREX', price: 86.85, change1d: 0.08, currency: 'INR', yahooSymbol: 'USDINR=X' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'FOREX', price: 0.6510, change1d: 0.30, currency: 'USD', yahooSymbol: 'AUDUSD=X' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'FOREX', price: 1.4120, change1d: -0.12, currency: 'CAD', yahooSymbol: 'USDCAD=X' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'FOREX', price: 0.8990, change1d: -0.05, currency: 'CHF', yahooSymbol: 'USDCHF=X' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', category: 'FOREX', price: 0.5820, change1d: 0.18, currency: 'USD', yahooSymbol: 'NZDUSD=X' },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', category: 'FOREX', price: 0.8285, change1d: -0.28, currency: 'GBP', yahooSymbol: 'EURGBP=X' },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', category: 'FOREX', price: 161.20, change1d: 0.20, currency: 'JPY', yahooSymbol: 'EURJPY=X' },

  // --- COMMODITIES & ENERGY ---
  { symbol: 'CRUDE OIL', name: 'WTI Crude Oil ($/bbl)', category: 'COMMODITY', price: 69.45, change1d: 1.35, currency: 'USD', yahooSymbol: 'CL=F' },
  { symbol: 'BRENT CRUDE', name: 'Brent Crude Oil ($/bbl)', category: 'COMMODITY', price: 73.80, change1d: 1.20, currency: 'USD', yahooSymbol: 'BZ=F' },
  { symbol: 'NATURAL GAS', name: 'Henry Hub Natural Gas ($/MMBtu)', category: 'COMMODITY', price: 3.18, change1d: 2.80, currency: 'USD', yahooSymbol: 'NG=F' },
  { symbol: 'GOLD', name: 'Spot Gold XAU/USD ($/oz)', category: 'COMMODITY', price: 2715.00, change1d: 0.65, currency: 'USD', yahooSymbol: 'GC=F' },
  { symbol: 'SILVER', name: 'Spot Silver XAG/USD ($/oz)', category: 'COMMODITY', price: 31.40, change1d: 1.85, currency: 'USD', yahooSymbol: 'SI=F' },
  { symbol: 'COPPER', name: 'High Grade Copper ($/lb)', category: 'COMMODITY', price: 4.15, change1d: 0.90, currency: 'USD', yahooSymbol: 'HG=F' },
  { symbol: 'PLATINUM', name: 'Platinum ($/oz)', category: 'COMMODITY', price: 955.00, change1d: 0.40, currency: 'USD', yahooSymbol: 'PL=F' },
  { symbol: 'WHEAT', name: 'Chicago Wheat Futures', category: 'COMMODITY', price: 552.00, change1d: -0.60, currency: 'USD', yahooSymbol: 'ZW=F' },

  // --- US BLUECHIP STOCKS ---
  { symbol: 'NVDA', name: 'Nvidia Corporation', category: 'US_STOCK', sector: 'AI Semiconductors', price: 138.50, change1d: 3.20, currency: 'USD', yahooSymbol: 'NVDA' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'US_STOCK', sector: 'Consumer Tech', price: 232.40, change1d: 0.85, currency: 'USD', yahooSymbol: 'AAPL' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'US_STOCK', sector: 'Enterprise & AI Software', price: 425.80, change1d: 1.10, currency: 'USD', yahooSymbol: 'MSFT' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'US_STOCK', sector: 'E-commerce & AWS', price: 210.30, change1d: 1.65, currency: 'USD', yahooSymbol: 'AMZN' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', category: 'US_STOCK', sector: 'Search & Cloud', price: 182.00, change1d: 0.95, currency: 'USD', yahooSymbol: 'GOOGL' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'US_STOCK', sector: 'Social Media & AI', price: 615.00, change1d: 2.15, currency: 'USD', yahooSymbol: 'META' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'US_STOCK', sector: 'EV & Autonomous AI', price: 345.00, change1d: 4.80, currency: 'USD', yahooSymbol: 'TSLA' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor (TSMC)', category: 'US_STOCK', sector: 'Foundry Semi', price: 195.00, change1d: 2.40, currency: 'USD', yahooSymbol: 'TSM' },

  // --- OPTION CHAINS ---
  { symbol: 'NIFTY OPTION CHAIN', name: 'NIFTY 50 F&O Option Chain (NSE)', category: 'OPTION_CHAIN', fnoSymbol: 'NIFTY', price: 23650.40, change1d: 0.65, currency: 'INR' },
  { symbol: 'BANKNIFTY OPTION CHAIN', name: 'BANK NIFTY F&O Option Chain (NSE)', category: 'OPTION_CHAIN', fnoSymbol: 'BANKNIFTY', price: 50420.80, change1d: 0.82, currency: 'INR' },
];
