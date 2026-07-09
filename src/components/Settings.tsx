// 设置面板 / Settings panel
// 支持分+秒双输入、开关控件，SVG 图标替代表情符号

import { useStore } from '../stores/useStore';

/** 关闭图标 / Close icon */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

// ─── 时间输入子组件 / Time Input ──────────────────────────────

function TimeInput({ label, totalSeconds, onChange }: {
  label: string;
  totalSeconds: number;
  onChange: (s: number) => void;
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
          type="number" min={0} max={120}
          value={mins}
          onChange={(e) => {
            const m = Math.max(0, Number(e.target.value));
            onChange(m * 60 + secs);
          }}
          aria-label={`${label}分钟`}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>分</span>
        <input
          className="settings-input"
          style={{ width: 40 }}
          type="number" min={0} max={59}
          value={secs}
          onChange={(e) => {
            const s = Math.min(59, Math.max(0, Number(e.target.value)));
            onChange(mins * 60 + s);
          }}
          aria-label={`${label}秒`}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>秒</span>
      </div>
    </div>
  );
}

// ─── 设置面板 / Settings Panel ────────────────────────────────

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const showSettings = useStore((s) => s.showSettings);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const updateSettings = useStore((s) => s.updateSettings);

  if (!showSettings) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-top-bar">
        <span className="settings-title">设置</span>
        <button className="btn-back" onClick={toggleSettings} title="返回" aria-label="返回">
          <CloseIcon />
        </button>
      </div>

      <TimeInput label="专注时长" totalSeconds={settings.work_duration}
        onChange={(v) => updateSettings({ work_duration: v })} />
      <TimeInput label="短休息" totalSeconds={settings.break_duration}
        onChange={(v) => updateSettings({ break_duration: v })} />
      <TimeInput label="长休息" totalSeconds={settings.long_break_duration}
        onChange={(v) => updateSettings({ long_break_duration: v })} />

      <div className="settings-row">
        <span className="settings-label">长休息间隔（个）</span>
        <input className="settings-input" type="number" min={1} max={10}
          value={settings.cycles_before_long_break}
          onChange={(e) => updateSettings({
            cycles_before_long_break: Math.max(1, Number(e.target.value))
          })} />
      </div>

      <div className="settings-row">
        <span className="settings-label">始终置顶</span>
        <button className={`settings-toggle ${settings.always_on_top ? 'on' : ''}`}
          onClick={() => updateSettings({ always_on_top: !settings.always_on_top })}
          aria-label="始终置顶"
          role="switch"
          aria-checked={settings.always_on_top}
        />
      </div>

      <div className="settings-row">
        <span className="settings-label">提示音</span>
        <button className={`settings-toggle ${settings.sound_enabled ? 'on' : ''}`}
          onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
          aria-label="提示音"
          role="switch"
          aria-checked={settings.sound_enabled}
        />
      </div>

      <div className="settings-row">
        <span className="settings-label">桌面通知</span>
        <button className={`settings-toggle ${settings.notification_enabled ? 'on' : ''}`}
          onClick={() => updateSettings({ notification_enabled: !settings.notification_enabled })}
          aria-label="桌面通知"
          role="switch"
          aria-checked={settings.notification_enabled}
        />
      </div>
    </div>
  );
}
