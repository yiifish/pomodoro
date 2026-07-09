// 环形进度条 + 倒计时显示 / Circular progress ring + countdown display
//
// 根据计时状态切换颜色 / Switches color based on timer phase:
//   Idle       → 琥珀 #F59E0B
//   Working    → 红   #EF4444
//   Break      → 绿   #10B981

import { useStore, TimerPhase } from '../stores/useStore';

/** 获取 CSS 类名 / Get CSS class suffix */
function phaseClass(phase: TimerPhase): string {
  if (phase === 'Idle') return 'idle';
  if (phase === 'Working') return 'working';
  return 'break';
}

/** 获取中文阶段标签 / Get Chinese phase label */
function phaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'Idle': return '待机';
    case 'Working': return '专注中';
    case 'ShortBreak': return '短休息';
    case 'LongBreak': return '长休息';
  }
}

/** 秒数 → MM:SS 格式 / Seconds → MM:SS format */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ProgressRing() {
  const timer = useStore((s) => s.timer);
  const cls = phaseClass(timer.phase);
  const label = phaseLabel(timer.phase);

  // SVG 环形进度条参数 / SVG ring parameters
  const size = 90;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 进度 = 剩余秒数 / 总秒数 / Progress = remaining / total
  const progress =
    timer.total_seconds > 0
      ? (timer.remaining_seconds / timer.total_seconds) * circumference
      : circumference;

  // 环的颜色根据状态变化 / Ring color changes with phase
  const strokeColor =
    timer.phase === 'Idle'
      ? '#f59e0b'
      : timer.phase === 'Working'
        ? '#ef4444'
        : '#10b981';

  return (
    <div className="progress-area">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* 状态行：颜色圆点 + 阶段名 */}
        <div className="header" style={{ marginBottom: 0 }}>
          <div className={`status-dot ${cls}`} />
          <span className="phase-label">{label}</span>
        </div>

        {/* 倒计时数字 / Countdown digits */}
        <div className={`timer-display ${cls}`}>
          {formatTime(timer.remaining_seconds || timer.total_seconds)}
        </div>

        {/* SVG 环形进度条 / SVG circular progress */}
        <svg
          className="progress-ring"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* 背景轨道 / Background track */}
          <circle
            className="bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* 进度填充 / Progress fill */}
          {/* strokeDasharray = 圆周长，strokeDashoffset = 圆周长 - 实际进度 */}
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
