import { useStore } from '../stores/useStore';

export default function Controls() {
  const timer = useStore((s) => s.timer);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const showSettings = useStore((s) => s.showSettings);

  const isRunning = timer.running && !timer.paused;
  const isPaused = timer.paused;
  const isIdle = timer.phase === 'Idle';

  return (
    <div className="footer">
      <div className="control-left">
        {/* 开始 / 暂停 */}
        {isRunning ? (
          <button className="btn btn-primary" onClick={() => useStore.getState().pauseTimer()}>
            暂停
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => useStore.getState().startTimer()}
          >
            {isIdle ? '开始' : isPaused ? '继续' : '开始'}
          </button>
        )}

        {/* 重置 */}
        {!isIdle && (
          <button className="btn btn-sm" onClick={() => useStore.getState().resetTimer()}>
            重置
          </button>
        )}

        {/* 跳过 */}
        {!isIdle && (
          <button className="btn btn-sm" onClick={() => useStore.getState().skipTimer()}>
            跳过
          </button>
        )}
      </div>

      <div className="control-right">
        {/* 番茄计数 */}
        <span className="pomo-count">
          🍅 {timer.completed_pomodoros}
        </span>

        {/* 设置入口 */}
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
