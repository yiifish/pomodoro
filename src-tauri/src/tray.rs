use crate::timer::TimerPhase;
use image::{Rgba, RgbaImage};
use std::io::Cursor;
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Runtime};

/// 根据状态获取颜色
fn phase_color(phase: TimerPhase) -> [u8; 4] {
    match phase {
        TimerPhase::Idle => [245, 158, 11, 255],      // #F59E0B 琥珀
        TimerPhase::Working => [239, 68, 68, 255],     // #EF4444 红
        TimerPhase::ShortBreak | TimerPhase::LongBreak => [16, 185, 129, 255], // #10B981 绿
    }
}

/// 生成包含剩余分钟数的托盘图标（PNG 数据）
fn generate_tray_icon(_minutes: u32, phase: TimerPhase) -> Result<Image<'static>, Box<dyn std::error::Error>> {
    let size: u32 = 32;
    let scale: u32 = 2;
    let img_size = size * scale;
    let mut img = RgbaImage::new(img_size, img_size);

    let color = phase_color(phase);
    let center = (img_size as f32 / 2.0) as i32;
    let radius = (img_size as f32 / 2.0 * 0.85) as i32;

    // 绘制圆形背景
    for y in 0..img_size {
        for x in 0..img_size {
            let dx = x as i32 - center;
            let dy = y as i32 - center;
            let dist = ((dx * dx + dy * dy) as f32).sqrt();

            if dist <= radius as f32 + 1.0 {
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

    // 缩小到 32x32 并输出为 PNG
    let img_rgba = image::DynamicImage::ImageRgba8(img);
    let resized =
        image::imageops::resize(&img_rgba, size, size, image::imageops::FilterType::Lanczos3);

    let mut png_bytes = Vec::new();
    resized.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)?;

    // Tauri v2 中 Image::from_bytes 从 PNG 数据创建
    let icon = Image::from_bytes(&png_bytes)?;
    Ok(icon)
}

/// 初始化系统托盘
pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder};

    // 创建右键菜单
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

    // 生成初始图标
    let initial_icon = generate_tray_icon(25, TimerPhase::Idle)?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(initial_icon)
        .tooltip("番茄钟 — 待机")
        .menu(&menu)
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

/// 更新托盘图标
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
