import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Flame,
  LineChart,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MarketAsset, Position, AutoGridSpacingMode, OrderSide } from '../../types/trading';
import { GridDcaPreviewChart } from './GridDcaPreviewChart';

interface WhatIfScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Record<string, MarketAsset>;
  positions: Position[];
  selectedSymbol?: string;
  onApplyGridConfig?: (params: {
    symbol: string;
    side: OrderSide;
    gridSpacing: number;
    entryOffset: number;
    spacingMode?: AutoGridSpacingMode;
    upsideMultiplier?: number;
    downsideMultiplier?: number;
    stepMultiplier?: number;
    downsideGapMultiplier?: number;
    basePriceAnchor: number;
  }) => void;
}

export const WhatIfScenarioModal: React.FC<WhatIfScenarioModalProps> = ({
  isOpen,
  onClose,
  assets,
  positions,
  selectedSymbol = 'XAUT',
  onApplyGridConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'GRID_DCA' | 'FLASH_CRASH' | 'GOLD_VS_CRYPTO'>('GRID_DCA');

  const [simCapital, setSimCapital] = useState<number>(1000);
  const [testLeverage, setTestLeverage] = useState<number>(10);
  const [marketDropPct, setMarketDropPct] = useState<number>(12); // e.g. 12% crash

  // Scenario 1: Historical 90-Day Returns Simulation
  const goldReturn90d = 8.4;
  const btcReturn90d = 18.2;
  const goldMaxDrawdown = -2.8;
  const btcMaxDrawdown = -16.4;

  const gold90dProfit = (simCapital * goldReturn90d) / 100;
  const btc90dProfit = (simCapital * btcReturn90d) / 100;

  // Scenario 2: Flash Crash Stress Test on Current Positions
  const crashResults = positions.map((pos) => {
    const asset = assets[pos.assetSymbol];
    const isGold = asset?.category === 'gold';
    // Gold historically drops 1/4th as much during crypto flash crashes
    const assetDrop = isGold ? marketDropPct * 0.25 : marketDropPct;
    const postCrashPrice = pos.entryPrice * (1 - assetDrop / 100);

    const isLong = pos.side === 'LONG';
    const wouldLiquidate = isLong
      ? postCrashPrice <= pos.liquidationPrice
      : false;

    const simulatedLoss = wouldLiquidate
      ? pos.margin
      : Math.min(pos.margin, pos.amount * (pos.entryPrice - postCrashPrice));

    return {
      pos,
      assetDrop,
      postCrashPrice,
      wouldLiquidate,
      simulatedLoss,
    };
  });

  const totalSimulatedLoss = crashResults.reduce((acc, r) => acc + r.simulatedLoss, 0);

  // Scenario 3: Real-World Leverage Comparison: Gold vs Crypto
  const goldVolDaily = 0.7; // ~0.7% daily gold volatility
  const btcVolDaily = 4.2; // ~4.2% daily crypto volatility
  const mmr = 0.008;
  const goldLiqDist = (1 / testLeverage - mmr) * 100;
  const daysToProbableLiqGold = Math.max(1, Math.round(goldLiqDist / (goldVolDaily * 2)));
  const daysToProbableLiqBtc = Math.max(0.5, Number((goldLiqDist / (btcVolDaily * 2)).toFixed(1)));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-md max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col text-[var(--theme-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                "WHAT IF?" SIMULATION LAB
              </h2>
              <p className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-tight">
                VISUALIZE GRID DCA LEVELS & MODEL RISK SCENARIOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 pt-3 pb-1 border-b border-[var(--theme-border)] flex-shrink-0">
          {[
            { id: 'GRID_DCA', label: 'GRID DCA PREVIEW', icon: LineChart },
            { id: 'FLASH_CRASH', label: 'STRESS TEST', icon: Flame },
            { id: 'GOLD_VS_CRYPTO', label: 'RISK AUDIT', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-sm text-[9px] font-bold transition-all flex items-center gap-1.5 border uppercase ${
                activeTab === tab.id
                  ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-black'
                  : 'text-[var(--theme-text-muted)] border-transparent hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-subtle)]'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto py-4 pr-1 text-[11px] space-y-4 flex-1 no-scrollbar">
          {/* TAB 1: Visual Grid DCA Preview Chart */}
          {activeTab === 'GRID_DCA' && (
            <GridDcaPreviewChart
              assets={assets}
              defaultSymbol={selectedSymbol}
              onApplyConfigToBot={onApplyGridConfig}
              onClose={onClose}
            />
          )}

          {/* TAB 2: Flash Crash Portfolio Stress Test */}
          {activeTab === 'FLASH_CRASH' && (
            <div className="space-y-4">
              <div className="bg-[var(--theme-bg-card-subtle)] p-4 rounded-sm border border-[var(--theme-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <h3 className="font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                      PORTFOLIO FLASH CRASH STRESS TEST
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--theme-text-muted)] uppercase text-[9px] font-bold">SIMULATE:</span>
                    <div className="flex items-center gap-1 font-mono">
                      {[5, 12, 20].map((drop) => (
                        <button
                          key={drop}
                          onClick={() => setMarketDropPct(drop)}
                          className={`px-2 py-0.5 rounded-sm text-[9px] font-bold border transition-colors ${
                            marketDropPct === drop
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'bg-[var(--theme-bg-card)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                          }`}
                        >
                          -{drop}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {positions.length === 0 ? (
                  <p className="text-[var(--theme-text-muted)] py-10 text-center uppercase font-bold tracking-tight">
                    NO ACTIVE LEVERAGED POSITIONS TO TEST.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="divide-y divide-[var(--theme-border-subtle)] font-mono">
                      {crashResults.map((r, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[var(--theme-text-secondary)]">
                              {r.pos.assetSymbol} ({r.pos.leverage}x {r.pos.side})
                            </span>
                            <span className="text-[9px] text-[var(--theme-text-muted)] block uppercase">
                              DROP: -{r.assetDrop.toFixed(1)}% | LIQ PRICE: ${r.pos.liquidationPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            {r.wouldLiquidate ? (
                              <span className="px-2 py-0.5 rounded-sm bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-[9px] uppercase">
                                LIQUIDATED (-${r.pos.margin.toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-bold">
                                SURVIVES (-${r.simulatedLoss.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[var(--theme-border-subtle)] flex justify-between font-mono font-bold uppercase">
                      <span className="text-[var(--theme-text-muted)]">EST. TOTAL DRAWDOWN:</span>
                      <span className="text-rose-500 text-[12px]">-${totalSimulatedLoss.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Gold vs Crypto Volatility Comparison */}
          {activeTab === 'GOLD_VS_CRYPTO' && (
            <div className="space-y-4">
              <div className="bg-[var(--theme-bg-card-subtle)] p-4 rounded-sm border border-[var(--theme-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                      GOLD (XAUT) VS BITCOIN (BTC) VOLATILITY
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[var(--theme-text-muted)] text-[9px] uppercase font-bold">CAPITAL:</span>
                    <input
                      type="number"
                      value={simCapital}
                      onChange={(e) => setSimCapital(Number(e.target.value) || 0)}
                      className="w-20 bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] px-2 py-0.5 rounded-sm text-[var(--theme-text-primary)] text-right font-bold outline-none focus:border-[var(--theme-accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gold Box */}
                  <div className="p-3 rounded-sm bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-500 flex items-center gap-1 text-[10px] uppercase">
                        <ShieldCheck className="w-3 h-3" />
                        TETHER GOLD
                      </span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px] uppercase">
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>90D EST. RETURN:</span>
                        <span className="text-emerald-500 font-bold">+{goldReturn90d}% (+${gold90dProfit.toFixed(0)})</span>
                      </div>
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>MAX DRAWDOWN:</span>
                        <span className="text-amber-500/80 font-bold">{goldMaxDrawdown}%</span>
                      </div>
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>VOLATILITY:</span>
                        <span className="text-[var(--theme-text-secondary)]">LOW (0.7% DAILY)</span>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Box */}
                  <div className="p-3 rounded-sm bg-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-orange-500 flex items-center gap-1 text-[10px] uppercase">
                        <Zap className="w-3 h-3" />
                        BITCOIN
                      </span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px] uppercase">
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>90D EST. RETURN:</span>
                        <span className="text-emerald-500 font-bold">+{btcReturn90d}% (+${btc90dProfit.toFixed(0)})</span>
                      </div>
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>MAX DRAWDOWN:</span>
                        <span className="text-rose-500 font-bold">{btcMaxDrawdown}%</span>
                      </div>
                      <div className="flex justify-between text-[var(--theme-text-muted)]">
                        <span>VOLATILITY:</span>
                        <span className="text-[var(--theme-text-secondary)]">HIGH (4.2% DAILY)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leverage Danger Gauge */}
              <div className="bg-[var(--theme-bg-card-subtle)] p-4 rounded-sm border border-[var(--theme-border-subtle)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                    LEVERAGE DANGER GAUGE
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--theme-text-muted)] font-mono text-[10px] font-bold">{testLeverage}x</span>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="1"
                      value={testLeverage}
                      onChange={(e) => setTestLeverage(parseInt(e.target.value))}
                      className="w-24 accent-[var(--theme-accent)]"
                    />
                  </div>
                </div>

                <p className="text-[var(--theme-text-muted)] text-[10px] leading-relaxed mb-4 uppercase font-bold">
                  AT <span className="text-[var(--theme-accent)]">{testLeverage}X LEVERAGE</span>, A MOVE OF <span className="text-rose-500">{goldLiqDist.toFixed(1)}%</span> TRIGGERS LIQUIDATION.
                </p>

                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="bg-[var(--theme-bg-card)] p-3 rounded-sm border border-[var(--theme-border-subtle)]">
                    <span className="text-[9px] text-[var(--theme-text-muted)] uppercase block font-bold mb-1">XAUT SURVIVAL</span>
                    <span className="text-[12px] font-bold text-emerald-500">
                      ~{daysToProbableLiqGold} DAYS
                    </span>
                  </div>
                  <div className="bg-[var(--theme-bg-card)] p-3 rounded-sm border border-[var(--theme-border-subtle)]">
                    <span className="text-[9px] text-[var(--theme-text-muted)] uppercase block font-bold mb-1">BTC SURVIVAL</span>
                    <span className="text-[12px] font-bold text-rose-500">
                      ~{daysToProbableLiqBtc} DAYS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--theme-border)] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-sm bg-[var(--theme-bg-card-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border-subtle)] font-bold text-[10px] uppercase transition-colors"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
