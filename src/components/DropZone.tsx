import { LoadedImage } from '../App';
import { useEffect, useState } from 'react';

interface Props {
  left?: LoadedImage;
  right?: LoadedImage;
  onFile: (file: File, side: 'left' | 'right') => void | Promise<void>;
  onBothReady: () => void | Promise<void>;
}

export function DropZone({ left, right, onFile, onBothReady }: Props) {
  const [dragOver, setDragOver] = useState(false);

  // 生成缩略图 URL，避免泄漏（基于 effect 控制声明周期）
  const [leftURL, setLeftURL] = useState<string | undefined>();
  const [rightURL, setRightURL] = useState<string | undefined>();
  useEffect(() => {
    // 同步文件->对象URL；该 state 代表外部资源引用，属于与 DOM 同步的副作用
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!left?.file) { setLeftURL(undefined); return; }
    const url = URL.createObjectURL(left.file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeftURL(url);
    return () => URL.revokeObjectURL(url);
  }, [left]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!right?.file) { setRightURL(undefined); return; }
    const url = URL.createObjectURL(right.file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRightURL(url);
    return () => URL.revokeObjectURL(url);
  }, [right]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
    if (files.length >= 1) await onFile(files[0], 'left');
    if (files.length >= 2) await onFile(files[1], 'right');
    if (files.length > 0) await onBothReady();
    setDragOver(false);
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const f = e.target.files?.[0];
    if (f) {
      await onFile(f, side);
      if ((side === 'left' && right) || (side === 'right' && left)) await onBothReady();
    }
  };

  return (
    <div
      className={`dz${dragOver ? ' is-dragover' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={onDrop}
    >
      <div className="dz-col">
        <label className="dz-card">
          <div className="dz-title">左图</div>
          <div className="dz-row">
            <div className="dz-thumb">
              {leftURL ? <img src={leftURL} alt="左图预览" /> : <div className="dz-thumb-ph" aria-hidden="true" />}
            </div>
            {left ? (
              <div className="dz-meta">{left.name} · {left.width}×{left.height}</div>
            ) : (
              <div className="dz-hint">拖入或选择 PNG/JPEG/WebP</div>
            )}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPick(e, 'left')} hidden />
        </label>
      </div>
      <div className="dz-col">
        <label className="dz-card">
          <div className="dz-title">右图</div>
          <div className="dz-row">
            <div className="dz-thumb">
              {rightURL ? <img src={rightURL} alt="右图预览" /> : <div className="dz-thumb-ph" aria-hidden="true" />}
            </div>
            {right ? (
              <div className="dz-meta">{right.name} · {right.width}×{right.height}</div>
            ) : (
              <div className="dz-hint">拖入或选择 PNG/JPEG/WebP</div>
            )}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPick(e, 'right')} hidden />
        </label>
      </div>
    </div>
  );
}
