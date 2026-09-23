import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, Info, RefreshCw } from 'lucide-react';
import { INITIAL_ASSETS, fetchCandles } from '../../services/marketData';
import { calculateRSI } from '../../utils/indicators';
import { MarketAsset } from '../../types/trading';

interface ScreenedAsset extends MarketAsset {
  rsi: number | null;
}

export const CryptoScreener: React.FC = () => {
  const { isLight } = useTheme();
  const [assets, setAssets] = useState<ScreenedAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<ScreenedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rsiFilter, setRsiFilter] = useState<'all' | 'overbought' | 'oversold'>('all');
  const [minVolume, setMinVolume] = useState<number>(0);
  const [minMarketCap, setMinMarketCap] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const symbolList = Object.keys(INITIAL_ASSETS);
      const screened: ScreenedAsset[] = [];

      for (const symbol of symbolList) {
        const asset = INITIAL_ASSETS[symbol];
        const candles = await fetchCandles(symbol, '1h');
        const prices = candles.map(c => c.close);
        const rsi = calculateRSI(prices);
        screened.push({ ...asset, rsi });
      }

      setAssets(screened);
      setFilteredAssets(screened);
      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    let result = assets.filter(a => 
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (rsiFilter === 'overbought') {
      result = result.filter(a => a.rsi !== null && a.rsi >= 70);
    } else if (rsiFilter === 'oversold') {
      result = result.filter(a => a.rsi !== null && a.rsi <= 30);
    }

    if (minVolume > 0) {
      result = result.filter(a => (a.volume24h || 0) >= minVolume);
    }

    if (minMarketCap > 0) {
      result = result.filter(a => (a.marketCap || 0) >= minMarketCap);
    }

    setFilteredAssets(result);
  }, [searchQuery, rsiFilter, minVolume, minMarketCap, assets]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search coin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-xs font-mono outline-none transition-all ${
              isLight ? 'bg-white border-slate-200 focus:border-indigo-400' : 'bg-neutral-900 border-neutral-800 focus:border-indigo-500 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black text-neutral-500">RSI Range</label>
          <select 
            value={rsiFilter}
            onChange={(e) => setRsiFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <option value="all">All Levels</option>
            <option value="overbought">Overbought (&gt;70)</option>
            <option value="oversold">Oversold (&lt;30)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black text-neutral-500">Min Vol (24h)</label>
          <select 
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <option value={0}>Any</option>
            <option value={1000000}>&gt; $1M</option>
            <option value={10000000}>&gt; $10M</option>
            <option value={100000000}>&gt; $100M</option>
            <option value={1000000000}>&gt; $1B</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black text-neutral-500">Min Market Cap</label>
          <select 
            value={minMarketCap}
            onChange={(e) => setMinMarketCap(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
              isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <option value={0}>Any</option>
            <option value={100000000}>&gt; $100M</option>
            <option value={1000000000}>&gt; $1B</option>
            <option value={10000000000}>&gt; $10B</option>
          </select>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <div className={`rounded-xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`text-[10px] uppercase font-black ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-neutral-950 text-neutral-500'}`}>
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">24h Change</th>
                <th className="px-4 py-3">RSI (1h)</th>
                <th className="px-4 py-3 text-right">24h Volume</th>
                <th className="px-4 py-3 text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span className="font-mono text-neutral-400">Scanning Digital Assets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500 italic">
                    No coins match your filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.symbol} className={`hover:bg-neutral-800/20 transition-colors`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black">{asset.symbol}</span>
                        <span className="text-[10px] text-neutral-500">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(asset.change24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        asset.rsi && asset.rsi >= 70 ? 'bg-rose-500/20 text-rose-400' : 
                        asset.rsi && asset.rsi <= 30 ? 'bg-emerald-500/20 text-emerald-400' : 
                        'text-neutral-400'
                      }`}>
                        {asset.rsi ? asset.rsi.toFixed(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-neutral-400">
                      ${formatNumber(asset.volume24h || 0)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-neutral-400">
                      ${formatNumber(asset.marketCap || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`p-3 rounded-lg border flex items-center gap-3 ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300'}`}>
        <Info className="w-4 h-4 shrink-0" />
        <p className="text-[10px] leading-tight">
          The screener uses real-time exchange data and neural indicators. RSI is calculated based on 1-hour candles.
        </p>
      </div>
    </div>
  );
};
