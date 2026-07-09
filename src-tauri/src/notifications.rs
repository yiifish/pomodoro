use tauri::AppHandle;
use tauri::Emitter;
use tauri::Runtime;
use tauri_plugin_notification::{NotificationExt, PermissionState};

/// 发送 Windows 原生通知
pub fn send_notification<R: Runtime>(app: &AppHandle<R>, title: &str, body: &str) {
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

/// 触发前端播放提示音（通过 Web Audio API，不弹窗）
pub fn play_sound<R: Runtime>(app: &AppHandle<R>) {
    let _ = app.emit("play-sound", ());
}
