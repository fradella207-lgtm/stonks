/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSyncState } from '../types.ts';
import { getStoredQueue } from './storage.ts';

type SyncListener = (state: AppSyncState, pendingCount: number) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private syncState: AppSyncState = 'synced';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState('synced');
      });
      window.addEventListener('offline', () => {
        this.updateState('offline');
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.syncState, getStoredQueue().length);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const queue = getStoredQueue();
    for (const listener of this.listeners) {
      listener(this.syncState, queue.length);
    }
  }

  public updateState(newState: AppSyncState) {
    this.syncState = newState;
    this.notify();
  }

  public getState(): { state: AppSyncState; pendingCount: number } {
    return {
      state: this.syncState,
      pendingCount: getStoredQueue().length,
    };
  }

  public checkNetworkAndSync() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState('offline');
      return;
    }
    this.updateState('synced');
  }
}

export const syncManager = new SyncManager();
