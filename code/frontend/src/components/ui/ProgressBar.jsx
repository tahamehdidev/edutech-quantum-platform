import "./ProgressBar.css";

export function ProgressBar({ value, max = 100, label }) {
  const clamped = Math.min(max, Math.max(0, value));
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="progress-bar__fill" style={{ transform: `scaleX(${percent / 100})` }} />
    </div>
  );
}
