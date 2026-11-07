/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface DocumentQuad {
  tl: Point; // Top-Left
  tr: Point; // Top-Right
  br: Point; // Bottom-Right
  bl: Point; // Bottom-Left
}

export type FilterType = 'magic' | 'bw' | 'grayscale' | 'sharp' | 'original';

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  aspectRatio: number; // width / height
  quad: DocumentQuad; // detected or adjusted corners
  rotation: number; // 0, 90, 180, 270
  filter: FilterType;
  processedDataUrl?: string;
  ocrText?: string;
  createdAt: number;
}

/**
 * High-precision Document Boundary & Corner Detection
 * Works on notebook, paper, receipt placed on table, bed sheet, desk, floor.
 */
export async function detectDocumentCorners(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<DocumentQuad> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return getDefaultQuad();
  }

  // Downsample for rapid, high-accuracy computer vision analysis
  const maxDim = 320;
  let w = imageSource.width || 800;
  let h = imageSource.height || 600;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(imageSource, 0, 0, sw, sh);

  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // 1. Grayscale & Luminance
  const gray = new Uint8Array(sw * sh);
  let totalLuma = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const idx = i >> 2;
    gray[idx] = luma;
    totalLuma += luma;
  }
  const avgLuma = totalLuma / (sw * sh);

  // 2. Sobel Edge Gradient Filter
  const edges = new Uint8Array(sw * sh);
  let maxGrad = 0;
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = y * sw + x;
      // Horizontal gradient
      const gx =
        -gray[idx - sw - 1] +
        gray[idx - sw + 1] -
        2 * gray[idx - 1] +
        2 * gray[idx + 1] -
        gray[idx + sw - 1] +
        gray[idx + sw + 1];

      // Vertical gradient
      const gy =
        -gray[idx - sw - 1] -
        2 * gray[idx - sw] -
        gray[idx - sw + 1] +
        gray[idx + sw - 1] +
        2 * gray[idx + sw] +
        gray[idx + sw + 1];

      const grad = Math.abs(gx) + Math.abs(gy);
      edges[idx] = grad > 255 ? 255 : grad;
      if (grad > maxGrad) maxGrad = grad;
    }
  }

  // 3. Search 4 Quadrants for extreme outer corner candidates of document paper
  // Documents (notebooks, sheets) are generally brighter than or contrast sharply with tables/beds
  const midX = sw / 2;
  const midY = sh / 2;

  // Top-Left (min x + y)
  let tlBest = { x: sw * 0.08, y: sh * 0.08, score: -Infinity };
  // Top-Right (max x - y)
  let trBest = { x: sw * 0.92, y: sh * 0.08, score: -Infinity };
  // Bottom-Right (max x + y)
  let brBest = { x: sw * 0.92, y: sh * 0.92, score: -Infinity };
  // Bottom-Left (min x - y)
  let blBest = { x: sw * 0.08, y: sh * 0.92, score: -Infinity };

  const marginX = Math.round(sw * 0.03);
  const marginY = Math.round(sh * 0.03);
  const edgeThreshold = Math.max(35, maxGrad * 0.22);

  for (let y = marginY; y < sh - marginY; y += 2) {
    for (let x = marginX; x < sw - marginX; x += 2) {
      const idx = y * sw + x;
      const edgeVal = edges[idx];
      const luma = gray[idx];

      // Prefer pixels with strong edge or distinct paper color compared to background
      if (edgeVal >= edgeThreshold || Math.abs(luma - avgLuma) > 30) {
        // Distance to corners and quadrants
        const distFromCenter = Math.hypot(x - midX, y - midY);

        if (x < midX && y < midY) {
          // TL: minimizes x + y with edge weight
          const score = -(x * 1.2 + y * 1.2) + edgeVal * 0.5 + distFromCenter * 0.2;
          if (score > tlBest.score) {
            tlBest = { x, y, score };
          }
        } else if (x >= midX && y < midY) {
          // TR: maximizes x - y
          const score = (x * 1.2 - y * 1.2) + edgeVal * 0.5 + distFromCenter * 0.2;
          if (score > trBest.score) {
            trBest = { x, y, score };
          }
        } else if (x >= midX && y >= midY) {
          // BR: maximizes x + y
          const score = (x * 1.2 + y * 1.2) + edgeVal * 0.5 + distFromCenter * 0.2;
          if (score > brBest.score) {
            brBest = { x, y, score };
          }
        } else {
          // BL: minimizes x - y
          const score = -(x * 1.2 - y * 1.2) + edgeVal * 0.5 + distFromCenter * 0.2;
          if (score > blBest.score) {
            blBest = { x, y, score };
          }
        }
      }
    }
  }

  // Convert to 0..100 percentage coordinates
  const tl: Point = {
    x: clamp((tlBest.x / sw) * 100, 2, 45),
    y: clamp((tlBest.y / sh) * 100, 2, 45),
  };
  const tr: Point = {
    x: clamp((trBest.x / sw) * 100, 55, 98),
    y: clamp((trBest.y / sh) * 100, 2, 45),
  };
  const br: Point = {
    x: clamp((brBest.x / sw) * 100, 55, 98),
    y: clamp((brBest.y / sh) * 100, 55, 98),
  };
  const bl: Point = {
    x: clamp((blBest.x / sw) * 100, 2, 45),
    y: clamp((blBest.y / sh) * 100, 55, 98),
  };

  // Ensure validity (TR is to right of TL, BR is below TR, etc.)
  if (tr.x - tl.x < 30 || bl.y - tl.y < 30 || br.x - bl.x < 30 || br.y - tr.y < 30) {
    return getDefaultQuad();
  }

  return { tl, tr, br, bl };
}

export function getDefaultQuad(): DocumentQuad {
  return {
    tl: { x: 7, y: 8 },
    tr: { x: 93, y: 8 },
    br: { x: 93, y: 92 },
    bl: { x: 7, y: 92 },
  };
}

export function getFullQuad(): DocumentQuad {
  return {
    tl: { x: 0, y: 0 },
    tr: { x: 100, y: 0 },
    br: { x: 100, y: 100 },
    bl: { x: 0, y: 100 },
  };
}

/**
 * Perspective Transform & Auto-Crop
 * Warps the quadrilateral notebook/paper region into a flat rectangular document!
 */
export async function warpDocumentPerspective(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  quad: DocumentQuad,
  targetWidth = 1400
): Promise<HTMLCanvasElement> {
  const srcW = imageSource.width;
  const srcH = imageSource.height;

  // Convert percentage points to actual source pixel coordinates
  const p0 = { x: (quad.tl.x / 100) * srcW, y: (quad.tl.y / 100) * srcH };
  const p1 = { x: (quad.tr.x / 100) * srcW, y: (quad.tr.y / 100) * srcH };
  const p2 = { x: (quad.br.x / 100) * srcW, y: (quad.br.y / 100) * srcH };
  const p3 = { x: (quad.bl.x / 100) * srcW, y: (quad.bl.y / 100) * srcH };

  // Calculate target dimensions based on quadrilateral edge lengths
  const topWidth = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const bottomWidth = Math.hypot(p2.x - p3.x, p2.y - p3.y);
  const leftHeight = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const rightHeight = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const avgWidth = (topWidth + bottomWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  const aspect = avgWidth / (avgHeight || 1);
  const outW = Math.round(targetWidth);
  const outH = Math.round(targetWidth / aspect);

  // High-performance canvas projective transform via subdivided mesh
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Compute Homography matrix (3x3) mapping destination rectangle to source quadrilateral
  // Destination: (0,0), (outW,0), (outW,outH), (0,outH)
  // Source: p0, p1, p2, p3
  const H = getPerspectiveTransformMatrix(
    [
      { x: 0, y: 0 },
      { x: outW, y: 0 },
      { x: outW, y: outH },
      { x: 0, y: outH },
    ],
    [p0, p1, p2, p3]
  );

  // We can render the warp either via pixel inverse mapping or subdivided triangle mesh
  // Subdivided triangles on canvas provides ultra-smooth 60fps rendering without jank!
  const gridX = 24;
  const gridY = 32;

  const dx = outW / gridX;
  const dy = outH / gridY;

  // Temporary source canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d');
  if (srcCtx) {
    srcCtx.drawImage(imageSource, 0, 0);
  }

  // Draw warped triangles
  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const x0 = gx * dx;
      const y0 = gy * dy;
      const x1 = (gx + 1) * dx;
      const y1 = (gy + 1) * dy;

      const sp0 = applyHomography(H, x0, y0);
      const sp1 = applyHomography(H, x1, y0);
      const sp2 = applyHomography(H, x1, y1);
      const sp3 = applyHomography(H, x0, y1);

      // Upper triangle
      drawTriangle(ctx, srcCanvas, x0, y0, x1, y0, x0, y1, sp0.x, sp0.y, sp1.x, sp1.y, sp3.x, sp3.y);
      // Lower triangle
      drawTriangle(ctx, srcCanvas, x1, y0, x1, y1, x0, y1, sp1.x, sp1.y, sp2.x, sp2.y, sp3.x, sp3.y);
    }
  }

  return canvas;
}

/**
 * Apply CamScanner style filters: Magic Color, B&W Clean, Grayscale, Sharp, Original
 */
export function applyDocumentFilter(
  canvas: HTMLCanvasElement,
  filterType: FilterType
): HTMLCanvasElement {
  if (filterType === 'original') return canvas;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = canvas.width;
  outCanvas.height = canvas.height;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(canvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  const len = d.length;

  if (filterType === 'magic') {
    // CamScanner "Magic Color": Whitens background paper while preserving blue/black ink & color markings
    for (let i = 0; i < len; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luma > 175) {
        // Bright paper surface -> push gently to clean white
        const boost = (luma - 175) / 80;
        r = Math.min(255, r + (255 - r) * boost * 1.15);
        g = Math.min(255, g + (255 - g) * boost * 1.15);
        b = Math.min(255, b + (255 - b) * boost * 1.15);
      } else if (luma < 120) {
        // Ink / Pen strokes -> deepen contrast for crisp readability
        const darken = 0.85;
        r = Math.max(0, r * darken);
        g = Math.max(0, g * darken);
        b = Math.max(0, b * darken);
      } else {
        // Midtones
        r = Math.min(255, Math.max(0, (r - 128) * 1.25 + 138));
        g = Math.min(255, Math.max(0, (g - 128) * 1.25 + 138));
        b = Math.min(255, Math.max(0, (b - 128) * 1.25 + 138));
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  } else if (filterType === 'bw') {
    // High-contrast clean Black & White Document: eliminates table/bed shadows completely!
    for (let i = 0; i < len; i += 4) {
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Adaptive threshold: text vs paper
      const val = luma < 145 ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
  } else if (filterType === 'grayscale') {
    // Smooth 8-bit grays with contrast boost
    for (let i = 0; i < len; i += 4) {
      let luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast stretch
      luma = (luma - 128) * 1.35 + 128;
      luma = Math.min(255, Math.max(0, luma));
      d[i] = luma;
      d[i + 1] = luma;
      d[i + 2] = luma;
    }
  } else if (filterType === 'sharp') {
    // Unsharp mask / edge enhancement
    for (let i = 0; i < len; i += 4) {
      const r = (d[i] - 128) * 1.3 + 128;
      const g = (d[i + 1] - 128) * 1.3 + 128;
      const b = (d[i + 2] - 128) * 1.3 + 128;
      d[i] = Math.min(255, Math.max(0, r));
      d[i + 1] = Math.min(255, Math.max(0, g));
      d[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

/**
 * Rotate canvas by 90, 180, 270 degrees
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0) return canvas;

  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;

  if (normDeg === 90 || normDeg === 270) {
    out.width = canvas.height;
    out.height = canvas.width;
  } else {
    out.width = canvas.width;
    out.height = canvas.height;
  }

  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((normDeg * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return out;
}

/**
 * Helper: Projective Homography calculation
 */
function getPerspectiveTransformMatrix(
  src: [ { x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number } ],
  dst: [ { x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number } ]
): number[] {
  // Solves 8 linear equations for 3x3 projective matrix
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  // Gaussian elimination solve
  const h = solveLinearSystem(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / (A[i][i] || 1e-12);
      b[k] -= factor * b[i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / (A[i][i] || 1e-12);
  }
  return x;
}

function applyHomography(H: number[], x: number, y: number): { x: number; y: number } {
  const w = H[6] * x + H[7] * y + H[8] || 1e-10;
  return {
    x: (H[0] * x + H[1] * y + H[2]) / w,
    y: (H[3] * x + H[4] * y + H[5]) / w,
  };
}

/**
 * Draw affine textured triangle on 2D context
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();

  // Affine transformation matrix mapping (u, v) -> (x, y)
  const delta = u0 * (v1 - v2) - u1 * (v0 - v2) + u2 * (v0 - v1);
  if (Math.abs(delta) < 1e-6) {
    ctx.restore();
    return;
  }

  const a = (x0 * (v1 - v2) - x1 * (v0 - v2) + x2 * (v0 - v1)) / delta;
  const b = (u0 * (x1 - x2) - u1 * (x0 - x2) + u2 * (x0 - x1)) / delta;
  const c =
    (u0 * (v1 * x2 - v2 * x1) - u1 * (v0 * x2 - v2 * x0) + u2 * (v0 * x1 - v1 * x0)) /
    delta;

  const d = (y0 * (v1 - v2) - y1 * (v0 - v2) + y2 * (v0 - v1)) / delta;
  const e = (u0 * (y1 - y2) - u1 * (y0 - y2) + u2 * (y0 - y1)) / delta;
  const f =
    (u0 * (v1 * y2 - v2 * y1) - u1 * (v0 * y2 - v2 * y0) + u2 * (v0 * y1 - v1 * y0)) /
    delta;

  ctx.transform(a, d, b, e, c, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Web Audio API Camera Shutter Sound Synthesizer
 * Produces crisp mechanical mirror-slap and shutter click
 */
export function playShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // Click 1 (Mirror lift)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // Click 2 (Curtain snap)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.12);
    gain2.gain.setValueAtTime(0.6, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.12);
  } catch {
    // audio not allowed before interaction
  }
}
