import type { CSSProperties } from 'react';
import { ViewMode } from '../App';

interface Props {
  threshold: number;
  onChangeThreshold: (v: number) => void;
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  onSwap: () => void;
  onLoadExample: (key: string) => void;
  onDownloadSplit: () => void;
  onDownloadHeatmap: () => void;
  ready: boolean;
}

export function ControlBar({ threshold, onChangeThreshold, view, onChangeView, onSwap, onLoadExample, onDownloadSplit, onDownloadHeatmap, ready }: Props) {
  const sliderStyle = { ['--val' as any]: threshold } as CSSProperties;
  return (
    <div className="bar">
      {/* 左侧：视图 segmented control */}
      <div className="bar-group seg" role="tablist" aria-label="视图">
        <button role="tab" onClick={() => onChangeView('split')} aria-selected={view === 'split'} aria-pressed={view === 'split'}>分割</button>
        <button role="tab" onClick={() => onChangeView('heatmap')} aria-selected={view === 'heatmap'} aria-pressed={view === 'heatmap'}>热力图</button>
      </div>

      {/* 中间：阈值滑块 */}
      <div className="bar-group">
        <label>
          阈值：<strong aria-live="polite">{threshold}</strong>
          <input
            type="range"
            min={0}
            max={255}
            step={1}
            value={threshold}
            style={sliderStyle}
            aria-label="阈值"
            onChange={(e) => onChangeThreshold(parseInt((e.target as HTMLInputElement).value))}
          />
        </label>
      </div>

      {/* 分割线显隐按钮已移除；交互改为自动隐去 */}

      {/* 右侧：示例 + 操作按钮 */}
      <div className="bar-group examples">
        <div className="chips" aria-label="加载示例">
          <button type="button" className="chip" onClick={() => onLoadExample('set-1')}>示例1</button>
          <button type="button" className="chip" onClick={() => onLoadExample('set-2')}>示例2</button>
          <button type="button" className="chip" onClick={() => onLoadExample('set-3')}>示例3</button>
        </div>
        <button onClick={onSwap} disabled={!ready} title="交换左右">交换左右</button>
        {view === 'split' ? (
          <button onClick={onDownloadSplit} disabled={!ready} className="primary" aria-label="下载分割图">
            下载分割图
          </button>
        ) : (
          <button onClick={onDownloadHeatmap} disabled={!ready} className="primary" aria-label={`下载热力图（阈值 ${threshold}）`}>
            下载热力图
          </button>
        )}
      </div>
    </div>
  );
}
