use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// 计时器状态
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerPhase {
    /// 待机
    Idle,
    /// 专注中
    Working,
    /// 短休息
    ShortBreak,
    /// 长休息
    LongBreak,
}

/// 计时器完整状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub phase: TimerPhase,
    /// 剩余秒数
    pub remaining_seconds: u32,
    /// 总秒数（用于进度计算）
    pub total_seconds: u32,
    /// 是否正在运行
    pub running: bool,
    /// 是否暂停
    pub paused: bool,
    /// 当前周期已完成番茄数
    pub completed_pomodoros: u32,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            phase: TimerPhase::Idle,
            remaining_seconds: 25 * 60,
            total_seconds: 25 * 60,
            running: false,
            paused: false,
            completed_pomodoros: 0,
        }
    }
}

#[allow(dead_code)]
pub type SharedTimerState = Mutex<TimerState>;
