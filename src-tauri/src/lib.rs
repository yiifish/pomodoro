//! 主模块 / Main module
//!
//! 负责：
//! - 定义 Tauri IPC 命令（start/pause/reset/skip/updateSettings）
//! - 管理全局状态（AppState：计时器 + 配置）
//! - 后台倒计时线程（每秒 tick，阶段结束自动切换）
//! - 应用入口（setup、插件注册、托盘初始化）
//!
//! Handles:
//! - Tauri IPC commands (start/pause/reset/skip/updateSettings)
//! - Global state management (AppState: timer + config)
//! - Background countdown thread (1-second ticks, auto phase switching)
//! - App entry point (setup, plugins, tray init)

mod config;
mod notifications;
mod timer;
mod tray;

use config::ConfigManager;
use notifications::{play_sound, send_notification};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use timer::{TimerPhase, TimerState};

// ─── 全局状态 / Global State ─────────────────────────────────────

/// 应用全局状态，通过 Tauri 的 State 机制共享
/// Shared across all command handlers via Tauri's State mechanism
struct AppState {
    timer: Mutex<TimerState>,
    config: Mutex<ConfigManager>,
}

// ─── 辅助函数 / Helpers ──────────────────────────────────────────

/// 根据阶段获取对应时长（秒）/ Gets duration in seconds for the given phase
fn get_duration(config: &ConfigManager, phase: TimerPhase) -> u32 {
    match phase {
        TimerPhase::Working => config.settings.work_duration,
        TimerPhase::ShortBreak => config.settings.break_duration,
        TimerPhase::LongBreak => config.settings.long_break_duration,
        TimerPhase::Idle => config.settings.work_duration,
    }
}

/// 判断当前是否应该触发长休息 / Checks if a long break should be triggered
fn should_long_break(config: &ConfigManager, completed: u32) -> bool {
    completed > 0 && completed % config.settings.cycles_before_long_break == 0
}

// ─── IPC 命令 / IPC Commands ──────────────────────────────────────

/// 获取当前计时器状态 / Returns current timer state
#[tauri::command]
fn get_timer_state(state: tauri::State<AppState>) -> TimerState {
    state.timer.lock().unwrap().clone()
}

/// 获取设置 / Returns current settings
#[tauri::command]
fn get_settings(state: tauri::State<AppState>) -> config::Settings {
    state.config.lock().unwrap().settings.clone()
}

/// 获取统计数据 / Returns current stats
#[tauri::command]
fn get_stats(state: tauri::State<AppState>) -> config::Stats {
    state.config.lock().unwrap().stats.clone()
}

/// 更新设置并持久化 / Updates settings and persists to disk
#[tauri::command]
fn update_settings(
    state: tauri::State<AppState>,
    settings: config::Settings,
) -> Result<(), String> {
    let mut config = state.config.lock().unwrap();
    config.settings = settings;
    config.save_settings()
}

/// 开始计时 / Starts the timer
///
/// 启动一个后台线程，每秒递减 remaining_seconds
/// 计时归零时自动切换阶段（专注 → 休息 → 待机）
///
/// Spawns a background thread that decrements remaining_seconds each second.
/// When the timer hits zero, auto-switches phase (Working → Break → Idle).
#[tauri::command]
fn start_timer(state: tauri::State<AppState>, app: AppHandle) {
    let mut timer = state.timer.lock().unwrap();

    // 如果已经在运行，忽略 / Ignore if already running
    if timer.running && !timer.paused {
        return;
    }

    // 非暂停状态：从配置读取时长 / Not paused: load duration from config
    if !timer.paused {
        let config = state.config.lock().unwrap();
        let phase = if timer.phase == TimerPhase::Idle {
            TimerPhase::Working
        } else {
            timer.phase
        };
        timer.phase = phase;
        timer.total_seconds = get_duration(&config, phase);
        timer.remaining_seconds = timer.total_seconds;
        timer.completed_pomodoros = config.stats.total_pomodoros;
        drop(config);
    }

    timer.running = true;
    timer.paused = false;

    let mut current = timer.clone();
    drop(timer);

    // 后台倒计时线程 / Background countdown thread
    let app_clone = app.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));

            let s = app_clone.state::<AppState>();
            let mut timer_guard = s.timer.lock().unwrap();

            // 被外部暂停/停止 / Paused/stopped externally
            if timer_guard.paused || !timer_guard.running {
                break;
            }

            // 每秒递减并通知前端 / Decrement each second and notify frontend
            if timer_guard.remaining_seconds > 0 {
                timer_guard.remaining_seconds -= 1;
                current = timer_guard.clone();
                let _ = app_clone.emit("timer-tick", current.clone());
            }

            if timer_guard.remaining_seconds == 0 {
                let phase = timer_guard.phase;
                drop(timer_guard);

                if phase == TimerPhase::Working {
                    // ─── 番茄完成 / Pomodoro completed ───
                    let mut config = s.config.lock().unwrap();
                    let _ = config.record_pomodoro();

                    send_notification(&app_clone, "🍅 番茄完成！", "专注时间结束，休息一下吧~");

                    if config.settings.sound_enabled {
                        play_sound(&app_clone);
                    }

                    let should_long = should_long_break(&config, config.stats.total_pomodoros);
                    drop(config);

                    let mut timer_guard = s.timer.lock().unwrap();
                    timer_guard.completed_pomodoros = {
                        let config = s.config.lock().unwrap();
                        config.stats.total_pomodoros
                    };
                    timer_guard.phase = if should_long {
                        TimerPhase::LongBreak
                    } else {
                        TimerPhase::ShortBreak
                    };
                    let new_total = {
                        let config = s.config.lock().unwrap();
                        get_duration(&config, timer_guard.phase)
                    };
                    timer_guard.total_seconds = new_total;
                    timer_guard.remaining_seconds = new_total;
                    timer_guard.running = true;
                    current = timer_guard.clone();
                    let _ = app_clone.emit("timer-phase-end", current.clone());
                    tray::update_tray_icon(
                        &app_clone,
                        current.remaining_seconds / 60,
                        current.phase,
                        &tooltip_text(&current),
                    );
                    continue;
                } else {
                    // ─── 休息结束 / Break ended ───
                    send_notification(&app_clone, "⏰ 休息结束", "开始新的番茄吧！");

                    if {
                        let config = s.config.lock().unwrap();
                        config.settings.sound_enabled
                    } {
                        play_sound(&app_clone);
                    }

                    let mut timer_guard = s.timer.lock().unwrap();
                    timer_guard.phase = TimerPhase::Idle;
                    timer_guard.running = false;
                    timer_guard.paused = false;
                    timer_guard.remaining_seconds = 0;
                    timer_guard.total_seconds = {
                        let config = s.config.lock().unwrap();
                        get_duration(&config, TimerPhase::Working)
                    };
                    current = timer_guard.clone();
                    let _ = app_clone.emit("timer-phase-end", current.clone());
                    tray::update_tray_icon(&app_clone, 0, TimerPhase::Idle, "番茄钟 — 待机");
                    break;
                }
            }

            // 每分钟更新托盘图标 / Update tray icon every minute
            if current.remaining_seconds > 0 && current.remaining_seconds % 60 == 0 {
                tray::update_tray_icon(
                    &app_clone,
                    current.remaining_seconds / 60,
                    current.phase,
                    &tooltip_text(&current),
                );
            }
        }
    });
}

/// 暂停计时 / Pauses the timer
#[tauri::command]
fn pause_timer(state: tauri::State<AppState>) {
    let mut timer = state.timer.lock().unwrap();
    timer.paused = true;
    timer.running = false;
}

/// 重置计时器到待机状态 / Resets timer to idle state
#[tauri::command]
fn reset_timer(state: tauri::State<AppState>, app: AppHandle) {
    let config = state.config.lock().unwrap();
    let completed = config.stats.total_pomodoros;
    let total = get_duration(&config, TimerPhase::Working);
    drop(config);

    let mut timer = state.timer.lock().unwrap();
    timer.phase = TimerPhase::Idle;
    timer.running = false;
    timer.paused = false;
    timer.remaining_seconds = 0;
    timer.total_seconds = total;
    timer.completed_pomodoros = completed;

    let current = timer.clone();
    drop(timer);

    let _ = app.emit("timer-tick", current);
    tray::update_tray_icon(&app, 0, TimerPhase::Idle, "番茄钟 — 待机");
}

/// 跳过当前阶段 / Skips the current phase
#[tauri::command]
fn skip_timer(state: tauri::State<AppState>, app: AppHandle) {
    let phase = {
        let timer = state.timer.lock().unwrap();
        timer.phase
    };

    if phase == TimerPhase::Working {
        // 跳过专注也记录一个完成的番茄 / Skipping focus also records a pomodoro
        let mut config = state.config.lock().unwrap();
        let _ = config.record_pomodoro();
        let completed = config.stats.total_pomodoros;
        drop(config);

        let mut timer = state.timer.lock().unwrap();
        timer.completed_pomodoros = completed;
        timer.remaining_seconds = 0;
        timer.running = false;
        timer.paused = false;
        let current = timer.clone();
        drop(timer);
        let _ = app.emit("timer-phase-end", current.clone());
        let _ = app.emit("timer-tick", current);
        return;
    }

    let mut timer = state.timer.lock().unwrap();
    timer.remaining_seconds = 0;
    timer.running = false;
    timer.paused = false;
    let current = timer.clone();
    drop(timer);

    let _ = app.emit("timer-phase-end", current.clone());
    let _ = app.emit("timer-tick", current);
}

/// 生成托盘 tooltip 文本 / Generates tray tooltip text
fn tooltip_text(state: &TimerState) -> String {
    let m = state.remaining_seconds / 60;
    let s = state.remaining_seconds % 60;
    let phase = match state.phase {
        TimerPhase::Working => "专注中",
        TimerPhase::ShortBreak => "短休息",
        TimerPhase::LongBreak => "长休息",
        TimerPhase::Idle => "待机",
    };
    format!("番茄钟 — {} {:02}:{:02}", phase, m, s)
}

// ─── 应用入口 / App Entry ────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 单实例插件：防止重复启动 / Prevent multiple instances
        // 第二个实例启动时会激活已有窗口而不是创建新窗口
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // 注册通知插件 / Register notification plugin
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // 获取 AppData 目录 / Get app data directory
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            std::fs::create_dir_all(&app_dir).ok();

            let config = ConfigManager::new(app_dir);
            let initial_total = config.settings.work_duration;
            let initial_completed = config.stats.total_pomodoros;

            // 向 Tauri 注册全局状态 / Register global state with Tauri
            app.manage(AppState {
                timer: Mutex::new(TimerState {
                    phase: TimerPhase::Idle,
                    remaining_seconds: 0,
                    total_seconds: initial_total,
                    running: false,
                    paused: false,
                    completed_pomodoros: initial_completed,
                }),
                config: Mutex::new(config),
            });

            // 初始化系统托盘 / Initialize system tray
            let _ = tray::setup_tray(app.handle());

            Ok(())
        })
        // 注册 IPC 命令 / Register IPC commands
        .invoke_handler(tauri::generate_handler![
            get_timer_state,
            get_settings,
            get_stats,
            update_settings,
            start_timer,
            pause_timer,
            reset_timer,
            skip_timer,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        // 退出时保存设置 / Save settings on exit
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app.try_state::<AppState>() {
                    if let Ok(config) = state.config.lock() {
                        let _ = config.save_settings();
                    }
                }
            }
        });
}
