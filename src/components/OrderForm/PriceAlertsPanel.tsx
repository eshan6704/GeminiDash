import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Volume2,
  Tag,
  Crosshair,
} from 'lucide-react';
import { MarketAsset } from '../../types/trading';
import { usePriceAlerts } from '../../hooks/usePriceAlerts';

interface PriceAlertsPanelProps {
  asset: MarketAsset;
  alertEngine: ReturnType<typeof usePriceAlerts>;
  onFillLimitPrice?: (price: number) => void;
  onClose?: () => void;
}

export const PriceAlertsPanel: React.FC<PriceAlertsPanelProps> = ({
  asset,
  alertEngine,
  onFillLimitPrice,
  onClose,
}) => {
  const {
    activeAlertsThisAsset,
    activeAlertsAll,
    triggeredAlerts,
    permState,
    requestPermission,
    testAlert,
    createAlert,
    deleteAlert,
    clearTriggered,
  } = alertEngine;

  const [targetPriceInput, setTargetPriceInput] = useState<string>(
    (asset.price * 1.01).toFixed(asset.price < 10 ? 4 : 2)
  );
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [noteInput, setNoteInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'THIS_ASSET' | 'ALL_ASSETS' | 'HISTORY'>('THIS_ASSET');
  const [testNotifSent, setTestNotifSent] = useState<boolean>(false);

  // Auto-detect direction condition when user types target price
  const handleTargetChange = (val: string) => {
    setTargetPriceInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      if (num > asset.price) {
        setCondition('ABOVE');
      } else if (num < asset.price) {
        setCondition('BELOW');
      }
    }
  };

  // Quick percentage presets (+0.5%, +1%, +2.5%, -0.5%, -1%, -2.5%)
  const applyPercentOffset = (offsetPct: number) => {
    const newTarget = asset.price * (1 + offsetPct / 100);
    const formatted = newTarget.toFixed(asset.price < 10 ? 4 : 2);
    setTargetPriceInput(formatted);
    setCondition(offsetPct >= 0 ? 'ABOVE' : 'BELOW');
  };

  // Quick note preset tags
  const applyPresetNote = (noteText: string) => {
    setNoteInput(noteText);
  };

  // Handle test alert button with temporary bounce state
  const handleTestAlert = () => {
    setTestNotifSent(true);
    testAlert();
    setTimeout(() => setTestNotifSent(false), 2000);
  };

  // Form submit handler
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetPriceInput);
    if (isNaN(target) || target <= 0) return;

    createAlert(target, condition, noteInput);
    setNoteInput('');
  };

  return (
    <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 space-y-4 text-xs font-sans shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              Price Alert System
              {activeAlertsThisAsset.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  {activeAlertsThisAsset.length} Active
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400">
              Set custom target prices & receive desktop push notifications
            </p>
          </div>
        </div>

        {/* Browser Permission Pill & Test Sound */}
        <div className="flex items-center gap-1.5">
          {permState === 'granted' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Push Alerts On
            </span>
          ) : permState === 'denied' ? (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] cursor-help"
              title="Notifications are blocked in your browser site permissions"
            >
              <BellOff className="w-3 h-3" />
              Blocked in Browser
            </span>
          ) : (
            <button
              type="button"
              onClick={requestPermission}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-colors"
            >
              <Bell className="w-3 h-3" />
              Enable Push
            </button>
          )}

          <button
            type="button"
            onClick={handleTestAlert}
            className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
            title="Test notification chime & browser alert popup"
          >
            <Volume2 className={`w-3.5 h-3.5 ${testNotifSent ? 'text-emerald-400 animate-bounce' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Target Price Form */}
      <form onSubmit={handleCreateAlert} className="space-y-3 bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">
            Target Price for <strong className="text-neutral-100">{asset.name} ({asset.symbol})</strong>:
          </span>
          <span className="font-mono text-neutral-300">
            Live: <strong className="text-amber-400">${asset.price.toFixed(asset.price < 10 ? 4 : 2)}</strong>
          </span>
        </div>

        {/* Condition & Target Price Input */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5 sm:col-span-5">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="ABOVE">Crosses Above (≥)</option>
              <option value="BELOW">Crosses Below (≤)</option>
            </select>
          </div>

          <div className="col-span-7 sm:col-span-7 relative">
            <span className="absolute left-3 top-2 text-xs text-neutral-500 font-mono">$</span>
            <input
              type="number"
              step="any"
              value={targetPriceInput}
              onChange={(e) => handleTargetChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-6 pr-3 py-2 text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>
        </div>

        {/* Quick Percentage Presets */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-neutral-500 font-sans text-[10px]">Quick:</span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => applyPercentOffset(0.5)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/20"
            >
              +0.5%
            </button>
            <button
              type="button"
              onClick={() => applyPercentOffset(1.0)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/20"
            >
              +1%
            </button>
            <button
              type="button"
              onClick={() => applyPercentOffset(2.5)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/20"
            >
              +2.5%
            </button>
            <button
              type="button"
              onClick={() => applyPercentOffset(-0.5)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/20"
            >
              -0.5%
            </button>
            <button
              type="button"
              onClick={() => applyPercentOffset(-1.0)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/20"
            >
              -1%
            </button>
            <button
              type="button"
              onClick={() => applyPercentOffset(-2.5)}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/20"
            >
              -2.5%
            </button>
          </div>
        </div>

        {/* Custom Note or Label */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-neutral-500" />
              Optional Trigger Note / Reason:
            </label>
            <div className="flex gap-1 text-[9px] text-neutral-400 font-mono">
              <button
                type="button"
                onClick={() => applyPresetNote('Take Profit Hit')}
                className="hover:text-amber-300"
              >
                +TP
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => applyPresetNote('Breakout Level')}
                className="hover:text-amber-300"
              >
                +Breakout
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => applyPresetNote('Dip Buy Entry')}
                className="hover:text-amber-300"
              >
                +Dip Buy
              </button>
            </div>
          </div>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="e.g. Resistance breakout, Take Profit target, Buy the dip..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit Alert Button */}
        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <Bell className="w-3.5 h-3.5 fill-neutral-950" />
          <span>Set Price Alert for {asset.symbol}</span>
        </button>
      </form>

      {/* Alert List Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1 text-[11px]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('THIS_ASSET')}
              className={`pb-1 px-1 font-semibold transition-colors border-b-2 ${
                activeTab === 'THIS_ASSET'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {asset.symbol} ({activeAlertsThisAsset.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL_ASSETS')}
              className={`pb-1 px-1 font-semibold transition-colors border-b-2 ${
                activeTab === 'ALL_ASSETS'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Assets ({activeAlertsAll.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-1 px-1 font-semibold transition-colors border-b-2 ${
                activeTab === 'HISTORY'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Triggered ({triggeredAlerts.length})
            </button>
          </div>

          {activeTab === 'HISTORY' && triggeredAlerts.length > 0 && (
            <button
              type="button"
              onClick={clearTriggered}
              className="text-[10px] text-neutral-500 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tab 1: Current Asset Active Alerts */}
        {activeTab === 'THIS_ASSET' && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeAlertsThisAsset.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 rounded-xl bg-neutral-900/40 border border-neutral-900">
                <BellOff className="w-5 h-5 mx-auto mb-1 text-neutral-600" />
                <p>No active price alerts for {asset.symbol}.</p>
                <span className="text-[10px] text-neutral-600">
                  Set a target price above to get notified.
                </span>
              </div>
            ) : (
              activeAlertsThisAsset.map((alert) => {
                const diffPct = ((alert.targetPrice - asset.price) / asset.price) * 100;
                const isAbove = alert.condition === 'ABOVE';

                return (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between gap-2 hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[10px] flex items-center gap-0.5 ${
                            isAbove
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isAbove ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isAbove ? '≥' : '≤'} ${alert.targetPrice.toFixed(alert.targetPrice < 10 ? 4 : 2)}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}% away)
                        </span>
                      </div>

                      {alert.note ? (
                        <p className="text-[10px] text-neutral-300 font-sans italic">
                          "{alert.note}"
                        </p>
                      ) : (
                        <p className="text-[9px] text-neutral-500 font-mono">
                          Created {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onFillLimitPrice && (
                        <button
                          type="button"
                          onClick={() => onFillLimitPrice(alert.targetPrice)}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-[10px] transition-colors flex items-center gap-1"
                          title="Fill limit order target with this alert price"
                        >
                          <Crosshair className="w-3 h-3" />
                          Fill Limit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: All Assets Alerts */}
        {activeTab === 'ALL_ASSETS' && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeAlertsAll.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 rounded-xl bg-neutral-900/40 border border-neutral-900">
                <p>No active price alerts across any assets.</p>
              </div>
            ) : (
              activeAlertsAll.map((alert) => {
                const isAbove = alert.condition === 'ABOVE';

                return (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-white font-sans text-xs">{alert.symbol}</strong>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            isAbove
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isAbove ? '≥' : '≤'} ${alert.targetPrice.toFixed(alert.targetPrice < 10 ? 4 : 2)}
                        </span>
                      </div>
                      {alert.note && (
                        <p className="text-[10px] text-neutral-300 font-sans italic mt-0.5">
                          "{alert.note}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Triggered Alerts History */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {triggeredAlerts.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 rounded-xl bg-neutral-900/40 border border-neutral-900">
                <p>No triggered alerts yet.</p>
                <span className="text-[10px] text-neutral-600">
                  When target prices are hit, alerts will log here.
                </span>
              </div>
            ) : (
              triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <strong className="text-white font-sans">{alert.symbol}</strong>
                      <span className="text-neutral-300">
                        Hit ${alert.targetPrice.toFixed(alert.targetPrice < 10 ? 4 : 2)}
                      </span>
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      Triggered {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : 'Recently'}
                      {alert.note && ` • "${alert.note}"`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
