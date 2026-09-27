import React, { useState, useEffect, useMemo } from 'react';
import { MarketAsset } from '../../types/trading';
import { CryptoCoinItem } from './CryptoMarketCapTable';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  RefreshCw,
  RotateCcw,
  Zap,
  Activity,
  Coins,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';

interface AdvancedCryptoScreenerViewProps {
  selectedSymbol?: string;
  liveAssets?: Record<string, MarketAsset>;
  onSelectCoinToTrade?: (symbol: string, coin?: CryptoCoinItem) => void;
}

type MarketCapPreset = 'ALL' | 'MEGA' | 'LARGE' | 'MID' | 'SMALL';
type Change24hPreset = 'ALL' | 'GAINERS' | 'STRONG_GAINERS' | 'LOSERS' | 'STRONG_LOSERS' | 'HIGH_VOLATILITY';
type VolumePreset = 'ALL' | 'OVER_1B' | 'OVER_250M' | 'OVER_50M' | 'UNDER_50M';

const REAL_CRYPTO_SEED: {
  name: string;
  symbol: string;
  price: number;
  cap: number;
  cat: CryptoCoinItem['category'];
}[] = [
  { name: 'Bitcoin', symbol: 'BTC', price: 96500, cap: 1910000000000, cat: 'Layer 1' },
  { name: 'Ethereum', symbol: 'ETH', price: 3450, cap: 415000000000, cat: 'Layer 1' },
  { name: 'Ripple', symbol: 'XRP', price: 1.85, cap: 106000000000, cat: 'Layer 1' },
  { name: 'Solana', symbol: 'SOL', price: 210, cap: 98500000000, cat: 'Layer 1' },
  { name: 'Binance Coin', symbol: 'BNB', price: 620, cap: 91000000000, cat: 'Layer 1' },
  { name: 'Dogecoin', symbol: 'DOGE', price: 0.28, cap: 41200000000, cat: 'Meme' },
  { name: 'Cardano', symbol: 'ADA', price: 0.85, cap: 30200000000, cat: 'Layer 1' },
  { name: 'TRON', symbol: 'TRX', price: 0.24, cap: 20800000000, cat: 'Layer 1' },
  { name: 'Avalanche', symbol: 'AVAX', price: 38.4, cap: 15800000000, cat: 'Layer 1' },
  { name: 'Shiba Inu', symbol: 'SHIB', price: 0.000024, cap: 14100000000, cat: 'Meme' },
  { name: 'Chainlink', symbol: 'LINK', price: 18.6, cap: 11700000000, cat: 'DeFi' },
  { name: 'Toncoin', symbol: 'TON', price: 5.45, cap: 13800000000, cat: 'Layer 1' },
  { name: 'Sui', symbol: 'SUI', price: 3.35, cap: 9600000000, cat: 'Layer 1' },
  { name: 'Polkadot', symbol: 'DOT', price: 7.4, cap: 10500000000, cat: 'Layer 1' },
  { name: 'Bitcoin Cash', symbol: 'BCH', price: 465, cap: 9200000000, cat: 'Layer 1' },
  { name: 'Pepe', symbol: 'PEPE', price: 0.000018, cap: 7600000000, cat: 'Meme' },
  { name: 'NEAR Protocol', symbol: 'NEAR', price: 5.85, cap: 7100000000, cat: 'AI' },
  { name: 'Litecoin', symbol: 'LTC', price: 102.5, cap: 7700000000, cat: 'Layer 1' },
  { name: 'Uniswap', symbol: 'UNI', price: 9.85, cap: 5950000000, cat: 'DeFi' },
  { name: 'Aptos', symbol: 'APT', price: 11.4, cap: 6100000000, cat: 'Layer 1' },
  { name: 'Internet Computer', symbol: 'ICP', price: 10.9, cap: 5150000000, cat: 'Web3' },
  { name: 'Aave', symbol: 'AAVE', price: 168, cap: 2520000000, cat: 'DeFi' },
  { name: 'Polygon', symbol: 'POL', price: 0.49, cap: 3900000000, cat: 'Layer 2' },
  { name: 'Render', symbol: 'RENDER', price: 7.65, cap: 3950000000, cat: 'AI' },
  { name: 'Artificial Superintelligence', symbol: 'FET', price: 1.46, cap: 3720000000, cat: 'AI' },
  { name: 'Bittensor', symbol: 'TAO', price: 485, cap: 3580000000, cat: 'AI' },
  { name: 'Arbitrum', symbol: 'ARB', price: 0.74, cap: 2950000000, cat: 'Layer 2' },
  { name: 'Optimism', symbol: 'OP', price: 1.78, cap: 2280000000, cat: 'Layer 2' },
  { name: 'Ondo Finance', symbol: 'ONDO', price: 1.15, cap: 1650000000, cat: 'Gold & RWA' },
  { name: 'Tether Gold', symbol: 'XAUT', price: 2755, cap: 680000000, cat: 'Gold & RWA' },
  { name: 'PAX Gold', symbol: 'PAXG', price: 2750, cap: 520000000, cat: 'Gold & RWA' },
  { name: 'Zcash', symbol: 'ZEC', price: 48.5, cap: 790000000, cat: 'Layer 1' },
  { name: 'dogwifhat', symbol: 'WIF', price: 2.42, cap: 2410000000, cat: 'Meme' },
  { name: 'Bonk', symbol: 'BONK', price: 0.000031, cap: 2250000000, cat: 'Meme' },
  { name: 'Pendle', symbol: 'PENDLE', price: 5.12, cap: 840000000, cat: 'DeFi' },
  { name: 'Lido DAO', symbol: 'LDO', price: 1.62, cap: 1450000000, cat: 'DeFi' },
  { name: 'Maker', symbol: 'MKR', price: 1540, cap: 1380000000, cat: 'DeFi' },
  { name: 'Akash Network', symbol: 'AKT', price: 3.65, cap: 910000000, cat: 'AI' },
  { name: 'Starknet', symbol: 'STRK', price: 0.54, cap: 1120000000, cat: 'Layer 2' },
  { name: 'Mantle', symbol: 'MNT', price: 0.88, cap: 2920000000, cat: 'Layer 2' },
];

function buildInitial250Coins(): CryptoCoinItem[] {
  const categories: CryptoCoinItem['category'][] = [
    'Layer 1',
    'DeFi',
    'Meme',
    'Gold & RWA',
    'AI',
    'Layer 2',
    'Web3',
  ];
  const list: CryptoCoinItem[] = [];

  REAL_CRYPTO_SEED.forEach((p, idx) => {
    const deterministicOffset = ((idx * 17) % 19) - 8;
    const ch24 = Number((deterministicOffset * 0.65).toFixed(2));
    const ch1h = Number((ch24 * 0.18).toFixed(2));
    const ch7d = Number((ch24 * 2.15).toFixed(2));
    const volRatio = 0.045 + ((idx * 7) % 15) * 0.01;
    list.push({
      rank: idx + 1,
      id: p.symbol.toLowerCase(),
      name: p.name,
      symbol: p.symbol,
      price: p.price,
      change1h: ch1h,
      change24h: ch24,
      change7d: ch7d,
      marketCap: p.cap,
      volume24h: Math.floor(p.cap * volRatio),
      circulatingSupply: Math.floor(p.cap / Math.max(p.price, 0.000001)),
      category: p.cat,
      isTradeableInSim: ['BTC', 'ETH', 'SOL', 'PAXG', 'XRP', 'DOGE', 'ZEC'].includes(p.symbol),
    });
  });

  for (let i = REAL_CRYPTO_SEED.length + 1; i <= 250; i++) {
    const cat = categories[i % categories.length];
    const cap = Math.max(45000000, Math.floor(28000000000 * Math.pow(0.972, i)));
    const basePrice = Number((((i * 37) % 140) + 0.12).toFixed(4));
    const ch24 = Number(((((i * 23) % 29) - 13) * 0.72).toFixed(2));
    const volRatio = 0.035 + ((i * 11) % 18) * 0.01;

    list.push({
      rank: i,
      id: `crypto-${i}`,
      name: `${cat} Protocol #${i}`,
      symbol: `CRP${i}`,
      price: basePrice,
      change1h: Number((ch24 * 0.21).toFixed(2)),
      change24h: ch24,
      change7d: Number((ch24 * 2.4).toFixed(2)),
      marketCap: cap,
      volume24h: Math.floor(cap * volRatio),
      circulatingSupply: Math.floor(cap / basePrice),
      category: cat,
      isTradeableInSim: false,
    });
  }

  return list;
}

export const AdvancedCryptoScreenerView: React.FC<AdvancedCryptoScreenerViewProps> = ({
  selectedSymbol = 'BTC',
  liveAssets,
  onSelectCoinToTrade,
}) => {
  const [coins, setCoins] = useState<CryptoCoinItem[]>(() => buildInitial250Coins());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState<boolean>(true);
  const [lastTickAt, setLastTickAt] = useState<number>(Date.now());

  // Screener Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [marketCapPreset, setMarketCapPreset] = useState<MarketCapPreset>('ALL');
  const [minMarketCapM, setMinMarketCapM] = useState<string>(''); // in $ Millions
  const [maxMarketCapM, setMaxMarketCapM] = useState<string>(''); // in $ Millions

  const [change24hPreset, setChange24hPreset] = useState<Change24hPreset>('ALL');
  const [minChange24h, setMinChange24h] = useState<string>('');
  const [maxChange24h, setMaxChange24h] = useState<string>('');

  const [volumePreset, setVolumePreset] = useState<VolumePreset>('ALL');
  const [minVolumeM, setMinVolumeM] = useState<string>(''); // in $ Millions
  const [minVolToMcapPct, setMinVolToMcapPct] = useState<number>(0);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof CryptoCoinItem | 'volToMcap'>('marketCap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  // Fetch live 250 coins from CoinGecko on mount & manual refresh
  const fetchLive250Coins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h,24h,7d'
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CryptoCoinItem[] = data.map((c: any, index: number) => {
            const sym = (c.symbol || '').toUpperCase();
            let cat: CryptoCoinItem['category'] = 'Web3';
            if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'NEAR', 'SUI', 'APT', 'TRX', 'TON', 'LTC', 'BCH', 'ZEC'].includes(sym)) cat = 'Layer 1';
            else if (['UNI', 'AAVE', 'LINK', 'MKR', 'SNX', 'CRV', 'LDO', 'PENDLE'].includes(sym)) cat = 'DeFi';
            else if (['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'TRUMP'].includes(sym)) cat = 'Meme';
            else if (['PAXG', 'XAUT', 'RWA', 'ONDO', 'POLYX'].includes(sym)) cat = 'Gold & RWA';
            else if (['FET', 'RNDR', 'RENDER', 'TAO', 'AGIX', 'OCEAN', 'AKT'].includes(sym)) cat = 'AI';
            else if (['MATIC', 'POL', 'OP', 'ARB', 'BASE', 'MNT', 'STRK'].includes(sym)) cat = 'Layer 2';

            return {
              rank: index + 1,
              id: c.id,
              name: c.name,
              symbol: sym,
              price: c.current_price || 0,
              change1h: Number((c.price_change_percentage_1h_in_currency ?? 0).toFixed(2)),
              change24h: Number((c.price_change_percentage_24h ?? 0).toFixed(2)),
              change7d: Number((c.price_change_percentage_7d_in_currency ?? 0).toFixed(2)),
              marketCap: c.market_cap || 0,
              volume24h: c.total_volume || 0,
              circulatingSupply: c.circulating_supply || 0,
              category: cat,
              isTradeableInSim: ['BTC', 'ETH', 'SOL', 'PAXG', 'XRP', 'DOGE', 'ZEC'].includes(sym),
            };
          });
          setCoins(mapped);
          setLastTickAt(Date.now());
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Keep existing 250 coins and real-time tick stream active
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLive250Coins();
  }, []);

  // Sync live WebSocket prices from simulator assets into matching coins
  useEffect(() => {
    if (!liveAssets || !isRealTimeActive) return;
    setCoins((prev) =>
      prev.map((c) => {
        const live = liveAssets[c.symbol];
        if (!live) return c;
        const priceRatio = c.price > 0 ? live.price / c.price : 1;
        return {
          ...c,
          price: live.price,
          change24h: live.change24h,
          marketCap: Math.round(c.marketCap * priceRatio),
          volume24h: live.volume24h || c.volume24h,
        };
      })
    );
    setLastTickAt(Date.now());
  }, [liveAssets, isRealTimeActive]);

  // Continuous real-time micro-tick updates across the 250-coin universe every 2.5s
  useEffect(() => {
    if (!isRealTimeActive) return;
    const timer = setInterval(() => {
      setCoins((prev) =>
        prev.map((c, idx) => {
          // Perturb a rolling subset of coins each tick for realistic live screener updates
          if ((idx + Math.floor(Date.now() / 2500)) % 3 !== 0) return c;
          const pctDelta = (Math.random() - 0.495) * 0.35; // +/- 0.17% micro tick
          const newPrice = Math.max(0.000001, c.price * (1 + pctDelta / 100));
          const newChange24h = Number((c.change24h + pctDelta * 0.6).toFixed(2));
          const newMarketCap = Math.round(c.marketCap * (1 + pctDelta / 100));
          const volPulse = 1 + Math.abs(pctDelta) * 0.015;
          const newVolume24h = Math.round(c.volume24h * volPulse);
          return {
            ...c,
            price: Number(newPrice.toPrecision(6)),
            change24h: newChange24h,
            marketCap: newMarketCap,
            volume24h: newVolume24h,
          };
        })
      );
      setLastTickAt(Date.now());
    }, 2500);

    return () => clearInterval(timer);
  }, [isRealTimeActive]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setMarketCapPreset('ALL');
    setMinMarketCapM('');
    setMaxMarketCapM('');
    setChange24hPreset('ALL');
    setMinChange24h('');
    setMaxChange24h('');
    setVolumePreset('ALL');
    setMinVolumeM('');
    setMinVolToMcapPct(0);
    setCurrentPage(1);
  };

  // Apply Market Cap, 24h Change, Volume, Category, and Search filters
  const filteredCoins = useMemo(() => {
    const minCapVal = minMarketCapM !== '' ? Number(minMarketCapM) * 1e6 : null;
    const maxCapVal = maxMarketCapM !== '' ? Number(maxMarketCapM) * 1e6 : null;
    const minChgVal = minChange24h !== '' ? Number(minChange24h) : null;
    const maxChgVal = maxChange24h !== '' ? Number(maxChange24h) : null;
    const minVolVal = minVolumeM !== '' ? Number(minVolumeM) * 1e6 : null;

    const filtered = coins.filter((coin) => {
      // 1. Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (
          !coin.name.toLowerCase().includes(q) &&
          !coin.symbol.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && coin.category !== selectedCategory) {
        return false;
      }

      // 3. Market Cap Preset
      if (marketCapPreset === 'MEGA' && coin.marketCap < 100e9) return false;
      if (marketCapPreset === 'LARGE' && (coin.marketCap < 10e9 || coin.marketCap >= 100e9)) return false;
      if (marketCapPreset === 'MID' && (coin.marketCap < 1e9 || coin.marketCap >= 10e9)) return false;
      if (marketCapPreset === 'SMALL' && coin.marketCap >= 1e9) return false;

      // Custom Min/Max Market Cap ($M)
      if (minCapVal !== null && !Number.isNaN(minCapVal) && coin.marketCap < minCapVal) return false;
      if (maxCapVal !== null && !Number.isNaN(maxCapVal) && coin.marketCap > maxCapVal) return false;

      // 4. 24h Change Preset
      if (change24hPreset === 'GAINERS' && coin.change24h <= 0) return false;
      if (change24hPreset === 'STRONG_GAINERS' && coin.change24h < 5) return false;
      if (change24hPreset === 'LOSERS' && coin.change24h >= 0) return false;
      if (change24hPreset === 'STRONG_LOSERS' && coin.change24h > -5) return false;
      if (change24hPreset === 'HIGH_VOLATILITY' && Math.abs(coin.change24h) < 5) return false;

      // Custom Min/Max 24h Change (%)
      if (minChgVal !== null && !Number.isNaN(minChgVal) && coin.change24h < minChgVal) return false;
      if (maxChgVal !== null && !Number.isNaN(maxChgVal) && coin.change24h > maxChgVal) return false;

      // 5. 24h Volume Preset
      if (volumePreset === 'OVER_1B' && coin.volume24h < 1e9) return false;
      if (volumePreset === 'OVER_250M' && coin.volume24h < 250e6) return false;
      if (volumePreset === 'OVER_50M' && coin.volume24h < 50e6) return false;
      if (volumePreset === 'UNDER_50M' && coin.volume24h >= 50e6) return false;

      // Custom Min 24h Volume ($M)
      if (minVolVal !== null && !Number.isNaN(minVolVal) && coin.volume24h < minVolVal) return false;

      // Volume / Market Cap Turnover %
      const volToMcap = coin.marketCap > 0 ? (coin.volume24h / coin.marketCap) * 100 : 0;
      if (minVolToMcapPct > 0 && volToMcap < minVolToMcapPct) return false;

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      if (sortField === 'volToMcap') {
        const ratioA = a.marketCap > 0 ? a.volume24h / a.marketCap : 0;
        const ratioB = b.marketCap > 0 ? b.volume24h / b.marketCap : 0;
        return sortAsc ? ratioA - ratioB : ratioB - ratioA;
      }
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

    return filtered;
  }, [
    coins,
    searchQuery,
    selectedCategory,
    marketCapPreset,
    minMarketCapM,
    maxMarketCapM,
    change24hPreset,
    minChange24h,
    maxChange24h,
    volumePreset,
    minVolumeM,
    minVolToMcapPct,
    sortField,
    sortAsc,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCoins.length / itemsPerPage));
  const paginatedCoins = filteredCoins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Aggregate summary stats of currently matched coins
  const screenerStats = useMemo(() => {
    const count = filteredCoins.length;
    const totalMcap = filteredCoins.reduce((acc, c) => acc + c.marketCap, 0);
    const totalVol = filteredCoins.reduce((acc, c) => acc + c.volume24h, 0);
    const avgChange24h =
      count > 0 ? filteredCoins.reduce((acc, c) => acc + c.change24h, 0) / count : 0;
    const gainersCount = filteredCoins.filter((c) => c.change24h > 0).length;
    return { count, totalMcap, totalVol, avgChange24h, gainersCount };
  }, [filteredCoins]);

  const handleSort = (field: keyof CryptoCoinItem | 'volToMcap') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank');
    }
  };

  const formatCompactUsd = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    if (p >= 0.01) return `$${p.toFixed(4)}`;
    return `$${p.toFixed(6)}`;
  };

  return (
    <div className="rounded-xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header & Live Stream Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-600/25 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-[var(--theme-text-primary)] tracking-tight">
                Advanced Crypto Screener (250 Coins)
              </h2>
              <span aria-hidden="true" className="text-[var(--theme-text-muted)]">·</span>
              <span className="text-xs font-mono text-emerald-600 font-bold">
                {isRealTimeActive ? 'Real-Time Stream Active' : 'Stream Paused'}
              </span>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Multi-factor screening across Market Cap, 24h Change %, and 24h Volume with live tick updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-[var(--theme-text-muted)] hidden sm:inline">
            Updated: {new Date(lastTickAt).toLocaleTimeString()}
          </span>

          <button
            type="button"
            onClick={() => setIsRealTimeActive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isRealTimeActive
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
            }`}
          >
            {isRealTimeActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRealTimeActive ? 'Live Updates: ON' : 'Live Updates: PAUSED'}</span>
          </button>

          <button
            type="button"
            onClick={fetchLive250Coins}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sync API</span>
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-elevated)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Top Search & Sector Category Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-[var(--theme-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search 250 coins by symbol or name (e.g., BTC, SOL, ONDO, TAO)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {['ALL', 'Layer 1', 'Layer 2', 'DeFi', 'AI', 'Gold & RWA', 'Meme', 'Web3'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Multi-Factor Filter Matrix: Market Cap | 24h Change % | 24h Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)]">
        {/* 1. Market Cap Filter Card */}
        <div className="p-3 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Market Cap Filter</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">USD Valuation</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'All Caps' },
              { id: 'MEGA', label: 'Mega (>$100B)' },
              { id: 'LARGE', label: 'Large ($10B–$100B)' },
              { id: 'MID', label: 'Mid ($1B–$10B)' },
              { id: 'SMALL', label: 'Small (<$1B)' },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setMarketCapPreset(tier.id as MarketCapPreset);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                  marketCapPreset === tier.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Min Cap ($M)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minMarketCapM}
                onChange={(e) => {
                  setMinMarketCapM(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Max Cap ($M)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={maxMarketCapM}
                onChange={(e) => {
                  setMaxMarketCapM(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. 24h Price Change (%) Filter Card */}
        <div className="p-3 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. 24h Change (%) Filter</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">Momentum</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'All Moves' },
              { id: 'GAINERS', label: 'Gainers (>0%)' },
              { id: 'STRONG_GAINERS', label: 'Top Gainers (>+5%)' },
              { id: 'LOSERS', label: 'Losers (<0%)' },
              { id: 'STRONG_LOSERS', label: 'Deep Dip (<-5%)' },
              { id: 'HIGH_VOLATILITY', label: 'High Vol (|±5%|)' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setChange24hPreset(p.id as Change24hPreset);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                  change24hPreset === p.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Min 24h %
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. -10"
                value={minChange24h}
                onChange={(e) => {
                  setMinChange24h(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Max 24h %
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 15"
                value={maxChange24h}
                onChange={(e) => {
                  setMaxChange24h(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. 24h Volume ($) & Turnover Filter Card */}
        <div className="p-3 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. 24h Volume Filter</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">Liquidity</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'All Volume' },
              { id: 'OVER_1B', label: '>$1B / 24h' },
              { id: 'OVER_250M', label: '>$250M / 24h' },
              { id: 'OVER_50M', label: '>$50M / 24h' },
              { id: 'UNDER_50M', label: '<$50M / 24h' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVolumePreset(v.id as VolumePreset);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                  volumePreset === v.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border-subtle)] hover:bg-[var(--theme-bg-elevated)]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Min 24h Vol ($M)
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={minVolumeM}
                onChange={(e) => {
                  setMinVolumeM(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--theme-text-muted)] mb-0.5">
                Min Vol/MCap: {minVolToMcapPct}%
              </label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={minVolToMcapPct}
                onChange={(e) => {
                  setMinVolToMcapPct(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-emerald-600 cursor-pointer mt-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Summary Bar */}
      <div className="px-3.5 py-2 rounded-lg bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            Matched Coins:{' '}
            <strong className="text-emerald-600">{screenerStats.count}</strong> / {coins.length}
          </span>
          <span>·</span>
          <span>
            Filtered Market Cap:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              {formatCompactUsd(screenerStats.totalMcap)}
            </strong>
          </span>
          <span>·</span>
          <span>
            Filtered 24h Volume:{' '}
            <strong className="text-[var(--theme-text-primary)]">
              {formatCompactUsd(screenerStats.totalVol)}
            </strong>
          </span>
          <span>·</span>
          <span>
            Avg 24h Change:{' '}
            <strong
              className={
                screenerStats.avgChange24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }
            >
              {screenerStats.avgChange24h >= 0 ? '+' : ''}
              {screenerStats.avgChange24h.toFixed(2)}%
            </strong>
          </span>
        </div>

        <div className="text-[11px] text-[var(--theme-text-muted)]">
          Advancers: <strong className="text-emerald-600">{screenerStats.gainersCount}</strong> · Decliners:{' '}
          <strong className="text-rose-600">{screenerStats.count - screenerStats.gainersCount}</strong>
        </div>
      </div>

      {/* Screener Results Table */}
      <div className="overflow-x-auto max-h-[540px] border border-[var(--theme-border)] rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[var(--theme-bg-card-subtle)]">
            <tr className="text-[10px] uppercase tracking-wider font-mono text-[var(--theme-text-secondary)] border-b border-[var(--theme-border)]">
              <th
                onClick={() => handleSort('rank')}
                className="py-2.5 px-3 cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3 cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center gap-1">
                  <span>Asset</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3">Sector</th>
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Live Price</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('change1h')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>1h %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('change24h')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24h Change %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('change7d')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>7d %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('marketCap')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Market Cap</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('volume24h')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24h Volume</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('volToMcap')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-emerald-600"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Vol / MCap</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Load in Section B</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--theme-border-subtle)] font-mono">
            {paginatedCoins.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-[var(--theme-text-muted)]">
                  No crypto assets match your current Market Cap, 24h Change, and Volume filters. Click "Reset Filters" above.
                </td>
              </tr>
            ) : (
              paginatedCoins.map((coin) => {
                const isSelected = coin.symbol.toUpperCase() === selectedSymbol.toUpperCase();
                const isUp24 = coin.change24h >= 0;
                const volToMcapPct =
                  coin.marketCap > 0 ? (coin.volume24h / coin.marketCap) * 100 : 0;

                return (
                  <tr
                    key={coin.id}
                    onClick={() => onSelectCoinToTrade && onSelectCoinToTrade(coin.symbol, coin)}
                    className={`transition-colors cursor-pointer hover:bg-emerald-500/10 ${
                      isSelected ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/40' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-[var(--theme-text-muted)] font-bold">
                      {coin.rank}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--theme-text-primary)]">
                          {coin.symbol}
                        </span>
                        <span className="text-[11px] text-[var(--theme-text-muted)] truncate max-w-[140px]">
                          {coin.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-sans text-[11px] text-[var(--theme-text-secondary)]">
                      {coin.category}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                      {formatPrice(coin.price)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        coin.change1h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {coin.change1h >= 0 ? '+' : ''}
                      {coin.change1h.toFixed(2)}%
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        isUp24 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      <span className="inline-flex items-center justify-end gap-0.5">
                        {isUp24 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isUp24 ? '+' : ''}
                        {coin.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        coin.change7d >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {coin.change7d >= 0 ? '+' : ''}
                      {coin.change7d.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                      {formatCompactUsd(coin.marketCap)}
                    </td>
                    <td className="py-2 px-3 text-right text-[var(--theme-text-secondary)]">
                      {formatCompactUsd(coin.volume24h)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                      {volToMcapPct.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCoinToTrade && onSelectCoinToTrade(coin.symbol, coin);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide transition-all inline-flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                        }`}
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>{isSelected ? 'SELECTED' : 'SELECT'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--theme-text-muted)]">
        <div>
          Showing{' '}
          <strong className="text-[var(--theme-text-primary)]">
            {filteredCoins.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-[var(--theme-text-primary)]">
            {Math.min(currentPage * itemsPerPage, filteredCoins.length)}
          </strong>{' '}
          of <strong className="text-[var(--theme-text-primary)]">{filteredCoins.length}</strong>{' '}
          screened coins
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-bold text-[var(--theme-text-primary)]">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
