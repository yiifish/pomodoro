//! 通知与音效模块 / Notifications & sound effect module
//!
//! 桌面通知通过 tauri-plugin-notification 实现
//! 提示音由前端 Web Audio API 播放（避免弹出 CMD 窗口）
//!
//! Desktop notifications use tauri-plugin-notification.
//! Sound is played by the frontend via Web Audio API (no CMD window).

use tauri::AppHandle;
use tauri::Emitter;
use tauri::Runtime;
use tauri_plugin_notification::{NotificationExt, PermissionState};

/// 发送 Windows 原生桌面通知
/// Sends a Windows native desktop notification
pub fn send_notification<R: Runtime>(app: &AppHandle<R>, title: &str, body: &str) {
    // 检查通知权限状态 / Check notification permission state
    match app.notification().permission_state() {
        Ok(state) => {
            if state == PermissionState::Denied {
                return;
            }
        }
        Err(_) => return,
    }

    let _ = app.notification().builder().title(title).body(body).show();
}

/// 触发前端播放提示音（发送事件，由前端 Web Audio API 处理）
/// Triggers the frontend to play a beep via Web Audio API (no process spawn)
pub fn play_sound<R: Runtime>(app: &AppHandle<R>) {
    let _ = app.emit("play-sound", ());
}
