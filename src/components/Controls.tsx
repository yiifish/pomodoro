// 控制按钮栏 / Control bar
//
// 包含：开始/暂停、重置、跳过按钮 + 番茄计数器 + 设置入口
// Contains: Start/Pause, Reset, Skip buttons + Pomodoro counter + Settings entry

import { useStore } from '../stores/useStore';

export default function Controls() {
  const timer = useStore((s) => s.timer);
  const toggleSettings = useStore((s) => s.toggleSettings);

  const isRunning = timer.running && !timer.paused;
  const isPaused = timer.paused;
  const isIdle = timer.phase === 'Idle';

  return (
    <div className="footer">
      {/* 左侧：主操作按钮 / Left: primary action buttons */}
      <div className="control-left">
        {isRunning ? (
          // 运行中 → 显示暂停 / Running → show Pause
          <button className="btn btn-primary" onClick={() => useStore.getState().pauseTimer()}>
            暂停
          </button>
        ) : (
          // 待机/暂停 → 显示开始/继续 / Idle/Paused → show Start/Resume
          <button
            className="btn btn-primary"
            onClick={() => useStore.getState().startTimer()}
          >
            {isIdle ? '开始' : '继续'}
          </button>
        )}

        {/* 非待机时显示重置和跳过 / Show Reset & Skip only when not idle */}
        {!isIdle && (
          <>
            <button className="btn btn-sm" onClick={() => useStore.getState().resetTimer()}>
              重置
            </button>
            <button className="btn btn-sm" onClick={() => useStore.getState().skipTimer()}>
              跳过
            </button>
          </>
        )}
      </div>

      {/* 右侧：番茄计数 + 设置入口 / Right: pomodoro count + settings */}
      <div className="control-right">
        <span className="pomo-count">
          🍅 {timer.completed_pomodoros}
        </span>

        <button
          className="btn btn-icon"
          onClick={toggleSettings}
          title="设置 / Settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
