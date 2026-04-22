/**
 * Robust PNG export from an HTMLCanvasElement.
 * Uses canvas.toBlob + object URL for reliable downloads across browsers.
 */

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/png',
      0.95,
    );
  });
}

export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const blob = await canvasToPngBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : filename + '.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click cycle to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function canvasToPngDataUrl(
  canvas: HTMLCanvasElement,
): Promise<string> {
  return canvas.toDataURL('image/png', 0.95);
}
