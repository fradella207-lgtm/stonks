/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';

// Global tracker for net monthly balance before recalculation or month switch
let previousNetState: number | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Ascending major victory)

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.45);
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
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.6);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  } catch (err) {
    console.warn('Not Stonks synth error:', err);
  }
}

/**
 * Evaluates whether the Stonks or Not Stonks effect should trigger.
 * - If transitioning from <= 0 to > 0: STONKS (positive)
 * - If transitioning from >= 0 to < 0: NOT STONKS (negative)
 *
 * @param currentNet - The newly calculated net monthly balance (income - expense)
 * @param isInitialMount - If true, initializes baseline without triggering
 */
export function triggerStonksIfPositive(currentNet: number, isInitialMount: boolean = false): void {
  if (isInitialMount || previousNetState === null) {
    previousNetState = currentNet;
    return;
  }

  // Case 1: Transition into positive (Net > 0 from <= 0) -> STONKS Chime & Confetti
  if (previousNetState <= 0 && currentNet > 0) {
    playStonksAudio();
    launchStonksConfetti();
  }
  // Case 2: Transition into negative (Net < 0 from >= 0) -> Decline sound
  else if (previousNetState >= 0 && currentNet < 0) {
    playNotStonksAudio();
  }

  previousNetState = currentNet;
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
    const confettiFunc = (window as any).confetti || confetti;
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
 * Displays feedback modal if present (safe no-op if omitted for minimal UI)
 */
export function showMemeModal(_type: 'stonks' | 'not-stonks'): void {
  // Meme overlay modal removed in favor of clean Nothing OS minimalism and splash screen
}

/**
 * Explicitly triggers celebration or alert when adding an income or expense
 */
export function triggerTransactionEffect(type: 'income' | 'expense'): void {
  if (type === 'income') {
    playStonksAudio();
    launchStonksConfetti();
  } else {
    playNotStonksAudio();
  }
}

/**
 * Resets or sets previousNetState explicitly (e.g. on month switch)
 */
export function setPreviousNetState(net: number | null): void {
  previousNetState = net;
}
