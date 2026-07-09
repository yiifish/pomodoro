//! 系统托盘模块 / System tray module
//!
//! 功能：
//! - 动态生成托盘图标（圆形、颜色随状态变化）
//! - 左键单击显隐窗口
//! - 右键弹出菜单（显示/隐藏、暂停/继续、重置、退出）
//!
//! Features:
//! - Dynamic tray icon (colored circle based on timer phase)
//! - Left-click toggles window visibility
//! - Right-click context menu (Show/Hide, Pause/Resume, Reset, Quit)

use crate::timer::TimerPhase;
use image::{Rgba, RgbaImage};
use std::io::Cursor;
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Runtime};

/// 根据计时状态返回图标颜色 / Returns icon color based on timer phase
fn phase_color(phase: TimerPhase) -> [u8; 4] {
    match phase {
        TimerPhase::Idle => [245, 158, 11, 255],      // #F59E0B 琥珀 / Amber
        TimerPhase::Working => [239, 68, 68, 255],     // #EF4444 红 / Red
        TimerPhase::ShortBreak | TimerPhase::LongBreak => [16, 185, 129, 255], // #10B981 绿 / Green
    }
}

/// 生成托盘图标：带颜色的圆形 PNG
/// Generates a tray icon: colored circle as PNG
fn generate_tray_icon(
    _minutes: u32,
    phase: TimerPhase,
) -> Result<Image<'static>, Box<dyn std::error::Error>> {
    let size: u32 = 32;
    let scale: u32 = 2;          // 高分屏支持 / HiDPI support
    let img_size = size * scale;
    let mut img = RgbaImage::new(img_size, img_size);

    let color = phase_color(phase);
    let center = (img_size as f32 / 2.0) as i32;
    let radius = (img_size as f32 / 2.0 * 0.85) as i32;

    // 逐像素绘制圆形 / Draw circle pixel by pixel
    for y in 0..img_size {
        for x in 0..img_size {
            let dx = x as i32 - center;
            let dy = y as i32 - center;
            let dist = ((dx * dx + dy * dy) as f32).sqrt();

            if dist <= radius as f32 + 1.0 {
                // 边缘抗锯齿 / Edge anti-aliasing
                let alpha = if dist > radius as f32 - 1.0 {
                    ((radius as f32 + 1.0 - dist) * 255.0) as u8
                } else {
                    255
                };
                img.put_pixel(x, y, Rgba([color[0], color[1], color[2], alpha]));
            } else {
                img.put_pixel(x, y, Rgba([0, 0, 0, 0]));
            }
        }
    }

    // 缩小到 32×32 以获得更清晰的图标 / Resize to 32×32 for sharper icon
    let img_rgba = image::DynamicImage::ImageRgba8(img);
    let resized = image::imageops::resize(
        &img_rgba,
        size,
        size,
        image::imageops::FilterType::Lanczos3,
    );

    // 编码为 PNG / Encode as PNG
    let mut png_bytes = Vec::new();
    resized.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)?;

    let icon = Image::from_bytes(&png_bytes)?;
    Ok(icon)
}

/// 初始化系统托盘 / Initializes the system tray
pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder};

    // 构建右键菜单 / Build right-click context menu
    let show = MenuItemBuilder::with_id("show", "显示/隐藏").build(app)?;
    let pause = MenuItemBuilder::with_id("pause", "暂停/继续").build(app)?;
    let reset = MenuItemBuilder::with_id("reset", "重置").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show)
        .item(&pause)
        .item(&reset)
        .separator()
        .item(&quit)
        .build()?;

    let initial_icon = generate_tray_icon(25, TimerPhase::Idle)?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(initial_icon)
        .tooltip("番茄钟 — 待机")
        .menu(&menu)
        // 处理右键菜单点击 / Handle right-click menu events
        .on_menu_event(move |app, event| {
            let id = event.id().as_ref();
            match id {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "pause" => {
                    let _ = app.emit("tray-pause", ());
                }
                "reset" => {
                    let _ = app.emit("tray-reset", ());
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        // 处理左键单击：显隐窗口 / Handle left-click: toggle window
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// 更新托盘图标（倒计时每分钟调用一次）
/// Updates tray icon (called every minute during countdown)
pub fn update_tray_icon<R: Runtime>(
    app: &AppHandle<R>,
    minutes: u32,
    phase: TimerPhase,
    tooltip: &str,
) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        if let Ok(icon) = generate_tray_icon(minutes, phase) {
            let _ = tray.set_icon(Some(icon));
            let _ = tray.set_tooltip(Some(tooltip));
        }
    }
}
