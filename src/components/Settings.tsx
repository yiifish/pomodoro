// 设置面板 / Settings panel
//
// 支持的功能 / Supported settings:
// - 专注时长、短休息、长休息（分:秒双输入）
// - 长休息触发间隔（番茄个数）
// - 始终置顶 / 提示音 / 桌面通知（开关）

import { useStore } from '../stores/useStore';

// ─── 时间输入子组件（分 + 秒）/ Time Input Sub-component ─────────

/**
 * 将总秒数拆分为分钟和秒两个输入框
 * Splits total seconds into separate minutes and seconds inputs
 */
function TimeInput({ label, totalSeconds, onChange }: {
  label: string;
  totalSeconds: number;
  onChange: (seconds: number) => void;
}) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          className="settings-input"
          style={{ width: 40 }}
          type="number"
          min={0}
          max={120}
          value={mins}
          onChange={(e) => {
            const m = Math.max(0, Number(e.target.value));
            onChange(m * 60 + secs);
          }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>分</span>
        <input
          className="settings-input"
          style={{ width: 40 }}
          type="number"
          min={0}
          max={59}
          value={secs}
          onChange={(e) => {
            const s = Math.min(59, Math.max(0, Number(e.target.value)));
            onChange(mins * 60 + s);
          }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>秒</span>
      </div>
    </div>
  );
}

// ─── 设置面板主组件 / Settings Panel ─────────────────────────────

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const showSettings = useStore((s) => s.showSettings);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const updateSettings = useStore((s) => s.updateSettings);

  // 不可见时不渲染 / Don't render when not visible
  if (!showSettings) return null;

  return (
    <div className="settings-overlay">
      {/* 标题栏 + 返回按钮 / Title bar + back button */}
      <div className="settings-top-bar">
        <span className="settings-title">⚙ 设置</span>
        <button className="btn-back" onClick={toggleSettings} title="返回">
          ✕
        </button>
      </div>

      <TimeInput
        label="专注时长"
        totalSeconds={settings.work_duration}
        onChange={(v) => updateSettings({ work_duration: v })}
      />

      <TimeInput
        label="短休息"
        totalSeconds={settings.break_duration}
        onChange={(v) => updateSettings({ break_duration: v })}
      />

      <TimeInput
        label="长休息"
        totalSeconds={settings.long_break_duration}
        onChange={(v) => updateSettings({ long_break_duration: v })}
      />

      <div className="settings-row">
        <span className="settings-label">长休息间隔（个）</span>
        <input
          className="settings-input"
          type="number"
          min={1}
          max={10}
          value={settings.cycles_before_long_break}
          onChange={(e) =>
            updateSettings({
              cycles_before_long_break: Math.max(1, Number(e.target.value)),
            })
          }
        />
      </div>

      {/* 始终置顶 / Always on top */}
      <div className="settings-row">
        <span className="settings-label">始终置顶</span>
        <button
          className={`settings-toggle ${settings.always_on_top ? 'on' : ''}`}
          onClick={() => updateSettings({ always_on_top: !settings.always_on_top })}
        />
      </div>

      {/* 提示音 / Sound */}
      <div className="settings-row">
        <span className="settings-label">提示音</span>
        <button
          className={`settings-toggle ${settings.sound_enabled ? 'on' : ''}`}
          onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
        />
      </div>

      {/* 桌面通知 / Desktop notifications */}
      <div className="settings-row">
        <span className="settings-label">桌面通知</span>
        <button
          className={`settings-toggle ${settings.notification_enabled ? 'on' : ''}`}
          onClick={() =>
            updateSettings({ notification_enabled: !settings.notification_enabled })
          }
        />
      </div>
    </div>
  );
}
