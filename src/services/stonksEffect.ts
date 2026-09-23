/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';

export interface StonksEventData {
  type: 'stonks' | 'not-stonks';
  amount?: number;
  description?: string;
}

type StonksEventListener = (event: StonksEventData) => void;
const listeners = new Set<StonksEventListener>();

export function onStonksTriggered(listener: StonksEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Global tracker for net monthly balance before recalculation or month switch
let previousNetState: number | null = null;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/**
 * Synthesizes a classic financial Stonks triumph chime via Web Audio API.
 * High-pitched ascending major arpeggio + bell overtone.
 */
function synthesizeStonksChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);

      gain.gain.setValueAtTime(0.001, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.3, now + index * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.5);
    });
  } catch (err) {
    console.warn('Stonks chime synth error:', err);
  }
}

/**
 * Synthesizes a classic 'Not Stonks' sad descending bearish sound via Web Audio API.
 */
function synthesizeNotStonksDecline(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Pitch falls down in disappointment
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.65);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  } catch (err) {
    console.warn('Not Stonks synth error:', err);
  }
}

/**
 * Plays the victory financial sound capturing any browser autoplay restrictions
 */
export function playStonksAudio(): void {
  try {
    const audioElement = document.getElementById('stonksAudio') as HTMLAudioElement | null;
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement
        .play()
        .catch(() => {
          synthesizeStonksChime();
        });
    } else {
      synthesizeStonksChime();
    }
  } catch {
    synthesizeStonksChime();
  }
}

/**
 * Plays the decline / sad financial sound for Not Stonks
 */
export function playNotStonksAudio(): void {
  try {
    const audioElement = document.getElementById('notStonksAudio') as HTMLAudioElement | null;
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement
        .play()
        .catch(() => {
          synthesizeNotStonksDecline();
        });
    } else {
      synthesizeNotStonksDecline();
    }
  } catch {
    synthesizeNotStonksDecline();
  }
}

/**
 * Launches green/cyan celebration confetti
 */
export function launchStonksConfetti(): void {
  try {
    const confettiFunc = (window as unknown as { confetti?: typeof confetti }).confetti || confetti;
    if (typeof confettiFunc === 'function') {
      confettiFunc({
        particleCount: 90,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b'],
      });
    }
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

/**
 * Displays meme modal and plays audio + animation
 */
export function showMemeModal(type: 'stonks' | 'not-stonks', amount?: number, description?: string): void {
  if (type === 'stonks') {
    playStonksAudio();
    launchStonksConfetti();
  } else {
    playNotStonksAudio();
  }

  listeners.forEach((cb) => {
    try {
      cb({ type, amount, description });
    } catch (e) {
      console.warn('Stonks listener error:', e);
    }
  });
}

/**
 * Explicitly triggers celebration or alert when adding an income or expense
 */
export function triggerTransactionEffect(type: 'income' | 'expense', amount?: number, description?: string): void {
  showMemeModal(type === 'income' ? 'stonks' : 'not-stonks', amount, description);
}

/**
 * Evaluates whether the Stonks or Not Stonks effect should trigger based on balance change.
 */
export function triggerStonksIfPositive(currentNet: number, isInitialMount: boolean = false): void {
  if (isInitialMount || previousNetState === null) {
    previousNetState = currentNet;
    return;
  }

  // Case 1: Transition into positive (Net > 0 from <= 0) -> STONKS Chime & Confetti
  if (previousNetState <= 0 && currentNet > 0) {
    showMemeModal('stonks');
  }
  // Case 2: Transition into negative (Net < 0 from >= 0) -> Decline sound
  else if (previousNetState >= 0 && currentNet < 0) {
    showMemeModal('not-stonks');
  }

  previousNetState = currentNet;
}

/**
 * Resets or sets previousNetState explicitly (e.g. on month switch)
 */
export function setPreviousNetState(net: number | null): void {
  previousNetState = net;
}
