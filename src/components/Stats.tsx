interface Props {
  validCount: number;
  changeRatio?: number;
}

export function Stats({ validCount, changeRatio }: Props) {
  const pct = typeof changeRatio === 'number' && Number.isFinite(changeRatio)
    ? `${(changeRatio * 100).toFixed(2)}%`
    : '—';
  const valid = Number.isFinite(validCount) ? validCount.toLocaleString() : '0';
  return (
    <div className="stats">
      <div>有效像素：{valid}</div>
      <div>变化占比：<strong aria-live="polite">{pct}</strong></div>
    </div>
  );
}
