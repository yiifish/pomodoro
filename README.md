# 🍅 番茄钟 | Pomodoro Timer

<p align="center">
  <b>Windows 桌面番茄钟应用</b> | <i>A minimalist Windows desktop Pomodoro timer</i>
</p>

<p align="center">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react">
  <img alt="Rust" src="https://img.shields.io/badge/Rust-1.96-DEA584?logo=rust">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript">
</p>

---

## 📖 English | 中文

### ✨ Features | 功能

- 🍅 **Pomodoro Timer** — 25 min focus → 5 min short break → 15 min long break (every 4 cycles)
- 🖥️ **System Tray** — Dynamic colored icon showing remaining minutes; left-click to toggle, right-click for menu
- 🪟 **Floating Window** — 280×260 borderless glassmorphism window; draggable, always-on-top
- 🔔 **Notifications** — Windows native toast + Web Audio beep
- ⚙️ **Settings** — Custom durations (minutes + seconds), sound/notification toggles
- 💾 **Local Storage** — `settings.json` + `stats.json` (no login required)

> **功能**：番茄计时、系统托盘（彩色图标+剩余分钟数）、毛玻璃悬浮窗、桌面通知+提示音、自定义时长（分秒级）、本地持久化。

### 🏗️ Tech Stack | 技术栈

| Layer | Tech |
|-------|------|
| **Desktop Shell** | [Tauri v2](https://v2.tauri.app/) |
| **Frontend** | React 18 + TypeScript + Zustand |
| **Backend** | Rust (timer, tray, notifications, config) |
| **Styling** | Custom CSS (glassmorphism, no framework) |

### 📦 Project Structure | 项目结构

```
pomodoro-app/
├── src/                          # React 前端 (Frontend)
│   ├── components/
│   │   ├── ProgressRing.tsx      # 环形进度条 + 倒计时 Circular progress + countdown
│   │   ├── Controls.tsx          # 开始/暂停/重置/跳过 Start/Pause/Reset/Skip
│   │   └── Settings.tsx          # 设置面板 Settings panel
│   ├── stores/
│   │   └── useStore.ts           # Zustand 状态管理 State management + IPC
│   ├── index.css                 # 毛玻璃 UI 样式 Glassmorphism styles
│   ├── App.tsx                   # 主应用 Main app component
│   └── main.tsx                  # 入口 Entry point
├── src-tauri/                    # Rust 后端 (Backend)
│   └── src/
│       ├── main.rs               # 入口 Entry point
│       ├── lib.rs                # Tauri 命令 + 状态管理 Commands + state
│       ├── timer.rs              # 计时器状态机 Timer state machine
│       ├── tray.rs               # 系统托盘 Tray icon + menu
│       ├── config.rs             # 持久化配置 Config + stats persistence
│       └── notifications.rs      # 桌面通知 + 声音 Notifications + sound
├── package.json
├── vite.config.ts
└── src-tauri/tauri.conf.json     # Tauri 配置 Window + tray config
```

### 🚀 Getting Started | 开始

#### Prerequisites | 环境要求

- **Node.js** ≥ 18
- **Rust** ≥ 1.80 (MSVC or GNU toolchain)
- **Windows 10/11** with [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)

#### Development | 开发

```bash
# Install frontend dependencies | 安装前端依赖
npm install

# Start dev server | 启动开发模式
npm run tauri dev
```

#### Build | 打包

```bash
# Build portable .exe | 编译便携版 .exe
npm run tauri build -- --no-bundle

# Output | 输出
# src-tauri/target/release/pomodoro.exe (~15 MB)
```

### ⌨️ Shortcuts | 交互方式

| Action | Method |
|--------|--------|
| **Show/Hide** | 左键托盘图标 Left-click tray icon |
| **Context Menu** | 右键托盘图标 Right-click tray icon |
| **Drag Window** | 拖拽窗口任意位置 Drag anywhere on the window |
| **Hide to Tray** | 点击 `—` 按钮 Click `—` button |
| **Settings** | 点击齿轮 ⚙ Click gear icon |

### 🎨 Color Scheme | 配色

| State | Color | Hex |
|-------|-------|-----|
| Idle · 待机 | Amber · 琥珀 | `#F59E0B` |
| Working · 专注 | Red · 红 | `#EF4444` |
| Break · 休息 | Green · 绿 | `#10B981` |

### 📄 License

MIT
