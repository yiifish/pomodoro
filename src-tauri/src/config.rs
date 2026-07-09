//! 配置与统计持久化模块 / Configuration & statistics persistence
//!
//! 负责读写 settings.json 和 stats.json，数据存储在 Tauri app_data_dir
//! Handles reading/writing settings.json and stats.json in Tauri app_data_dir

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// 应用设置 / Application settings
/// 所有时长字段单位为秒 / All duration fields are in seconds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub work_duration: u32,
    pub break_duration: u32,
    pub long_break_duration: u32,
    /// 触发长休息的番茄周期数 / Number of pomodoros before triggering long break
    pub cycles_before_long_break: u32,
    pub always_on_top: bool,
    pub sound_enabled: bool,
    pub notification_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            work_duration: 25 * 60,             // 1500 秒 = 25 分钟
            break_duration: 5 * 60,             // 300 秒 = 5 分钟
            long_break_duration: 15 * 60,       // 900 秒 = 15 分钟
            cycles_before_long_break: 4,
            always_on_top: true,
            sound_enabled: true,
            notification_enabled: true,
        }
    }
}

/// 统计数据 / Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stats {
    /// 历史番茄总数 / Total pomodoros completed
    pub total_pomodoros: u32,
    /// 今日番茄数 / Today's pomodoros (based on local date)
    pub today_pomodoros: u32,
    /// 每日记录 / Daily records: "YYYY-MM-DD" → count
    pub daily_records: HashMap<String, u32>,
}

impl Default for Stats {
    fn default() -> Self {
        Self {
            total_pomodoros: 0,
            today_pomodoros: 0,
            daily_records: HashMap::new(),
        }
    }
}

/// 配置管理器 / Configuration manager
/// 持有运行时设置和统计数据的读写句柄
/// Holds runtime handles for reading and writing settings & stats
pub struct ConfigManager {
    settings_path: PathBuf,
    stats_path: PathBuf,
    pub settings: Settings,
    pub stats: Stats,
}

impl ConfigManager {
    /// 新建管理器，自动从文件加载或创建默认值
    /// Creates a new manager, auto-loading from files or defaulting
    pub fn new(app_dir: PathBuf) -> Self {
        let settings_path = app_dir.join("settings.json");
        let stats_path = app_dir.join("stats.json");

        let settings = Self::load_or_default(&settings_path, Settings::default);
        let stats = Self::load_or_default(&stats_path, Stats::default);

        Self {
            settings_path,
            stats_path,
            settings,
            stats,
        }
    }

    /// 从 JSON 文件加载，文件不存在或损坏则返回默认值
    /// Loads from JSON file, falls back to default on missing/corrupt file
    fn load_or_default<T: serde::de::DeserializeOwned>(
        path: &PathBuf,
        default: fn() -> T,
    ) -> T {
        fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_else(default)
    }

    /// 持久化设置到磁盘 / Persists settings to disk
    pub fn save_settings(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.settings).map_err(|e| e.to_string())?;
        fs::write(&self.settings_path, json).map_err(|e| e.to_string())
    }

    /// 持久化统计到磁盘 / Persists stats to disk
    pub fn save_stats(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.stats).map_err(|e| e.to_string())?;
        fs::write(&self.stats_path, json).map_err(|e| e.to_string())
    }

    /// 记录一个完成的番茄，自动更新 total + today + dailyRecords
    /// Records a completed pomodoro, auto-updating total, today, and daily records
    pub fn record_pomodoro(&mut self) -> Result<(), String> {
        self.stats.total_pomodoros += 1;
        self.stats.today_pomodoros += 1;

        // 使用本地日期作为 key / Use local date as key
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        *self.stats.daily_records.entry(today).or_insert(0) += 1;

        self.save_stats()
    }
}
