import { useEffect, useRef, useState } from 'react';
import { LoadedImage } from '../App';

interface Props {
  left?: LoadedImage;
  right?: LoadedImage;
}

export function SplitView({ left, right }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLCanvasElement | null>(null);
  const rightRef = useRef<HTMLCanvasElement | null>(null);
  const [pos, setPos] = useState<number>(0.5); // 0..1

  const w = left?.width ?? right?.width ?? 0;
  const h = left?.height ?? right?.height ?? 0;

  useEffect(() => {
    function draw() {
      if (left && leftRef.current) {
        const ctx = leftRef.current.getContext('2d')!;
        leftRef.current.width = w; leftRef.current.height = h;
        ctx.clearRect(0, 0, w, h); ctx.drawImage(left.bitmap, 0, 0);
      }
      if (right && rightRef.current) {
        const ctx = rightRef.current.getContext('2d')!;
        rightRef.current.width = w; rightRef.current.height = h;
        ctx.clearRect(0, 0, w, h); ctx.drawImage(right.bitmap, 0, 0);
      }
    }
    draw();
  }, [left, right, w, h]);

  const onDrag = (clientX: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const local = Math.min(Math.max(clientX - box.left, 0), box.width);
    const ratio = box.width ? local / box.width : 0.5;
    setPos(ratio);
  };

  const rightInset = `${Math.max(0, 100 - pos * 100)}%`;

  return (
    <div className="split" ref={containerRef}
      onMouseDown={(e) => onDrag(e.clientX)}
      onMouseMove={(e) => e.buttons === 1 && onDrag(e.clientX)}
      onTouchStart={(e) => onDrag(e.touches[0].clientX)}
      onTouchMove={(e) => onDrag(e.touches[0].clientX)}
    >
      <div className="split-canvas">
        <canvas ref={rightRef} style={{ clipPath: `inset(0 0 0 0)` }} />
        <canvas ref={leftRef} style={{ clipPath: `inset(0 ${rightInset} 0 0)` }} />
        {/* Divider Handle */}
        <div
          className="split-handle"
          role="slider"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos * 100)}
          tabIndex={0}
          style={{ left: `${pos * 100}%` }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - (e.shiftKey ? 0.1 : 0.01)));
            if (e.key === 'ArrowRight') setPos((p) => Math.min(1, p + (e.shiftKey ? 0.1 : 0.01)));
          }}
        />
      </div>
      <div className="split-meta">{w && h ? `${w}×${h}` : '未加载图片'}</div>
    </div>
  );
}
