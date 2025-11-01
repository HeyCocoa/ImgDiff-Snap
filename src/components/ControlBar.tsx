import { ViewMode } from '../App';

interface Props {
  threshold: number;
  onChangeThreshold: (v: number) => void;
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
  onSwap: () => void;
  onLoadExample: (key: string) => void;
  onDownload: () => void;
  ready: boolean;
}

export function ControlBar({ threshold, onChangeThreshold, view, onChangeView, onSwap, onLoadExample, onDownload, ready }: Props) {
  return (
    <div className="bar">
      <div className="bar-group">
        <label>
          阈值：<strong>{threshold}</strong>
          <input
            type="range"
            min={0}
            max={255}
            step={1}
            value={threshold}
            aria-label="阈值"
            onChange={(e) => onChangeThreshold(parseInt((e.target as HTMLInputElement).value))}
          />
        </label>
      </div>
      <div className="bar-group">
        <button onClick={() => onChangeView('split')} aria-pressed={view === 'split'}>分割</button>
        <button onClick={() => onChangeView('heatmap')} aria-pressed={view === 'heatmap'}>热力图</button>
        <button onClick={onSwap} disabled={!ready}>交换左右</button>
      </div>
      <div className="bar-group">
        <select onChange={(e) => onLoadExample((e.target as HTMLSelectElement).value)} defaultValue="">
          <option value="" disabled>加载示例</option>
          <option value="set-1">示例 1</option>
          <option value="set-2">示例 2</option>
          <option value="set-3">示例 3</option>
        </select>
        <button onClick={onDownload} disabled={!ready}>下载热力图 PNG</button>
      </div>
    </div>
  );
}

