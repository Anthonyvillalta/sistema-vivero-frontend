const WHITE_SUM_TOLERANCE = 120;
const FEATHER_TOLERANCE = 200;

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const isNearWhite = (r: number, g: number, b: number, tolerance: number) =>
  (255 - r) + (255 - g) + (255 - b) <= tolerance;

const hasTransparency = (img: HTMLImageElement): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0);
  try {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
};

const hasWhiteBackground = (imageData: ImageData): boolean => {
  const { data, width: w, height: h } = imageData;
  const border = Math.max(4, Math.floor(Math.min(w, h) * 0.02));
  let total = 0;
  let white = 0;
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    total++;
    if (isNearWhite(data[i], data[i + 1], data[i + 2], WHITE_SUM_TOLERANCE)) white++;
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < border; y++) {
      sample(x, y);
      sample(x, h - 1 - y);
    }
  }
  for (let y = border; y < h - border; y++) {
    for (let x = 0; x < border; x++) {
      sample(x, y);
      sample(w - 1 - x, y);
    }
  }
  return total > 0 && white / total >= 0.6;
};

const removeWhiteBackground = (imageData: ImageData) => {
  const { data, width: w, height: h } = imageData;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    const p = i * 4;
    if (isNearWhite(data[p], data[p + 1], data[p + 2], WHITE_SUM_TOLERANCE)) {
      queue[tail++] = i;
    }
  };

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i / w) | 0;
    data[i * 4 + 3] = 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  const soften = () => {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (copy[i + 3] === 0) continue;
        const sum = (255 - copy[i]) + (255 - copy[i + 1]) + (255 - copy[i + 2]);
        if (sum > WHITE_SUM_TOLERANCE && sum <= FEATHER_TOLERANCE) {
          const hasTransparentNeighbor =
            (x > 0 && copy[((y * w + x - 1) * 4) + 3] === 0) ||
            (x < w - 1 && copy[((y * w + x + 1) * 4) + 3] === 0) ||
            (y > 0 && copy[(((y - 1) * w + x) * 4) + 3] === 0) ||
            (y < h - 1 && copy[(((y + 1) * w + x) * 4) + 3] === 0);
          if (hasTransparentNeighbor) {
            const t = (sum - WHITE_SUM_TOLERANCE) / (FEATHER_TOLERANCE - WHITE_SUM_TOLERANCE);
            data[i + 3] = Math.round(Math.max(0, Math.min(1, t)) * 255);
          }
        }
      }
    }
  };

  soften();
  soften();
};

const toTransparentPng = (img: HTMLImageElement): string | null => {
  if (hasTransparency(img)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (hasWhiteBackground(imageData)) {
    removeWhiteBackground(imageData);
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas.toDataURL('image/png');
};

export const processProductImage = async (file: File): Promise<string> => {
  const original = await readFileAsDataURL(file);
  try {
    const img = await loadImage(original);
    return toTransparentPng(img) ?? original;
  } catch {
    return original;
  }
};

export const processProductImageUrl = async (src: string): Promise<string> => {
  try {
    const img = await loadImage(src);
    return toTransparentPng(img) ?? src;
  } catch {
    return src;
  }
};
