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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-md max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-[var(--theme-text-primary)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)] mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              BROKER & EXECUTION SETTINGS
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-[11px]">
          {/* Shark Exchange Preset Box */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 p-3 rounded-sm flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Building2 className="w-3 h-3" />
                <span>SHARK EXCHANGE PRESET</span>
              </div>
              <p className="text-[10px] text-[var(--theme-text-muted)] font-mono leading-snug">
                BROKERAGE: <span className="text-amber-500 font-bold">MAKER 0.016%</span> | <span className="text-orange-500 font-bold">TAKER 0.064%</span><br />
                MARGIN: <span className="text-amber-500">GOLD 75x</span> | <span className="text-orange-500">BTC 150x</span> | <span className="text-blue-500">REST 25x</span>
              </p>
            </div>
            <button
              type="button"
              onClick={applySharkPreset}
              className="px-2.5 py-1 rounded-sm bg-cyan-600 hover:bg-cyan-700 text-white font-bold shrink-0 transition-colors text-[9px] uppercase"
            >
              Apply
            </button>
          </div>

          {/* Editable Starting Balance */}
          <div className="bg-[var(--theme-bg-card-subtle)] p-3 rounded-sm border border-[var(--theme-border-subtle)] space-y-2">
            <label className="font-bold text-[var(--theme-text-secondary)] block uppercase tracking-tight">
              STARTING BALANCE ($ USDT)
            </label>
            <div className="flex gap-2 font-mono">
              <input
                type="number"
                min="10"
                step="10"
                value={resetBalanceInput}
                onChange={(e) => setResetBalanceInput(parseFloat(e.target.value) || 100)}
                className="flex-1 bg-[var(--theme-bg-main)] border border-[var(--theme-border-subtle)] px-3 py-1.5 rounded-sm text-[var(--theme-text-primary)] font-bold outline-none focus:border-[var(--theme-accent)]"
              />
              <button
                type="button"
                onClick={() => {
                  onReset(resetBalanceInput);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-sm bg-amber-500 hover:bg-amber-600 text-black font-bold transition-colors text-[10px] uppercase"
              >
                Reset Account
              </button>
            </div>
          </div>

          {/* Quick Virtual Fund Deposit */}
          <div className="bg-[var(--theme-bg-card-subtle)] p-3 rounded-sm border border-[var(--theme-border-subtle)]">
            <label className="font-bold text-[var(--theme-text-secondary)] block mb-2 uppercase tracking-tight">
              INSTANT USDT DEPOSIT
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[1000, 5000, 25000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    onAddFunds(amt);
                  }}
                  className="py-1.5 rounded-sm bg-[var(--theme-bg-main)] hover:bg-emerald-500/10 text-emerald-500 font-bold border border-[var(--theme-border-subtle)] hover:border-emerald-500/30 transition-colors text-[10px]"
                >
                  +${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Modeling */}
          <div className="bg-[var(--theme-bg-card-subtle)] p-3 rounded-sm border border-[var(--theme-border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                ENABLE TRADING FEES
              </span>
              <input
                type="checkbox"
                checked={localConfig.enableFees}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enableFees: e.target.checked })
                }
                className="accent-[var(--theme-accent)] w-3.5 h-3.5 cursor-pointer"
              />
            </div>

            {localConfig.enableFees && (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-[var(--theme-text-muted)] text-[9px] block uppercase">Taker Fee (%)</span>
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
                    className="w-full bg-[var(--theme-bg-main)] border border-[var(--theme-border-subtle)] px-2 py-1 rounded-sm text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
                <div>
                  <span className="text-[var(--theme-text-muted)] text-[9px] block uppercase">Maker Fee (%)</span>
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
                    className="w-full bg-[var(--theme-bg-main)] border border-[var(--theme-border-subtle)] px-2 py-1 rounded-sm text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Slippage Modeling */}
          <div className="bg-[var(--theme-bg-card-subtle)] p-3 rounded-sm border border-[var(--theme-border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">
                SIMULATE SLIPPAGE
              </span>
              <input
                type="checkbox"
                checked={localConfig.enableSlippage}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, enableSlippage: e.target.checked })
                }
                className="accent-[var(--theme-accent)] w-3.5 h-3.5 cursor-pointer"
              />
            </div>
            {localConfig.enableSlippage && (
              <div className="pt-1 font-mono">
                <span className="text-[var(--theme-text-muted)] text-[9px] block uppercase">
                  Avg Slippage Rate (%)
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
                  className="w-full bg-[var(--theme-bg-main)] border border-[var(--theme-border-subtle)] px-2 py-1 rounded-sm text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] mt-1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-[var(--theme-border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] text-[10px] font-bold uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-sm bg-[var(--theme-accent)] text-black font-bold text-[10px] uppercase shadow-md transition-all active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>

  );
};
