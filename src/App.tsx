import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { ControlBar } from './components/ControlBar';
import { SplitView } from './components/SplitView';
import { HeatmapView } from './components/HeatmapView';
import { Stats } from './components/Stats';
import { applyThresholdToHeatmap, computeDiff } from './utils/math';
import { downloadPNG, slug, timestamp } from './utils/canvas';
import { toImageData } from './utils/image';

export type ViewMode = 'split' | 'heatmap';

export interface LoadedImage {
  file?: File;
  name: string;
  width: number;
  height: number;
  bitmap: ImageBitmap;
  imageData: ImageData;
}

export interface DiffCache {
  width: number;
  height: number;
  diff: Uint8Array;
  validMask: Uint8Array;
  validCount: number;
}

export interface AppState {
  left?: LoadedImage;
  right?: LoadedImage;
  threshold: number;
  view: ViewMode;
  cache?: DiffCache;
  changeRatio?: number; // 0..1
  // 当执行“交换左右”时，跳过下一次自动重算（缓存可复用）
  skipComputeOnce?: boolean;
}

type Action =
  | { type: 'set-left'; payload?: LoadedImage }
  | { type: 'set-right'; payload?: LoadedImage }
  | { type: 'set-threshold'; payload: number }
  | { type: 'set-view'; payload: ViewMode }
  | { type: 'set-cache'; payload?: DiffCache }
  | { type: 'swap' }
  | { type: 'set-change-ratio'; payload?: number };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set-left':
      return { ...state, left: action.payload, cache: undefined, changeRatio: undefined };
    case 'set-right':
      return { ...state, right: action.payload, cache: undefined, changeRatio: undefined };
    case 'set-threshold':
      return { ...state, threshold: action.payload };
    case 'set-view':
      return { ...state, view: action.payload };
    case 'set-cache':
      return { ...state, cache: action.payload };
    case 'swap':
      // 保留 cache 与 changeRatio，避免不必要的重算；仅跳过下一次自动计算
      return { ...state, left: state.right, right: state.left, skipComputeOnce: true };
    case 'set-change-ratio':
      return { ...state, changeRatio: action.payload };
    case 'consume-skip':
      return { ...state, skipComputeOnce: false };

    default:
      return state;
  }
}

const SIX_MP = 6_000_000; // 6MP 阈值
const MAX_N = 16_000_000; // 单图像素上限
const MAX_SIDE = 8192; // 任一边上限

export default function App() {
  const [state, dispatch] = useReducer(reducer, { threshold: 32, view: 'split' });
  const [error, setError] = useState<string | undefined>();
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapImageDataRef = useRef<ImageData | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const dims = useMemo(() => {
    const w = state.left?.width ?? state.right?.width;
    const h = state.left?.height ?? state.right?.height;
    return { w, h };
  }, [state.left, state.right]);

  async function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./workers/diff.worker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }

  // 当左右两图就绪时触发计算与缓存
  // 注意：通过 effect 监听，避免事件次序导致的状态不同步
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.left && state.right) {
      if (state.skipComputeOnce) {
        // 本次由于交换导致的变更，跳过自动计算
        dispatch({ type: 'consume-skip' });
      } else {
        onBothReady();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.left, state.right, state.skipComputeOnce]);

  function resetHeatmapBuffer(width: number, height: number) {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    heatmapImageDataRef.current = ctx.createImageData(width, height);
  }

  async function onBothReady() {
    setError(undefined);
    const a = state.left, b = state.right;
    if (!a || !b) return;
    if (a.width !== b.width || a.height !== b.height) {
      setError(`两张图片尺寸需一致：A=${a.width}×${a.height}，B=${b.width}×${b.height}`);
      dispatch({ type: 'set-cache', payload: undefined });
      return;
    }
    if (a.width > MAX_SIDE || a.height > MAX_SIDE || b.width > MAX_SIDE || b.height > MAX_SIDE) {
      setError('任一边不应超过 8192px');
      dispatch({ type: 'set-cache', payload: undefined });
      return;
    }
    const N = a.width * a.height;
    if (N > MAX_N) {
      setError('单图像素上限为 16MP');
      dispatch({ type: 'set-cache', payload: undefined });
      return;
    }

    resetHeatmapBuffer(a.width, a.height);

    if (N >= SIX_MP) {
      const worker = await ensureWorker();
      const msg = { type: 'compute', a: a.imageData, b: b.imageData } as any;
      await new Promise<void>((resolve) => {
        worker.onmessage = (e: MessageEvent<any>) => {
          const { width, height, diff, validMask, validCount } = e.data;
          dispatch({ type: 'set-cache', payload: { width, height, diff, validMask, validCount } });
          resolve();
        };
        worker.postMessage(msg);
      });
    } else {
      const { width, height, diff, validMask, validCount } = computeDiff(a.imageData, b.imageData);
      dispatch({ type: 'set-cache', payload: { width, height, diff, validMask, validCount } });
    }
  }

  function applyCurrentThreshold(t: number) {
    const cache = state.cache;
    const canvas = heatmapCanvasRef.current;
    const out = heatmapImageDataRef.current;
    if (!cache || !canvas || !out) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const changed = applyThresholdToHeatmap(cache.diff, cache.validMask, cache.width, cache.height, t, out);
    ctx.putImageData(out, 0, 0);
    const ratio = cache.validCount ? changed / cache.validCount : undefined;
    dispatch({ type: 'set-change-ratio', payload: ratio });
  }

  // 当缓存或阈值变化时，更新热力图与统计
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.cache) applyCurrentThreshold(state.threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cache, state.threshold]);

  // 当阈值变化时重新映射
  const onThresholdChange = (t: number) => {
    dispatch({ type: 'set-threshold', payload: t });
    // 可能尚未缓存完成，延迟到下一帧处理
    requestAnimationFrame(() => applyCurrentThreshold(t));
  };

  const loadExample = async (key: string) => {
    // 运行时生成示例 PNG（不依赖网络/文件）
    const gens: Record<string, () => Promise<[File, File]>> = {
      'set-1': async () => makePair(512, 320, (_) => {}, (ctx) => {
        ctx.fillStyle = 'rgba(255,0,0,1)';
        ctx.fillRect(20, 20, 120, 80);
      }),
      'set-2': async () => makePair(640, 360, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 640, 0);
        g.addColorStop(0, '#eeeeee'); g.addColorStop(1, '#bbbbbb'); ctx.fillStyle = g; ctx.fillRect(0,0,640,360);
      }, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 640, 0);
        g.addColorStop(0, '#eeeeee'); g.addColorStop(1, '#b9b9b9'); ctx.fillStyle = g; ctx.fillRect(0,0,640,360);
        ctx.fillStyle = 'rgba(0,0,255,1)'; ctx.fillRect(200, 120, 60, 60);
      }),
      'set-3': async () => makePair(400, 400, (ctx) => {
        checker(ctx, 400, 400, '#f8f8f8', '#e8e8e8', 20);
      }, (ctx) => {
        checker(ctx, 400, 400, '#f8f8f8', '#e8e8e8', 20);
        ctx.strokeStyle = 'rgba(255,0,0,1)'; ctx.lineWidth = 6; ctx.strokeRect(80, 80, 240, 240);
      })
    };
    const make = gens[key];
    if (!make) return;
    const [lf, rf] = await make();
    await handleFile(lf, 'left');
    await handleFile(rf, 'right');
    await onBothReady();
  };

  async function handleFile(file: File, side: 'left' | 'right') {
    try {
      const bitmap = await createImageBitmap(file as any, { imageOrientation: 'from-image' } as any).catch(() => createImageBitmap(file as any));
      const imageData = toImageData(bitmap);
      const payload: LoadedImage = { file, name: file.name.replace(/\.[^.]+$/, ''), width: bitmap.width, height: bitmap.height, bitmap, imageData };
      dispatch({ type: side === 'left' ? 'set-left' : 'set-right', payload });
    } catch (e) {
      console.error(e);
      setError('图片解码失败，请更换文件（建议 PNG/JPEG/WebP）');
    }
  }

  function onSwap() {
    // 仅交换左右并标记跳过一次自动计算；缓存可直接复用
    dispatch({ type: 'swap' });
  }

  function onView(v: ViewMode) { dispatch({ type: 'set-view', payload: v }); }

  function onDownloadHeatmap() {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    const t = state.threshold;
    const base = state.left?.file?.name ? `${slug(state.left.file.name.replace(/\.[^.]+$/, ''))}-heatmap` : 'heatmap';
    const name = `${base}-t${t}-${timestamp()}.png`;
    downloadPNG(canvas, name);
  }

  const validCount = state.cache?.validCount ?? 0;

  return (
    <div className="app">
      <h1>ImgDiff Snap</h1>
      <DropZone
        left={state.left}
        right={state.right}
        onFile={(f, side) => handleFile(f, side)}
        onBothReady={onBothReady}
      />
      <ControlBar
        threshold={state.threshold}
        onChangeThreshold={onThresholdChange}
        view={state.view}
        onChangeView={onView}
        onSwap={onSwap}
        onLoadExample={loadExample}
        onDownload={onDownloadHeatmap}
        ready={Boolean(state.left && state.right)}
      />
      {error && <div className="error" role="alert">{error}</div>}

      <div className="views">
        {state.view === 'split' ? (
          <SplitView left={state.left} right={state.right} />
        ) : (
          <HeatmapView ref={heatmapCanvasRef} width={dims.w ?? 0} height={dims.h ?? 0} />
        )}
      </div>

      <Stats validCount={validCount} changeRatio={state.changeRatio} />

      <footer>
        <small>100% 本地运行 · 无外部网络请求</small>
      </footer>
    </div>
  );
}

// Helpers: generate example pairs on the fly
async function makePair(w: number, h: number, drawA: (ctx: CanvasRenderingContext2D) => void, drawB: (ctx: CanvasRenderingContext2D) => void) {
  const ca = document.createElement('canvas'); ca.width = w; ca.height = h; const cxa = ca.getContext('2d')!;
  const cb = document.createElement('canvas'); cb.width = w; cb.height = h; const cxb = cb.getContext('2d')!;
  cxa.fillStyle = '#ffffff'; cxa.fillRect(0, 0, w, h); drawA(cxa);
  cxb.fillStyle = '#ffffff'; cxb.fillRect(0, 0, w, h); drawB(cxb);
  const aBlob = await new Promise<Blob | null>((res) => ca.toBlob(res));
  const bBlob = await new Promise<Blob | null>((res) => cb.toBlob(res));
  const a = new File([aBlob!], 'example-left.png', { type: 'image/png' });
  const b = new File([bBlob!], 'example-right.png', { type: 'image/png' });
  return [a, b] as const;
}

function checker(ctx: CanvasRenderingContext2D, w: number, h: number, a: string, b: string, size = 16) {
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const odd = ((x / size) ^ (y / size)) & 1; ctx.fillStyle = odd ? a : b; ctx.fillRect(x, y, size, size);
    }
  }
}
