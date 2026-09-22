/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';

// Global tracker for net monthly balance before recalculation or month switch
let previousNetState: number | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Evaluates whether the Stonks victory effect should trigger.
 * Condition: previousNetState <= 0 AND newNet > 0.
 *
 * @param currentNet - The newly calculated net monthly balance (income - expense)
 * @param isInitialMount - If true, initializes previousNetState without triggering
 */
export function triggerStonksIfPositive(currentNet: number, isInitialMount: boolean = false): void {
  // If first run, initialize previousNetState baseline
  if (isInitialMount || previousNetState === null) {
    previousNetState = currentNet;
    return;
  }

  // Trigger ONLY if previous was <= 0 AND new net is strictly positive (> 0)
  if (previousNetState <= 0 && currentNet > 0) {
    playStonksAudio();
    launchStonksConfetti();
    showStonksModal();
  }

  // Always update previousNetState with the latest net value
  previousNetState = currentNet;
}

/**
 * Plays the victory sound capturing any browser autoplay exceptions
 */
export function playStonksAudio(): void {
  try {
    const audioElement = document.getElementById('stonksAudio') as HTMLAudioElement | null;
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch((err) => {
        console.log('Audio autoplay prevented by browser policy:', err);
      });
    } else {
      const fallbackAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      fallbackAudio.play().catch(() => {});
    }
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Launches green/cyan confetti celebration
 */
export function launchStonksConfetti(): void {
  try {
    const confettiFunc = (window as any).confetti || confetti;
    if (typeof confettiFunc === 'function') {
      confettiFunc({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#14b8a6', '#06b6d4'],
      });
    }
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

/**
 * Displays the Stonks meme modal overlay and auto-hides after 2.5 seconds
 */
export function showStonksModal(): void {
  const modal = document.getElementById('stonksModal');
  if (!modal) return;

  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  dismissTimer = setTimeout(() => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }, 2500);
}

/**
 * Resets or sets previousNetState explicitly (e.g. on month switch)
 */
export function setPreviousNetState(net: number | null): void {
  previousNetState = net;
}
