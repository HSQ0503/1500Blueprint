import { toBlob, toPng } from "html-to-image";

const pngOptions = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "#ffffff",
  preferredFontFormat: "woff2" as const,
};

export async function renderNodeToPngBlob(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await toPng(node, pngOptions);
  const blob = await toBlob(node, pngOptions);
  if (!blob) throw new Error("PNG rendering returned no image");
  return blob;
}

export async function copyNodeAsPng(node: HTMLElement): Promise<void> {
  const blob = await renderNodeToPngBlob(node);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

// Capture a DOM node as a PNG and trigger a download. Client-only (touches the
// DOM). Uses SVG <foreignObject> serialization so Tailwind v4 output (oklch,
// custom props) and KaTeX spans come through faithfully.
export async function downloadNodeAsPng(
  node: HTMLElement,
  fileName = "question.png",
): Promise<void> {
  // First call can drop just-loaded web fonts (a known html-to-image timing
  // quirk); render once to warm the font cache, then capture for real.
  await document.fonts.ready;
  await toPng(node, pngOptions);
  const dataUrl = await toPng(node, pngOptions);

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
