import { forwardRef } from 'react';

export const HeatmapView = forwardRef<HTMLCanvasElement, { width: number; height: number }>(
  function HeatmapView({ width, height }, ref) {
    return (
      <div className="heatmap">
        <canvas ref={ref} width={width} height={height} />
      </div>
    );
  }
);

