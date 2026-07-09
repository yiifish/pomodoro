import { useStore } from '../stores/useStore';

interface TimeInputProps {
  label: string;
  totalSeconds: number;
  onChange: (seconds: number) => void;
}

function TimeInput({ label, totalSeconds, onChange }: TimeInputProps) {
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

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const showSettings = useStore((s) => s.showSettings);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const updateSettings = useStore((s) => s.updateSettings);

  if (!showSettings) return null;

  return (
    <div className="settings-overlay">
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
        <span className="settings-label">长休息间隔（个番茄）</span>
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

      <div className="settings-row">
        <span className="settings-label">始终置顶</span>
        <button
          className={`settings-toggle ${settings.always_on_top ? 'on' : ''}`}
          onClick={() => updateSettings({ always_on_top: !settings.always_on_top })}
        />
      </div>

      <div className="settings-row">
        <span className="settings-label">提示音</span>
        <button
          className={`settings-toggle ${settings.sound_enabled ? 'on' : ''}`}
          onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
        />
      </div>

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
