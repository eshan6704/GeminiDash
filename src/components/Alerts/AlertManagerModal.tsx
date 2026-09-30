import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  X,
  Waves,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  alertAudioEngine,
  CustomPriceAlert,
  loadStoredAlerts,
  saveStoredAlerts,
} from '../../services/alertSoundService';

interface AlertManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: string;
  activePrice: number;
}

export const AlertManagerModal: React.FC<AlertManagerModalProps> = ({
  isOpen,
  onClose,
  activeSymbol,
  activePrice,
}) => {
  const [alerts, setAlerts] = useState<CustomPriceAlert[]>(() => loadStoredAlerts());
  const [targetPrice, setTargetPrice] = useState<string>(activePrice ? activePrice.toString() : '');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [notes, setNotes] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() => alertAudioEngine.getMuted());

  useEffect(() => {
    if (activePrice) {
      setTargetPrice(activePrice.toString());
    }
  }, [activePrice, activeSymbol]);

  if (!isOpen) return null;

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const newAlert: CustomPriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol: activeSymbol.toUpperCase(),
      targetPrice: priceNum,
      condition,
      createdAt: Date.now(),
      triggered: false,
      notes: notes.trim() || undefined,
    };

    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveStoredAlerts(updated);
    setNotes('');
    alertAudioEngine.playBullishChime();
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveStoredAlerts(updated);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    alertAudioEngine.setMuted(newMuted);
  };

  const handleTestBull = () => alertAudioEngine.playBullishChime();
  const handleTestBear = () => alertAudioEngine.playBearishChime();
  const handleTestSonar = () => alertAudioEngine.playMegaWhaleSonar();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                Price & Whale Audio Alerts
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Desktop alerts & synthesized chimes for {activeSymbol}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
              }`}
              title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Create Alert Form */}
          <form onSubmit={handleAddAlert} className="space-y-3 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/50">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center justify-between">
              <span>Set Alert for {activeSymbol}</span>
              <span className="font-mono text-cyan-500">Live: ${activePrice.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-[var(--theme-text-secondary)] block mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-primary)] font-semibold"
                >
                  <option value="ABOVE">Price Rises Above (≥)</option>
                  <option value="BELOW">Price Drops Below (≤)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--theme-text-secondary)] block mb-1">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Target price in USD"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-primary)] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--theme-text-secondary)] block mb-1">
                Optional Label / Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. S1 Breakout, Take Profit 1, Stop Guard"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-primary)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Price Alert
            </button>
          </form>

          {/* Audio Chime Testing Strip */}
          <div className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Synthesizer Chime Tester</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleTestBull}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <TrendingUp className="w-3 h-3" /> Bull Chime
              </button>
              <button
                type="button"
                onClick={handleTestBear}
                className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <TrendingDown className="w-3 h-3" /> Bear Chime
              </button>
              <button
                type="button"
                onClick={handleTestSonar}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <Waves className="w-3 h-3" /> Whale Sonar
              </button>
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center justify-between">
              <span>Active Alerts ({alerts.length})</span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-xl">
                No active alerts set. Add one above to get real-time audio alerts!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      alert.triggered
                        ? 'border-zinc-700 bg-zinc-900/40 opacity-60'
                        : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          alert.condition === 'ABOVE' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-[var(--theme-text-primary)]">
                          <span>{alert.symbol}</span>
                          <span className="font-mono text-[var(--theme-text-secondary)]">
                            {alert.condition === 'ABOVE' ? '≥' : '≤'} ${alert.targetPrice.toLocaleString()}
                          </span>
                        </div>
                        {alert.notes && (
                          <div className="text-[11px] text-[var(--theme-text-secondary)]">
                            {alert.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--theme-text-secondary)] flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" /> Web Audio Engine Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[var(--theme-border)] text-xs font-semibold hover:bg-[var(--theme-bg)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
