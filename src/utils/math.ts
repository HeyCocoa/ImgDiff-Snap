// 计算 diff[] 与 validMask[]；忽略任一张 alpha<255 的像素
export function computeDiff(a: ImageData, b: ImageData) {
  const { width, height, data: A } = a; const B = b.data;
  const N = width * height; const diff = new Uint8Array(N);
  const valid = new Uint8Array(N); let validCount = 0;
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    const aA = A[p + 3], bA = B[p + 3];
    if (aA === 255 && bA === 255) {
      const d = (Math.abs(A[p] - B[p]) + Math.abs(A[p + 1] - B[p + 1]) + Math.abs(A[p + 2] - B[p + 2])) / 3;
      diff[i] = d; valid[i] = 1; validCount++;
    } else { diff[i] = 0; valid[i] = 0; }
  }
  return { width, height, diff, validMask: valid, validCount } as const;
}

// 阈值映射到热力图（纯红，alpha 线性映射）；返回变化像素数
export function applyThresholdToHeatmap(diff: Uint8Array, valid: Uint8Array, w: number, h: number, t: number, out: ImageData) {
  const D = diff, V = valid, N = w * h, pix = out.data; let changed = 0;
  // α 映射 LUT（长度 256）；d<=t 为 0，否则线性映射到 1..255
  const lut = new Uint8Array(256);
  const denom = 255 - t || 1; // t=255 防除零
  for (let d = 0; d < 256; d++) lut[d] = d <= t ? 0 : Math.round(255 * (d - t) / denom);
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    const isValid = V[i] === 1; const d = D[i];
    const a = isValid ? lut[d] : 0;
    pix[p]=255; pix[p+1]=0; pix[p+2]=0; pix[p+3]=a;
    if (a) changed++;
  }
  return changed;
}
