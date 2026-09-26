import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  RefreshCw, 
  FileJson, 
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Trash2
} from 'lucide-react';
import { backblazeService, B2Item } from '../../services/backblazeService';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulatorData?: {
    cashBalance: number;
    totalEquity: number;
    tradeHistory: any[];
    positions: any[];
    spotHoldings: any[];
  };
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose, simulatorData }) => {
  const [files, setFiles] = useState<B2Item[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const downloadSessionCsv = () => {
    if (!simulatorData) return;

    try {
      const { cashBalance, totalEquity, tradeHistory, positions, spotHoldings } = simulatorData;
      
      let csvContent = "AURUMX INSTITUTIONAL TRADING SESSION REPORT\n";
      csvContent += `Generated At,${new Date().toISOString()}\n\n`;
      
      csvContent += "SUMMARY STATS\n";
      csvContent += `Cash Balance (USDT),${cashBalance.toFixed(2)}\n`;
      csvContent += `Total Equity (USDT),${totalEquity.toFixed(2)}\n`;
      csvContent += `Total Trades,${tradeHistory.length}\n\n`;

      if (positions.length > 0) {
        csvContent += "ACTIVE POSITIONS\n";
        csvContent += "Symbol,Side,Entry,Amount,Margin,Leverage,Unrealized PnL,PnL %\n";
        positions.forEach(p => {
          csvContent += `${p.assetSymbol},${p.side},${p.entryPrice},${p.amount},${p.margin},${p.leverage},${p.unrealizedPnL?.toFixed(2)},${p.unrealizedPnLPercent?.toFixed(2)}%\n`;
        });
        csvContent += "\n";
      }

      if (spotHoldings.length > 0) {
        csvContent += "SPOT HOLDINGS\n";
        csvContent += "Symbol,Amount,Avg Cost\n";
        spotHoldings.forEach(h => {
          csvContent += `${h.symbol},${h.amount},${h.avgCostPrice}\n`;
        });
        csvContent += "\n";
      }

      if (tradeHistory.length > 0) {
        csvContent += "TRADE HISTORY\n";
        csvContent += "Time,Symbol,Side,Entry,Exit,PnL,PnL %,Reason\n";
        tradeHistory.forEach(t => {
          csvContent += `${new Date(t.closeTime).toISOString()},${t.assetSymbol},${t.side},${t.entryPrice},${t.exitPrice},${t.realizedPnL.toFixed(2)},${t.realizedPnLPercent.toFixed(2)}%,${t.closeReason}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `aurumx_session_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg("Session report CSV downloaded successfully.");
    } catch (err: any) {
      setError(`Failed to generate CSV: ${err.message}`);
    }
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await backblazeService.listAll();
      setFiles(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await backblazeService.uploadRawFile(file);
    if (result.success) {
      setSuccessMsg(`File "${file.name}" uploaded successfully!`);
      fetchFiles();
    } else {
      setError(result.error || 'Upload failed');
    }
    setIsUploading(false);
    // Reset input
    e.target.value = '';
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    setIsLoading(true);
    const success = await backblazeService.deleteItem(name);
    if (success) {
      setSuccessMsg(`File "${name}" deleted.`);
      fetchFiles();
    } else {
      setError(`Failed to delete "${name}".`);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (name.endsWith('.json')) return <FileJson className="w-5 h-5 text-amber-500" />;
    if (name.endsWith('.csv')) return <FileText className="w-5 h-5 text-emerald-500" />;
    return <FileIcon className="w-5 h-5 text-blue-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--theme-bg-card)] w-full max-w-2xl rounded-md shadow-2xl overflow-hidden border border-[var(--theme-border)] flex flex-col max-h-[85vh] text-[var(--theme-text-primary)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-card-subtle)]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">BACKBLAZE B2 STORAGE EXPLORER</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Upload Section */}
          <div className="p-4 rounded-sm border border-dashed border-[var(--theme-border-subtle)] hover:border-[var(--theme-accent)] transition-colors group relative bg-[var(--theme-bg-card-subtle)]">
            <input 
              type="file" 
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              accept=".pdf,.csv,.json"
            />
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className={`p-3 rounded-sm mb-3 ${isUploading ? 'bg-amber-500/10' : 'bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)]'}`}>
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-[var(--theme-text-muted)] group-hover:text-[var(--theme-accent)] transition-colors" />
                )}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-tight">
                {isUploading ? 'UPLOADING...' : 'DROP FILES HERE OR CLICK TO UPLOAD'}
              </p>
              <p className="text-[10px] text-[var(--theme-text-muted)] mt-1 uppercase">Supports CSV, PDF, and JSON reports</p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 rounded-sm bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-500 text-[10px] font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-500 text-[10px] font-bold">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Files List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] flex items-center gap-2">
                STORED FILES ({files.length})
              </h3>
              <button 
                onClick={fetchFiles}
                disabled={isLoading}
                className="p-1 rounded-sm hover:bg-[var(--theme-bg-card-subtle)] transition-colors"
                title="Refresh file list"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[var(--theme-text-muted)] ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="border border-[var(--theme-border-subtle)] rounded-sm divide-y divide-[var(--theme-border-subtle)] overflow-hidden bg-[var(--theme-bg-card-subtle)]">
              {files.length === 0 ? (
                <div className="p-10 text-center text-[var(--theme-text-muted)]">
                  <FileIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] uppercase font-bold">No files stored in B2 bucket yet.</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.name} className="p-3 flex items-center justify-between hover:bg-[var(--theme-bg-card)] transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getFileIcon(file.name)}
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] text-[var(--theme-text-muted)] font-mono uppercase">
                          {formatSize(file.size)} • {new Date(file.lastModified).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`/api/storage/download/${file.name}`}
                        download
                        className="p-2 rounded-sm bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] hover:text-amber-500 transition-all border border-[var(--theme-border-subtle)]"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="p-2 rounded-sm bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)] hover:text-rose-500 transition-all border border-[var(--theme-border-subtle)]"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-[9px] text-[var(--theme-text-muted)] font-mono uppercase tracking-widest order-3 sm:order-1">
            B2 CLOUD STORAGE ACTIVE
          </div>
          
          <div className="flex items-center gap-2 order-2">
            {simulatorData && (
              <button 
                onClick={downloadSessionCsv}
                className="px-4 py-1.5 rounded-sm text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors flex items-center gap-2 shadow-md uppercase"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-5 py-1.5 rounded-sm text-[10px] font-bold bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] hover:border-[var(--theme-border)] border border-[var(--theme-border-subtle)] transition-colors uppercase"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};
