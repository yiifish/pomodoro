use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// 应用设置（所有时长单位为秒）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub work_duration: u32,
    pub break_duration: u32,
    pub long_break_duration: u32,
    pub cycles_before_long_break: u32,
    pub always_on_top: bool,
    pub sound_enabled: bool,
    pub notification_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            work_duration: 25 * 60,             // 25 分钟
            break_duration: 5 * 60,             // 5 分钟
            long_break_duration: 15 * 60,       // 15 分钟
            cycles_before_long_break: 4,
            always_on_top: true,
            sound_enabled: true,
            notification_enabled: true,
        }
    }
}

/// 统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stats {
    pub total_pomodoros: u32,
    pub today_pomodoros: u32,
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

/// 配置管理器
pub struct ConfigManager {
    settings_path: PathBuf,
    stats_path: PathBuf,
    pub settings: Settings,
    pub stats: Stats,
}

impl ConfigManager {
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

    fn load_or_default<T: serde::de::DeserializeOwned>(
        path: &PathBuf,
        default: fn() -> T,
    ) -> T {
        fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_else(default)
    }

    pub fn save_settings(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.settings).map_err(|e| e.to_string())?;
        fs::write(&self.settings_path, json).map_err(|e| e.to_string())
    }

    pub fn save_stats(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.stats).map_err(|e| e.to_string())?;
        fs::write(&self.stats_path, json).map_err(|e| e.to_string())
    }

    pub fn record_pomodoro(&mut self) -> Result<(), String> {
        self.stats.total_pomodoros += 1;
        self.stats.today_pomodoros += 1;

        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        *self.stats.daily_records.entry(today).or_insert(0) += 1;

        self.save_stats()
    }
}
