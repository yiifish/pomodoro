import { useStore, TimerPhase } from '../stores/useStore';

function phaseClass(phase: TimerPhase): string {
  if (phase === 'Idle') return 'idle';
  if (phase === 'Working') return 'working';
  return 'break';
}

function phaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'Idle': return '待机';
    case 'Working': return '专注中';
    case 'ShortBreak': return '短休息';
    case 'LongBreak': return '长休息';
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ProgressRing() {
  const timer = useStore((s) => s.timer);
  const cls = phaseClass(timer.phase);
  const label = phaseLabel(timer.phase);

  // 环形进度条参数
  const size = 90;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress =
    timer.total_seconds > 0
      ? (timer.remaining_seconds / timer.total_seconds) * circumference
      : circumference;

  // 进度条颜色
  const strokeColor =
    timer.phase === 'Idle'
      ? '#f59e0b'
      : timer.phase === 'Working'
        ? '#ef4444'
        : '#10b981';

  return (
    <div className="progress-area">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* 状态指示 */}
        <div className="header" style={{ marginBottom: 0 }}>
          <div className={`status-dot ${cls}`} />
          <span className="phase-label">{label}</span>
        </div>

        {/* 倒计时 */}
        <div className={`timer-display ${cls}`}>
          {formatTime(timer.remaining_seconds || timer.total_seconds)}
        </div>

        {/* 环形进度条 */}
        <svg
          className="progress-ring"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>
      </div>
    </div>
  );
}
