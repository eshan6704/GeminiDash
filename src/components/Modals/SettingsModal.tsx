import React, { useState } from 'react';
import { X, Settings, DollarSign, Sliders, RefreshCw, PlusCircle, Check, Building2 } from 'lucide-react';
import { SimulatorConfig, SHARK_EXCHANGE } from '../../types/trading';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulatorConfig;
  onSaveConfig: (newConfig: SimulatorConfig) => void;
  onReset: (newBalance?: number) => void;
  onAddFunds: (amount: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onReset,
  onAddFunds,
}) => {
  if (!isOpen) return null;

  const [localConfig, setLocalConfig] = useState<SimulatorConfig>(config);
  const [resetBalanceInput, setResetBalanceInput] = useState<number>(config.initialBalance);

  const applySharkPreset = () => {
    setLocalConfig({
      ...localConfig,
      brokerName: SHARK_EXCHANGE.name,
      takerFeeRate: SHARK_EXCHANGE.takerBrokerageRateDecimal, // 0.064% (4x maker)
      makerFeeRate: SHARK_EXCHANGE.makerBrokerageRateDecimal, // 0.016% maker
      enableFees: true,
    });
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Broker & Execution Settings
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Shark Exchange Preset Box */}
          <div className="bg-cyan-50/70 border border-cyan-200 p-3 rounded-xl flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-900 font-bold mb-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-700" />
                <span>Shark Exchange Broker Specs</span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono leading-snug">
                Brokerage: <span className="text-amber-700 font-bold">Maker 0.016%</span> | <span className="text-orange-700 font-bold">Taker 0.064% (4x Maker)</span><br />
                Margin: <span className="text-amber-700">Gold 75x</span> | <span className="text-orange-700">BTC 150x</span> | <span className="text-blue-700">Rest 25x</span><br />
                Sizing: Default lot 0.002 | Gold 0.1 size | BTC 0.002 lot
              </p>
            </div>
            <button
              type="button"
              onClick={applySharkPreset}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold shrink-0 transition-colors text-[10px]"
            >
              Apply Preset
            </button>
          </div>

          {/* Editable Starting Balance */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label className="font-semibold text-slate-800 block">
              Editable Starting Balance ($ USDT)
            </label>
            <div className="flex gap-2 font-mono">
              <input
                type="number"
                min="10"
                step="10"
                value={resetBalanceInput}
                onChange={(e) => setResetBalanceInput(parseFloat(e.target.value) || 100)}
                className="flex-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  onReset(resetBalanceInput);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold transition-colors text-xs shadow-xs"
              >
                Reset & Apply
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Resets simulation positions and sets your starting cash balance to this amount.
            </p>
          </div>

          {/* Quick Virtual Fund Deposit */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="font-semibold text-slate-800 block mb-2">
              Add Virtual USDT Funds (Instant Deposit)
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[1000, 5000, 25000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    onAddFunds(amt);
                  }}
                  className="py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-slate-200 hover:border-emerald-300 transition-colors shadow-xs"
                >
                  +${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Modeling */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Brokerage Trading Fees (Shark: 0.016%)
              </span>
              <input
                type="checkbox"
                checked={localConfig.enableFees}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enableFees: e.target.checked })
                }
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </div>

            {localConfig.enableFees && (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Taker Fee (%)</span>
                  <input
                    type="number"
                    step="0.001"
                    value={(localConfig.takerFeeRate * 100).toFixed(3)}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        takerFeeRate: (parseFloat(e.target.value) || 0) / 100,
                      })
                    }
                    className="w-full bg-white border border-slate-300 px-2 py-1 rounded text-slate-900"
                  />
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Maker Fee (%)</span>
                  <input
                    type="number"
                    step="0.001"
                    value={(localConfig.makerFeeRate * 100).toFixed(3)}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        makerFeeRate: (parseFloat(e.target.value) || 0) / 100,
                      })
                    }
                    className="w-full bg-white border border-slate-300 px-2 py-1 rounded text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Slippage Modeling */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Simulate Market Slippage
              </span>
              <input
                type="checkbox"
                checked={localConfig.enableSlippage}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enableSlippage: e.target.checked })
                }
                className="accent-blue-600 w-4 h-4 cursor-pointer"
              />
            </div>
            {localConfig.enableSlippage && (
              <div className="pt-1 font-mono">
                <span className="text-slate-500 text-[10px] block">
                  Average Market Slippage Rate (%)
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={(localConfig.slippageRate * 100).toFixed(2)}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      slippageRate: (parseFloat(e.target.value) || 0) / 100,
                    })
                  }
                  className="w-full bg-white border border-slate-300 px-2 py-1 rounded text-slate-900 mt-1"
                />
              </div>
            )}
          </div>

          {/* Reset Account */}
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
            <span className="font-semibold text-rose-800 block mb-1">
              Reset Simulation State
            </span>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={resetBalanceInput}
                onChange={(e) => setResetBalanceInput(Number(e.target.value) || 10000)}
                className="w-28 bg-white border border-slate-300 px-2 py-1 rounded font-mono text-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all positions, history, and balance?')) {
                    onReset(resetBalanceInput);
                    onClose();
                  }
                }}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
              >
                Reset Account
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
