import { LoadedImage } from '../App';

interface Props {
  left?: LoadedImage;
  right?: LoadedImage;
  onFile: (file: File, side: 'left' | 'right') => void | Promise<void>;
  onBothReady: () => void | Promise<void>;
}

export function DropZone({ left, right, onFile, onBothReady }: Props) {
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
    if (files.length >= 1) await onFile(files[0], 'left');
    if (files.length >= 2) await onFile(files[1], 'right');
    if (files.length > 0) await onBothReady();
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const f = e.target.files?.[0];
    if (f) {
      await onFile(f, side);
      if ((side === 'left' && right) || (side === 'right' && left)) await onBothReady();
    }
  };

  return (
    <div className="dz" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="dz-col">
        <label className="dz-card">
          <div className="dz-title">左图</div>
          {left ? (
            <div className="dz-meta">{left.name} · {left.width}×{left.height}</div>
          ) : (
            <div className="dz-hint">拖入或选择 PNG/JPEG/WebP</div>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPick(e, 'left')} hidden />
        </label>
      </div>
      <div className="dz-col">
        <label className="dz-card">
          <div className="dz-title">右图</div>
          {right ? (
            <div className="dz-meta">{right.name} · {right.width}×{right.height}</div>
          ) : (
            <div className="dz-hint">拖入或选择 PNG/JPEG/WebP</div>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onPick(e, 'right')} hidden />
        </label>
      </div>
    </div>
  );
}
