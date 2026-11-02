/**
 * Servicio de audio sintetizado vía Web Audio API (sin archivos externos)
 * y notificaciones nativas del Service Worker para recordatorios de revisión.
 */
export function playSynthTone(
  type: 'spark' | 'advance' | 'complete',
  enabled = true
): void {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'spark') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'advance') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22); // A5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  } catch {
    // Entornos sin soporte de audio (ej. jsdom) se ignoran silenciosamente
  }
}

export async function triggerReviewNotification(
  ideaTitle: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return false;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_IDEA_REMINDER',
        payload: {
          title: 'IdeaVault — Revisión Pendiente',
          body: `Es momento de evaluar tu idea: "${ideaTitle}"`,
        },
      });
      return true;
    }

    new Notification('IdeaVault — Revisión Pendiente', {
      body: `Es momento de evaluar tu idea: "${ideaTitle}"`,
      icon: '/icon.svg',
    });
    return true;
  } catch {
    return false;
  }
}
