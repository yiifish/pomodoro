import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ─── Types ────────────────────────────────────────────────────────

export type TimerPhase = 'Idle' | 'Working' | 'ShortBreak' | 'LongBreak';

export interface TimerState {
  phase: TimerPhase;
  remaining_seconds: number;
  total_seconds: number;
  running: boolean;
  paused: boolean;
  completed_pomodoros: number;
}

export interface Settings {
  work_duration: number;       // 秒
  break_duration: number;      // 秒
  long_break_duration: number; // 秒
  cycles_before_long_break: number;
  always_on_top: boolean;
  sound_enabled: boolean;
  notification_enabled: boolean;
}

export interface Stats {
  total_pomodoros: number;
  today_pomodoros: number;
  daily_records: Record<string, number>;
}

// ─── Web Audio Beep ───────────────────────────────────────────────

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // 静默忽略
  }
}

// ─── Store ─────────────────────────────────────────────────────────

interface AppStore {
  timer: TimerState;
  settings: Settings;
  stats: Stats;
  showSettings: boolean;

  fetchTimerState: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  skipTimer: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  toggleSettings: () => void;
  handleTick: (state: TimerState) => void;
  handlePhaseEnd: (state: TimerState) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  timer: {
    phase: 'Idle',
    remaining_seconds: 0,
    total_seconds: 25 * 60,
    running: false,
    paused: false,
    completed_pomodoros: 0,
  },
  settings: {
    work_duration: 25 * 60,       // 1500 秒
    break_duration: 5 * 60,       // 300 秒
    long_break_duration: 15 * 60, // 900 秒
    cycles_before_long_break: 4,
    always_on_top: true,
    sound_enabled: true,
    notification_enabled: true,
  },
  stats: {
    total_pomodoros: 0,
    today_pomodoros: 0,
    daily_records: {},
  },
  showSettings: false,

  fetchTimerState: async () => {
    try {
      const state = await invoke<TimerState>('get_timer_state');
      set({ timer: state });
    } catch (e) {
      console.error('fetchTimerState:', e);
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await invoke<Settings>('get_settings');
      set({ settings });
    } catch (e) {
      console.error('fetchSettings:', e);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await invoke<Stats>('get_stats');
      set({ stats });
    } catch (e) {
      console.error('fetchStats:', e);
    }
  },

  startTimer: async () => {
    try {
      await invoke('start_timer');
    } catch (e) {
      console.error('startTimer:', e);
    }
  },

  pauseTimer: async () => {
    try {
      await invoke('pause_timer');
      set({ timer: { ...get().timer, running: false, paused: true } });
    } catch (e) {
      console.error('pauseTimer:', e);
    }
  },

  resetTimer: async () => {
    try {
      await invoke('reset_timer');
    } catch (e) {
      console.error('resetTimer:', e);
    }
  },

  skipTimer: async () => {
    try {
      await invoke('skip_timer');
    } catch (e) {
      console.error('skipTimer:', e);
    }
  },

  updateSettings: async (partial: Partial<Settings>) => {
    const newSettings = { ...get().settings, ...partial };
    try {
      await invoke('update_settings', { settings: newSettings });
      set({ settings: newSettings });
    } catch (e) {
      console.error('updateSettings:', e);
    }
  },

  toggleSettings: () => set({ showSettings: !get().showSettings }),

  handleTick: (state: TimerState) => {
    set({ timer: state });
  },

  handlePhaseEnd: async (state: TimerState) => {
    set({ timer: state });
    await get().fetchStats();
  },
}));

// ─── Event Listeners ───────────────────────────────────────────────

export async function initEventListeners() {
  await listen<TimerState>('timer-tick', (event) => {
    useStore.getState().handleTick(event.payload);
  });

  await listen<TimerState>('timer-phase-end', (event) => {
    useStore.getState().handlePhaseEnd(event.payload);
  });

  // 前端播放提示音
  await listen('play-sound', () => {
    const s = useStore.getState().settings;
    if (s.sound_enabled) {
      playBeep();
    }
  });

  await listen('tray-pause', () => {
    const store = useStore.getState();
    if (store.timer.running) {
      store.pauseTimer();
    } else {
      store.startTimer();
    }
  });

  await listen('tray-reset', () => {
    useStore.getState().resetTimer();
  });

  const store = useStore.getState();
  await store.fetchTimerState();
  await store.fetchSettings();
  await store.fetchStats();
}
