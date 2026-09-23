// Utilities for Browser Notifications and Web Audio Alerts

export type NotificationPermState = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermState;
}

export async function requestNotificationPermission(): Promise<NotificationPermState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm as NotificationPermState;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Synthesizes a pleasant multi-tone alert chime using Web Audio API
 * No external mp3 or network assets required.
 */
export function playAlertChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);

    // Third high harmonic tone (D6 - 1174.66 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1174.66, now + 0.24);
    gain3.gain.setValueAtTime(0.25, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.85);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

/**
 * Dispatches a native browser notification if permission is granted
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  playAlertChime();

  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Failed to send browser notification:', err);
    return null;
  }
}
