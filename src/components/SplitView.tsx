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
  // 记录画布在容器中的实际显示区域，用于像素级对齐分割线
  const [canvasBox, setCanvasBox] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const w = left?.width ?? right?.width ?? 0;
  const h = left?.height ?? right?.height ?? 0;

  useEffect(() => {
    function draw() {
      if (left && leftRef.current) {
        const ctx = leftRef.current.getContext('2d')!;
        leftRef.current.width = w; leftRef.current.height = h;
        ctx.clearRect(0, 0, w, h);
        // 背景填充，避免左图透明区域透出下层右图
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(left.bitmap, 0, 0);
      }
      if (right && rightRef.current) {
        const ctx = rightRef.current.getContext('2d')!;
        rightRef.current.width = w; rightRef.current.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(right.bitmap, 0, 0);
      }
    }
    draw();
    // 绘制后测量一次，获取画布在容器内的实际 CSS 尺寸与偏移
    const measure = () => {
      const container = containerRef.current;
      const canvas = leftRef.current || rightRef.current;
      if (!container || !canvas) return;
      const cbox = container.getBoundingClientRect();
      const bbox = canvas.getBoundingClientRect();
      setCanvasBox({ left: bbox.left - cbox.left, width: bbox.width });
    };
    measure();
    // 监听窗口尺寸变化以保持位置比例
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [left, right, w, h]);

  const onDrag = (clientX: number) => {
    // 仅以画布显示区域为基准计算比例，确保“拖到哪就在哪”
    const container = containerRef.current;
    const canvas = leftRef.current || rightRef.current;
    if (!container || !canvas) return;
    const cbox = container.getBoundingClientRect();
    const bbox = canvas.getBoundingClientRect();
    const local = Math.min(Math.max(clientX - bbox.left, 0), bbox.width);
    const ratio = bbox.width ? local / bbox.width : 0.5;
    setPos(ratio);
    // 同步一次测量，避免极端情况下的轻微偏移
    setCanvasBox({ left: bbox.left - cbox.left, width: bbox.width });
  };

  // 使用像素 inset，避免百分比基于容器导致的错位
  const rightInsetPx = Math.max(0, canvasBox.width - pos * canvasBox.width);
  const leftInsetPx = Math.max(0, pos * canvasBox.width);
  const handleLeftPx = canvasBox.left + pos * canvasBox.width;

  return (
    <div className="split" ref={containerRef}
      onMouseDown={(e) => onDrag(e.clientX)}
      onMouseMove={(e) => e.buttons === 1 && onDrag(e.clientX)}
      onTouchStart={(e) => onDrag(e.touches[0].clientX)}
      onTouchMove={(e) => onDrag(e.touches[0].clientX)}
    >
      <div className="split-canvas">
        <canvas ref={rightRef} style={{ clipPath: `inset(0 0 0 ${leftInsetPx}px)` }} />
        <canvas ref={leftRef} style={{ clipPath: `inset(0 ${rightInsetPx}px 0 0)` }} />
        {/* Divider Handle */}
        <div
          className="split-handle"
          role="slider"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos * 100)}
          tabIndex={0}
          style={{ left: `${handleLeftPx}px` }}
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
