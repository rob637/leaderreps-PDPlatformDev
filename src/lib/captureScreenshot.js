/**
 * Capture a screenshot of the current viewport as a JPEG data URL.
 * Returns null on failure (never throws — screenshot is best-effort).
 *
 * Uses html-to-image (SVG foreignObject + canvas) which handles modern
 * CSS (gradients, oklch, filters) far better than html2canvas.
 * Dynamic-imported so it doesn't bloat the main bundle.
 */
export async function captureScreenshot({
  quality = 0.7,
  maxWidth = 1600,
} = {}) {
  try {
    const { toJpeg } = await import('html-to-image');

    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const dataUrl = await toJpeg(document.body, {
      quality,
      backgroundColor: '#ffffff',
      width,
      height,
      pixelRatio,
      cacheBust: false,
      // Skip inlining web fonts \u2014 they're cross-origin (Google Fonts)
      // and blocked by CSP. Browser falls back cleanly; avoids noisy
      // CORS / CSP console errors during capture.
      skipFonts: true,
      // Skip elements that commonly break capture (cross-origin iframes,
      // the bug-report button itself, etc.)
      filter: (node) => {
        if (!node || !node.tagName) return true;
        const tag = node.tagName.toLowerCase();
        if (tag === 'iframe') return false;
        return true;
      },
      style: {
        // Pin to current scroll position
        transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
        transformOrigin: 'top left',
      },
    });

    // Downscale if necessary
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return null;
    }
    const naturalWidth = width * pixelRatio;
    if (naturalWidth <= maxWidth) return dataUrl;

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = maxWidth / img.width;
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch (err) {
    console.warn('Screenshot capture failed:', err);
    return null;
  }
}

/**
 * Convert a data URL (e.g. from captureScreenshot) into a Blob suitable
 * for uploading to Firebase Storage.
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const [meta, b64] = dataUrl.split(',');
  if (!b64) return null;
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
