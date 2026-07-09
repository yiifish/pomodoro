// 控制按钮栏 / Control bar

import { useStore } from '../stores/useStore';

export default function Controls() {
  const timer = useStore((s) => s.timer);
  const toggleSettings = useStore((s) => s.toggleSettings);

  const isRunning = timer.running && !timer.paused;
  const isIdle = timer.phase === 'Idle';

  return (
    <div className="footer">
      {/* 左侧：主操作 */}
      <div className="control-left">
        {isRunning ? (
          <button className="btn btn-primary" onClick={() => useStore.getState().pauseTimer()}>
            暂停
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => useStore.getState().startTimer()}>
            {isIdle ? '开始' : '继续'}
          </button>
        )}

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

      {/* 右侧：番茄计数 + 设置 */}
      <div className="control-right">
        <span className="pomo-count">
          🍅 {timer.completed_pomodoros}
        </span>

        <button
          className="btn btn-icon"
          onClick={toggleSettings}
          title="设置"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
