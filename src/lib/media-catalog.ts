// Vite resolves bundled media at build time, including files absent from database rows.
const pointers = import.meta.glob<{ url: string }>("/src/assets/*.asset.json", { eager: true, import: "default" });
const bundled = import.meta.glob<string>("/src/assets/*.{jpg,png,webp,svg,mp4,webm}", { eager: true, query: "?url", import: "default" });

export const bundledMediaUrls = [...new Set([
  ...Object.entries(pointers).filter(([name]) => !name.endsWith("objekthaus-eye.png.asset.json") && !name.endsWith("craft-plane.mp4.asset.json")).map(([, asset]) => asset.url),
  ...Object.values(bundled),
])];