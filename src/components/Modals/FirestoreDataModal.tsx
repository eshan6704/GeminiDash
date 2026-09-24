import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ExternalLink,
  RefreshCw,
  Search,
  Check,
  Copy,
  Layers,
  Activity,
  HardDrive,
  FileJson,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePersistentSymbols, PersistedSymbolPrice } from '../../services/symbolPersistenceService';
import { getSimulatorId } from '../../services/simulatorSyncService';
import { Position, LimitOrder, TradeRecord, SpotHolding } from '../../types/trading';
import { fetchAllMarketTables, DEFAULT_MARKET_TABLES, MarketTableData, MarketTableRow } from '../../services/marketDataTables';

interface FirestoreDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashBalance: number;
  totalEquity: number;
  positions: Position[];
  limitOrders: LimitOrder[];
  tradeHistory: TradeRecord[];
  spotHoldings: SpotHolding[];
  lastCloudSync?: Date | null;
  onManualSync?: () => void;
}

export const FirestoreDataModal: React.FC<FirestoreDataModalProps> = ({
  isOpen,
  onClose,
  cashBalance,
  totalEquity,
  positions,
  limitOrders,
  tradeHistory,
  spotHoldings,
  lastCloudSync,
  onManualSync,
}) => {
  const { isLight } = useTheme();
  const { prices, refresh, lastSync, symbolCount } = usePersistentSymbols();
  const [activeTab, setActiveTab] = useState<'TABLES' | 'SYMBOLS' | 'SIMULATOR' | 'CONFIG'>('TABLES');
  const [selectedTableId, setSelectedTableId] = useState<string>('nifty_500');
  const [tablesMap, setTablesMap] = useState<Record<string, MarketTableData>>(DEFAULT_MARKET_TABLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSymbolData, setSelectedSymbolData] = useState<PersistedSymbolPrice | null>(null);
  const [showRawTableJson, setShowRawTableJson] = useState(false);

  const projectId = 'fair-bot-l41j7';
  const databaseId = 'ai-studio-aurumxcryptogold-0c333403-4e27-4c9f-9345-a9a6f2b60c2d';
  const simulatorId = getSimulatorId();

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data`;
  const gcpConsoleUrl = `https://console.cloud.google.com/firestore/databases/${databaseId}/data?project=${projectId}`;

  useEffect(() => {
    if (isOpen) {
      refresh();
      fetchAllMarketTables().then((res) => {
        if (res && Object.keys(res).length > 0) {
          setTablesMap(res);
        }
      });
    }
  }, [isOpen, refresh]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      if (onManualSync) onManualSync();
      await refresh();
      await fetch('/api/quotes/sync-now', { method: 'POST' });
    } catch {
      // Ignored
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const symbolList = Object.values(prices).filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(q) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
      >
        {/* Header Bar */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${isLight ? 'border-slate-200 bg-slate-50/60' : 'border-neutral-800 bg-neutral-950/40'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Database className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Firebase / Firestore Database Viewer
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Project: {projectId}
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Database ID: <code className="font-mono text-[11px] text-amber-400">{databaseId}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
              title="Refresh Firestore documents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              title="Open Live Cloud Database in Firebase Console"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Database Metadata Ribbon */}
        <div className={`px-4 sm:px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${isLight ? 'bg-amber-50/50 border-amber-200/60 text-amber-950' : 'bg-amber-950/20 border-amber-500/20 text-amber-300'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Backend Persisted Storage:</span>
              <span className="font-semibold">Active (Every 25s auto-sync)</span>
            </div>
            <div>
              <span className="opacity-70">Synced Assets: </span>
              <span className="font-bold">{symbolCount} symbols</span>
            </div>
            <div>
              <span className="opacity-70">Client Sim Doc: </span>
              <span className="font-bold">{simulatorId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-70 text-[11px]">Last Sync:</span>
            <span className="font-bold text-[11px]">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Live'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className={`px-4 sm:px-5 pt-3 border-b flex items-center gap-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <button
            onClick={() => { setActiveTab('TABLES'); setSelectedSymbolData(null); }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'TABLES'
                ? 'border-amber-500 text-amber-500 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>Grouped Market Tables (7 Collections)</span>
          </button>

          <button
            onClick={() => { setActiveTab('SYMBOLS'); setSelectedSymbolData(null); }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SYMBOLS'
                ? 'border-amber-500 text-amber-500 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Single Doc: symbol_prices ({symbolList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('SIMULATOR'); setSelectedSymbolData(null); }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SIMULATOR'
                ? 'border-amber-500 text-amber-500 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Simulator State</span>
          </button>

          <button
            onClick={() => { setActiveTab('CONFIG'); setSelectedSymbolData(null); }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'CONFIG'
                ? 'border-amber-500 text-amber-500 font-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Cloud Config & REST Endpoints</span>
          </button>
        </div>

        {/* Tab 0: GROUPED BATCH MARKET TABLES IN FIRESTORE */}
        {activeTab === 'TABLES' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Table Selection Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {Object.values(tablesMap).map((table) => {
                const isSelected = selectedTableId === table.tableId;
                return (
                  <button
                    key={table.tableId}
                    onClick={() => {
                      setSelectedTableId(table.tableId);
                      setShowRawTableJson(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    <span>{table.name.split(' ')[0]}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-neutral-950 font-black' : 'bg-neutral-700/50 text-neutral-300'}`}>
                      {table.count || table.data?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Table Details & Firestore Path */}
            {tablesMap[selectedTableId] && (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/50 border-neutral-700'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-500">
                        {tablesMap[selectedTableId].name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        1 Document Batch Storage
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Firestore Document Path: <code className="text-amber-400">/market_tables/{selectedTableId}</code> ({tablesMap[selectedTableId].data?.length || 0} rows)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRawTableJson(!showRawTableJson)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        showRawTableJson
                          ? 'bg-amber-500 text-neutral-950 border-amber-400'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>{showRawTableJson ? 'Hide JSON' : 'View Table JSON'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        setIsRefreshing(true);
                        try {
                          await fetch('/api/tables/sync-now', { method: 'POST' });
                          const res = await fetchAllMarketTables();
                          setTablesMap(res);
                        } finally {
                          setTimeout(() => setIsRefreshing(false), 500);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Batch Sync Table</span>
                    </button>
                  </div>
                </div>

                {/* Raw Table JSON Preview */}
                {showRawTableJson && (
                  <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        Document /market_tables/{selectedTableId} (First 10 items preview)
                      </span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(tablesMap[selectedTableId], null, 2), 'tableJson')}
                        className="text-xs text-amber-500 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'tableJson' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'tableJson' ? 'Copied' : 'Copy Entire Table'}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-xs overflow-x-auto p-3 rounded-lg bg-neutral-900 text-emerald-400 max-h-56">
                      {JSON.stringify({
                        tableId: tablesMap[selectedTableId].tableId,
                        name: tablesMap[selectedTableId].name,
                        count: tablesMap[selectedTableId].count,
                        updatedAt: tablesMap[selectedTableId].updatedAt,
                        sampleData: (tablesMap[selectedTableId].data || []).slice(0, 8),
                      }, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Search Bar for Rows */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={`Search within ${tablesMap[selectedTableId].name} (${tablesMap[selectedTableId].data?.length} rows)...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-neutral-800 border-neutral-700 text-white focus:border-amber-500'
                    }`}
                  />
                </div>

                {/* Tabular Rows Viewer */}
                <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={`sticky top-0 z-10 uppercase text-[10px] tracking-wider font-bold ${isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-neutral-950 text-neutral-400 border-b border-neutral-800'}`}>
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Symbol</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-3 text-right">24h Change</th>
                          <th className="py-2.5 px-3 text-right">High / Low</th>
                          <th className="py-2.5 px-3 text-right">Category / Sector</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-neutral-800/60 bg-neutral-900'}`}>
                        {(tablesMap[selectedTableId].data || [])
                          .filter((r) => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (
                              r.symbol.toLowerCase().includes(q) ||
                              (r.name && r.name.toLowerCase().includes(q)) ||
                              (r.sector && r.sector.toLowerCase().includes(q)) ||
                              (r.category && r.category.toLowerCase().includes(q))
                            );
                          })
                          .slice(0, 100)
                          .map((row, idx) => {
                            const isUp = (row.change1d || 0) >= 0;
                            return (
                              <tr key={row.id || `${row.symbol}-${idx}`} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-800/40'}>
                                <td className="py-2 px-3 text-neutral-500 text-[11px]">{row.rank || idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-amber-500">{row.symbol}</td>
                                <td className="py-2 px-3 text-neutral-300 truncate max-w-[180px]">{row.name}</td>
                                <td className="py-2 px-3 text-right font-extrabold">
                                  {row.currency === 'INR' ? '₹' : '$'}
                                  {row.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td className={`py-2 px-3 text-right font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isUp ? '+' : ''}{row.change1d?.toFixed(2)}%
                                </td>
                                <td className="py-2 px-3 text-right text-neutral-400 text-[11px]">
                                  {row.high24h ? `${row.high24h} / ${row.low24h}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-[11px] text-neutral-400">
                                  {row.sector || row.category || row.tier || '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: symbol_prices Collection */}
        {activeTab === 'SYMBOLS' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Search and info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter by symbol, name, or asset class (e.g. BTC, PAXG, RELIANCE)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-neutral-800 border-neutral-700 text-white focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="text-xs font-mono text-neutral-400">
                Firestore Path: <code className="text-amber-400 font-bold">/symbol_prices/&#123;symbol&#125;</code>
              </div>
            </div>

            {/* Document grid / table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {symbolList.map((item) => {
                const isSelected = selectedSymbolData?.symbol === item.symbol;
                const isUp = (item.changePct ?? 0) >= 0;

                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbolData(isSelected ? null : item)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-neutral-800/60 hover:bg-neutral-800 border-neutral-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm font-mono tracking-tight text-amber-500">
                          {item.symbol}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            item.category === 'gold'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : item.category === 'crypto'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.category || 'Asset'}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{item.changePct?.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 truncate mb-2">
                      {item.name || item.symbol}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-neutral-700/40">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Price</span>
                        <span className="font-extrabold text-sm">
                          {item.currency === 'INR' ? '₹' : '$'}
                          {item.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 block">Updated</span>
                        <span className="text-[10px] text-neutral-400">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {symbolList.length === 0 && (
              <div className="text-center py-12 text-neutral-500 text-xs font-mono">
                No persisted symbols found matching "{searchQuery}".
              </div>
            )}

            {/* Selected Document Raw JSON Inspector */}
            {selectedSymbolData && (
              <div className={`p-4 rounded-xl border mt-4 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-bold text-xs">
                      Document: /symbol_prices/{selectedSymbolData.symbol}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedSymbolData, null, 2), 'doc')}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
                  >
                    {copiedKey === 'doc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'doc' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs overflow-x-auto p-3 rounded-lg bg-neutral-900 text-emerald-400 max-h-48">
                  {JSON.stringify(selectedSymbolData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: simulator_states Collection */}
        {activeTab === 'SIMULATOR' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/40 border-neutral-700'}`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                  Firestore Document ID
                </span>
                <code className="text-sm font-mono font-bold text-amber-400">
                  /simulator_states/{simulatorId}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onManualSync}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now to Firestore</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/60 border-neutral-700'}`}>
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Equity</span>
                <span className="text-base font-extrabold font-mono text-amber-500">
                  ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/60 border-neutral-700'}`}>
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Cash Balance</span>
                <span className="text-base font-extrabold font-mono text-emerald-500">
                  ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/60 border-neutral-700'}`}>
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Open Positions</span>
                <span className="text-base font-extrabold font-mono">
                  {positions.length} active
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/60 border-neutral-700'}`}>
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Trade History</span>
                <span className="text-base font-extrabold font-mono">
                  {tradeHistory.length} executed
                </span>
              </div>
            </div>

            {/* Open Positions stored */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Persisted Active Positions ({positions.length})</span>
              </h4>

              {positions.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs text-neutral-500 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/40 border-neutral-800'}`}>
                  No active leveraged positions stored. Place a trade in the terminal to view it here.
                </div>
              ) : (
                <div className="space-y-2">
                  {positions.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                        isLight ? 'bg-white border-slate-200' : 'bg-neutral-800/80 border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {p.side} {p.leverage}x
                        </span>
                        <span className="font-extrabold text-amber-400">{p.assetSymbol}</span>
                        <span className="text-neutral-400">Amount: {p.amount}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Entry: ${p.entryPrice?.toFixed(2)}</span>
                        <span>Margin: ${p.margin?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spot Holdings stored */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                <span>Persisted Spot Holdings ({spotHoldings.length})</span>
              </h4>

              {spotHoldings.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs text-neutral-500 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/40 border-neutral-800'}`}>
                  No spot holdings recorded.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {spotHoldings.map((h) => (
                    <div key={h.symbol} className={`p-2.5 rounded-xl border text-xs font-mono ${isLight ? 'bg-white border-slate-200' : 'bg-neutral-800 border-neutral-700'}`}>
                      <div className="font-bold text-amber-400">{h.symbol}</div>
                      <div className="text-neutral-400">Amount: {h.amount}</div>
                      <div className="text-[10px] text-neutral-500">Avg: ${h.avgCostPrice?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Cloud Config & Endpoints */}
        {activeTab === 'CONFIG' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
            {/* Direct Console Gateway Box */}
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2 font-bold font-sans text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>How to view directly in Google Cloud & Firebase Console:</span>
              </div>
              <p className="font-sans leading-relaxed mb-3 text-xs">
                Your database is provisioned on Firebase project <code className="font-mono font-bold bg-amber-500/20 px-1 py-0.5 rounded">{projectId}</code> (referred to as Fair-Bot / Firebolt). You can view the raw collections in your browser anytime:
              </p>

              <div className="flex flex-wrap gap-2">
                <a
                  href={firebaseConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-sans flex items-center gap-1.5 shadow"
                >
                  <span>Open in Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={gcpConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-1.5 rounded-lg border font-sans font-semibold flex items-center gap-1.5 transition-all ${
                    isLight ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <span>Open in Google Cloud Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Cloud Credentials Overview */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/50 border-neutral-700'}`}>
              <div className="font-bold text-xs uppercase tracking-wider text-neutral-400 font-sans">
                Project & Database Identifiers
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-700/50">
                <span className="text-neutral-400">Firebase Project ID:</span>
                <span className="font-bold text-amber-400">{projectId}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-700/50">
                <span className="text-neutral-400">Firestore Database ID:</span>
                <span className="font-bold text-amber-400">{databaseId}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-700/50">
                <span className="text-neutral-400">Auth Domain:</span>
                <span className="text-neutral-300">{projectId}.firebaseapp.com</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-700/50">
                <span className="text-neutral-400">Storage Bucket:</span>
                <span className="text-neutral-300">{projectId}.firebasestorage.app</span>
              </div>
            </div>

            {/* REST API Endpoints */}
            <div className={`p-4 rounded-xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-800/50 border-neutral-700'}`}>
              <div className="font-bold text-xs uppercase tracking-wider text-neutral-400 font-sans">
                Applet Backend REST Endpoints
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-bold">GET /api/quotes/persistent</span>
                  <button
                    onClick={() => handleCopy('/api/quotes/persistent', 'ep1')}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    {copiedKey === 'ep1' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-neutral-400 text-[11px] font-sans">
                  Returns all live market asset records mirrored and persisted in Firestore.
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-bold">GET /api/simulator/state/:id</span>
                  <button
                    onClick={() => handleCopy(`/api/simulator/state/${simulatorId}`, 'ep2')}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    {copiedKey === 'ep2' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-neutral-400 text-[11px] font-sans">
                  Loads user or client simulator state directly from Firestore.
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-400 font-bold">POST /api/quotes/sync-now</span>
                  <button
                    onClick={() => handleCopy('/api/quotes/sync-now', 'ep3')}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    {copiedKey === 'ep3' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-neutral-400 text-[11px] font-sans">
                  Forces an immediate round of quote fetches and Firestore sync for all core symbols.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-neutral-950'}`}>
          <div className="text-neutral-400 text-[11px]">
            Cloud persistent documents are securely governed by <code className="font-mono text-amber-500">firestore.rules</code>.
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
