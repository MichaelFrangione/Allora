import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node", // hook tests opt into jsdom via @vitest-environment pragma
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
