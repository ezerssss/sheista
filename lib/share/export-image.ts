import { toPng } from "html-to-image";

type ExportOpts = {
  width: number;
  height: number;
};

export async function exportNodeToBlob(
  node: HTMLElement,
  opts: ExportOpts,
): Promise<Blob> {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }
  const dataUrl = await toPng(node, {
    width: opts.width,
    height: opts.height,
    pixelRatio: 1,
    cacheBust: true,
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (typeof ClipboardItem === "undefined") return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShareImage(
  blob: Blob,
  filename: string,
  text?: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({
      files: [file],
      text,
    });
    return true;
  } catch (e) {
    // User cancellation throws — treat as not-failure but not-success.
    if ((e as Error).name === "AbortError") return true;
    return false;
  }
}
