import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: "./",
  define: { __APP_BUILD__: JSON.stringify(mode === "app") },
  build: {
    target: "es2022",
    sourcemap: false,
    emptyOutDir: true
  },
  server: { port: 1420, strictPort: true }
}));
