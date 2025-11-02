import { forwardRef } from 'react';

interface Props { width: number; height: number; threshold: number; changeRatio?: number }

// Canvas + 右下角图例（不依赖画布缩放）
export const HeatmapView = forwardRef<HTMLCanvasElement, Props>(
  function HeatmapView({ width, height, threshold, changeRatio }, ref) {
    const pct = typeof changeRatio === 'number' && Number.isFinite(changeRatio)
      ? `${(changeRatio * 100).toFixed(2)}%`
      : '—';
    // 小三角位置按 t/255 映射
    const leftPct = `${(Math.min(Math.max(threshold, 0), 255) / 255) * 100}%`;
    return (
      <div className="heatmap">
        <canvas ref={ref} width={width} height={height} />
        <div className="legend" aria-hidden="false">
          <div className="legend-row">
            <span className="legend-title">变化占比：<strong>{pct}</strong></span>
          </div>
          <div className="legend-bar">
            <div className="legend-grad" />
            <div className="legend-pointer" style={{ left: leftPct }} title={`阈值 t=${threshold}`} />
          </div>
          <div className="legend-scale">
            <span>0</span>
            <span>255</span>
          </div>
        </div>
      </div>
    );
  }
);
