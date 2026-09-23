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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                "What If?" Trading & Grid Simulation Lab
              </h2>
              <p className="text-xs text-neutral-400">
                Visualize exact DCA buy levels, preview order schedules on interactive charts, and model risk scenarios before confirming.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 pt-3 pb-1 border-b border-neutral-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('GRID_DCA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'GRID_DCA'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Grid DCA Order Visualizer & Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLASH_CRASH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'FLASH_CRASH'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Portfolio Flash Crash Stress Test</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GOLD_VS_CRYPTO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'GOLD_VS_CRYPTO'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gold vs Crypto Leverage Risk</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="overflow-y-auto py-4 pr-1 text-xs space-y-4 flex-1">
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
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <h3 className="font-bold text-white text-sm">
                      Flash Crash Stress Test on Live Positions
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Simulate Crash:</span>
                    <div className="flex items-center gap-1 font-mono">
                      {[5, 12, 20].map((drop) => (
                        <button
                          key={drop}
                          onClick={() => setMarketDropPct(drop)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            marketDropPct === drop
                              ? 'bg-rose-600 text-white'
                              : 'bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          -{drop}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {positions.length === 0 ? (
                  <p className="text-neutral-500 py-6 text-center">
                    You currently have no open leveraged positions in the simulator. Open a position to test if a -{marketDropPct}% sudden wick would trigger liquidation!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="divide-y divide-neutral-900 font-mono">
                      {crashResults.map((r, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-neutral-200">
                              {r.pos.assetSymbol} ({r.pos.leverage}x {r.pos.side})
                            </span>
                            <span className="text-[10px] text-neutral-500 block">
                              Asset drop: -{r.assetDrop.toFixed(1)}% | Liq Price: ${r.pos.liquidationPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            {r.wouldLiquidate ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px]">
                                LIQUIDATED (-${r.pos.margin.toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold">
                                Survives (-${r.simulatedLoss.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex justify-between font-mono font-bold text-neutral-300">
                      <span>Total Estimated Portfolio Drawdown:</span>
                      <span className="text-rose-400 text-sm">-${totalSimulatedLoss.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Gold vs Crypto Volatility Comparison */}
          {activeTab === 'GOLD_VS_CRYPTO' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">
                      Physical Gold (XAUT) vs Bitcoin (BTC): Volatility & Holding Dynamics
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-neutral-500">Test Capital:</span>
                    <input
                      type="number"
                      value={simCapital}
                      onChange={(e) => setSimCapital(Number(e.target.value) || 0)}
                      className="w-20 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-white text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gold Box */}
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Tether Gold (XAUT)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        1 XAUT = 1 oz Gold
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between text-neutral-400">
                        <span>90-Day Est. Return:</span>
                        <span className="text-emerald-400 font-bold">+{goldReturn90d}% (+${gold90dProfit.toFixed(0)})</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Historical Max Drawdown:</span>
                        <span className="text-amber-300 font-semibold">{goldMaxDrawdown}% (Mild)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Volatility Index:</span>
                        <span className="text-neutral-200">Very Low (~0.7% daily)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Real-World Backing:</span>
                        <span className="text-amber-300 font-sans text-[10px]">Swiss Vault Allocated Bullion</span>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Box */}
                  <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-orange-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        Bitcoin (BTC)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        High Beta Crypto
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between text-neutral-400">
                        <span>90-Day Est. Return:</span>
                        <span className="text-emerald-400 font-bold">+{btcReturn90d}% (+${btc90dProfit.toFixed(0)})</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Historical Max Drawdown:</span>
                        <span className="text-rose-400 font-semibold">{btcMaxDrawdown}% (Severe)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Volatility Index:</span>
                        <span className="text-neutral-200">High (~4.2% daily)</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Real-World Backing:</span>
                        <span className="text-neutral-300 font-sans text-[10px]">Algorithmic / Proof of Work</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leverage Danger Gauge */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-sm">
                    Leverage Danger Gauge: Why 20x+ Wipes Out Crypto Traders
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-mono">Test: {testLeverage}x</span>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="1"
                      value={testLeverage}
                      onChange={(e) => setTestLeverage(parseInt(e.target.value))}
                      className="w-24 accent-amber-400"
                    />
                  </div>
                </div>

                <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">
                  At <strong className="text-amber-400 font-mono">{testLeverage}x leverage</strong>, an adverse price move of only{' '}
                  <strong className="text-rose-400 font-mono">{goldLiqDist.toFixed(1)}%</strong> triggers an immediate liquidation and 100% loss of your margin.
                </p>

                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase block font-sans">Survival on XAUT Gold</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ~{daysToProbableLiqGold} days
                    </span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">Lower noise, stable trend</span>
                  </div>
                  <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase block font-sans">Survival on Bitcoin/ETH</span>
                    <span className="text-sm font-bold text-rose-400">
                      ~{daysToProbableLiqBtc} days
                    </span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">Frequent 5% wick liquidations</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
