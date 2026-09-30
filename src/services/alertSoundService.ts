// Web Audio API Sound Synthesizer for Price & Whale Alerts
class AlertAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('shark_terminal_audio_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public getMuted(): boolean {
    try {
      return localStorage.getItem('shark_terminal_audio_muted') === 'true';
    } catch {
      return false;
    }
  }

  // Play a crisp upward chime for Bullish / Price Cross Above / Whale Buy
  public playBullishChime() {
    if (this.isMuted || this.getMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Play a resonant warning chord for Price Cross Below / Whale Sell
  public playBearishChime() {
    if (this.isMuted || this.getMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12); // A4
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.28); // E4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {}
  }

  // Deep underwater sonar gong for Mega Whale (> $100k)
  public playMegaWhaleSonar() {
    if (this.isMuted || this.getMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      osc1.frequency.exponentialRampToValueAtTime(330, now + 0.6);

      osc2.frequency.setValueAtTime(222, now);
      osc2.frequency.exponentialRampToValueAtTime(444, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(332, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch {}
  }
}

export const alertAudioEngine = new AlertAudioEngine();

export interface CustomPriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: number;
  triggered: boolean;
  notes?: string;
}

export function loadStoredAlerts(): CustomPriceAlert[] {
  try {
    const raw = localStorage.getItem('shark_price_alerts_v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredAlerts(alerts: CustomPriceAlert[]) {
  try {
    localStorage.setItem('shark_price_alerts_v1', JSON.stringify(alerts));
  } catch {}
}
