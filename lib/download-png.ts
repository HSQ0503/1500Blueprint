import { toPng } from "html-to-image";

// Capture a DOM node as a PNG and trigger a download. Client-only (touches the
// DOM). Uses SVG <foreignObject> serialization so Tailwind v4 output (oklch,
// custom props) and KaTeX spans come through faithfully.
export async function downloadNodeAsPng(
  node: HTMLElement,
  fileName = "question.png",
): Promise<void> {
  // First call can drop just-loaded web fonts (a known html-to-image timing
  // quirk); render once to warm the font cache, then capture for real.
  const opts = {
    pixelRatio: 2, // crisp on retina
    cacheBust: true,
    backgroundColor: "#ffffff",
    preferredFontFormat: "woff2" as const,
  };
  await toPng(node, opts);
  const dataUrl = await toPng(node, opts);

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
