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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-md max-w-xl w-full p-5 sm:p-6 shadow-2xl relative text-[var(--theme-text-primary)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-amber-500 text-black flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                PORTFOLIO RISK AUDITOR
              </h3>
              <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-tight">
                AUDITS LEVERAGE, LIQUIDATION HAZARDS, AND HEDGE EFFICIENCY
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-[220px] max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center text-[var(--theme-text-muted)] text-[10px] font-bold uppercase flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              <span>ANALYZING LIVE POSITIONS & VOLATILITY...</span>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed space-y-3 whitespace-pre-line font-mono">
              {analysis}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--theme-border)] flex items-center justify-between mt-3 text-[10px] font-bold uppercase">
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[var(--theme-text-muted)] hover:text-amber-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>RE-EVALUATE</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border-subtle)] transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
