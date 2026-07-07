import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Allora — Italian practice",
    short_name: "Allora",
    description: "Duolingo-style Italian practice scoped to your class material.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#faf6ec", // warm cream, matches --background
    theme_color: "#faf6ec",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" }, // rounded (splash + `any`)
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }, // rounded (splash + `any`)
      // Full-bleed square: the OS applies its own adaptive mask, so this one must NOT be rounded.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
