// 状态管理 + Tauri IPC 桥接 / State management + Tauri IPC bridge
//
// 使用 Zustand 管理全部前端状态，通过 Tauri invoke 调用 Rust 后端命令，
// 通过 listen 监听后端推送的事件（timer-tick, timer-phase-end, play-sound 等）

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ─── 类型定义 / Types ─────────────────────────────────────────────

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
  work_duration: number;        // 秒 / seconds
  break_duration: number;       // 秒 / seconds
  long_break_duration: number;  // 秒 / seconds
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

// ─── Web Audio 提示音 / Web Audio Beep ────────────────────────────

/**
 * 用 Web Audio API 播放简短的提示音（880Hz → 660Hz，持续 0.4 秒）
 * Plays a short beep using Web Audio API (880Hz → 660Hz, 0.4s duration)
 * 不会弹出任何窗口 / No windows are spawned
 */
function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);       // 起始音高
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12); // 降调
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4); // 渐弱

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // 浏览器不支持时静默忽略 / Silently ignore if unsupported
  }
}

// ─── Store ─────────────────────────────────────────────────────────

interface AppStore {
  timer: TimerState;
  settings: Settings;
  stats: Stats;
  showSettings: boolean;

  // 异步操作 / Async actions（调用 Rust IPC）
  fetchTimerState: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  skipTimer: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;

  // 同步操作 / Sync actions（纯客户端）
  toggleSettings: () => void;
  handleTick: (state: TimerState) => void;         // 每秒滴答
  handlePhaseEnd: (state: TimerState) => void;     // 阶段结束
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

  // ─── IPC 调用 / IPC Calls ───────────────────────

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
      // Rust 后端启动后台倒计时线程
      await invoke('start_timer');
    } catch (e) {
      console.error('startTimer:', e);
    }
  },

  pauseTimer: async () => {
    try {
      await invoke('pause_timer');
      // 乐观更新 UI / Optimistic UI update
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

  // ─── 纯客户端操作 / Client-only Actions ─────────

  toggleSettings: () => set({ showSettings: !get().showSettings }),

  handleTick: (state: TimerState) => {
    set({ timer: state });
  },

  handlePhaseEnd: async (state: TimerState) => {
    set({ timer: state });
    // 阶段结束后刷新统计数据
    await get().fetchStats();
  },
}));

// ─── 事件监听器初始化 / Event Listener Initialization ─────────────

/**
 * 注册所有 Tauri 事件监听器，应在应用启动时调用一次
 * Registers all Tauri event listeners; should be called once on app startup
 */
export async function initEventListeners() {
  // 每秒计时滴答 / 1-second timer tick
  await listen<TimerState>('timer-tick', (event) => {
    useStore.getState().handleTick(event.payload);
  });

  // 阶段结束（专注→休息 or 休息→待机）/ Phase ended (focus→break or break→idle)
  await listen<TimerState>('timer-phase-end', (event) => {
    useStore.getState().handlePhaseEnd(event.payload);
  });

  // 播放提示音（由 Rust 在阶段结束时触发）/ Play beep (triggered by Rust on phase end)
  await listen('play-sound', () => {
    const s = useStore.getState().settings;
    if (s.sound_enabled) {
      playBeep();
    }
  });

  // 托盘菜单：暂停/继续 / Tray menu: pause/resume
  await listen('tray-pause', () => {
    const store = useStore.getState();
    if (store.timer.running) {
      store.pauseTimer();
    } else {
      store.startTimer();
    }
  });

  // 托盘菜单：重置 / Tray menu: reset
  await listen('tray-reset', () => {
    useStore.getState().resetTimer();
  });

  // 初始加载 / Initial data load
  const store = useStore.getState();
  await store.fetchTimerState();
  await store.fetchSettings();
  await store.fetchStats();
}
