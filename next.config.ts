import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the workspace root to THIS repo. Without it, `next dev` (Turbopack) has
// inferred the parent dir (…/Documents/Allora) as the root and failed to resolve
// `@import "tailwindcss"` from globals.css, so no CSS loaded and the app looked broken.
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
