import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import ProgressRing from './components/ProgressRing';
import Controls from './components/Controls';
import Settings from './components/Settings';
import { initEventListeners } from './stores/useStore';

function App() {
  useEffect(() => {
    initEventListeners();
  }, []);

  return (
    <div className="app-container">
      {/* 全局拖拽区域（覆盖整个窗口，按钮通过 no-drag 排除） */}
      <div className="drag-region" />

      {/* 毛玻璃背景 */}
      <div className="glass-bg" />

      {/* 主内容 */}
      <div className="content">
        {/* 顶部栏：隐藏按钮 */}
        <div className="top-bar">
          <button
            className="btn-hide"
            onClick={() => getCurrentWindow().hide()}
            title="隐藏到托盘"
          >
            —
          </button>
        </div>

        <ProgressRing />
        <Controls />
      </div>

      {/* 设置面板 */}
      <Settings />
    </div>
  );
}

export default App;
