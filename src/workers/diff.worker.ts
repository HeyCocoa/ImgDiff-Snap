import { computeDiff } from '../utils/math';

type Cmd = { type: 'compute'; a: ImageData; b: ImageData };
type Rsp = { type: 'computed'; width: number; height: number; diff: Uint8Array; validMask: Uint8Array; validCount: number };

self.onmessage = (e: MessageEvent<Cmd>) => {
  const msg = e.data;
  if (msg.type === 'compute') {
    const { width, height, diff, validMask, validCount } = computeDiff(msg.a, msg.b);
    (self as any).postMessage(
      { type: 'computed', width, height, diff, validMask, validCount } as Rsp,
      [diff.buffer, validMask.buffer]
    );
  }
};

