import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "app" ? "./" : "/",
  define: { __APP_BUILD__: JSON.stringify(mode === "app") },
  build: {
    target: "es2022",
    sourcemap: false,
    emptyOutDir: true
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/target/**", "**/dist/**", "**/test-results/**"] }
  }
}));
