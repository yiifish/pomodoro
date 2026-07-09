//! 计时器状态模块 / Timer state module
//!
//! 定义计时器的核心状态机：待机 → 专注 → 休息 → 待机
//! Defines the core timer state machine: Idle → Working → Break → Idle

use serde::{Deserialize, Serialize};

/// 计时器阶段 / Timer phase
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerPhase {
    /// 待机 / Standby
    Idle,
    /// 专注中 / Focusing
    Working,
    /// 短休息 / Short break
    ShortBreak,
    /// 长休息 / Long break (每 4 个番茄后触发 / after every 4 pomodoros)
    LongBreak,
}

/// 计时器完整状态 / Full timer state
/// 通过 Tauri IPC 同步到前端 / Synced to frontend via Tauri IPC events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    /// 当前阶段 / Current phase
    pub phase: TimerPhase,
    /// 剩余秒数 / Remaining seconds
    pub remaining_seconds: u32,
    /// 当前阶段总秒数（用于进度环计算）/ Total seconds of current phase (for progress ring)
    pub total_seconds: u32,
    /// 是否正在运行 / Whether the timer is running
    pub running: bool,
    /// 是否已暂停 / Whether the timer is paused
    pub paused: bool,
    /// 已完成的番茄总数 / Total completed pomodoros
    pub completed_pomodoros: u32,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            phase: TimerPhase::Idle,
            remaining_seconds: 0,
            total_seconds: 25 * 60,          // 默认 25 分钟
            running: false,
            paused: false,
            completed_pomodoros: 0,
        }
    }
}
