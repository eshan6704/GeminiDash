import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Position, SpotHolding, MarketAsset } from '../../types/trading';
import { analyzePortfolioRisk } from '../../services/geminiRiskAnalyst';

interface AiRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  equity: number;
  cash: number;
  unrealizedPnL: number;
  positions: Position[];
  spotHoldings: SpotHolding[];
  assets: Record<string, MarketAsset>;
}

export const AiRiskModal: React.FC<AiRiskModalProps> = ({
  isOpen,
  onClose,
  equity,
  cash,
  unrealizedPnL,
  positions,
  spotHoldings,
  assets,
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await analyzePortfolioRisk({
        equity,
        cash,
        unrealizedPnL,
        positions,
        spotHoldings,
        assets,
      });
      setAnalysis(res);
    } catch (e) {
      setAnalysis('Unable to complete portfolio risk analysis at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-neutral-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Institutional Risk & Gold Hedge Auditor
              </h3>
              <p className="text-[11px] text-neutral-400">
                Audits leverage health, liquidation hazard distances, and Tether Gold (XAUT) hedge efficiency.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[220px] max-h-[380px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Analyzing live open positions, volatility beta, and liquidation buffers...</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
              {analysis}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between mt-3 text-xs">
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
