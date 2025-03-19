import { resolve } from "path";
import glob from "glob";
import { defineConfig } from "vite";

const root = resolve(__dirname, "./");
const input = glob.sync("./pages/**/*.js");

export default defineConfig({
  root,
  publicDir: "./root",
  resolve: {
    alias: { "@": root },
  },
  server: {
    origin: "http://localhost:5173",
    cors: true,
    strictPort: true,
  },
  build: {
    outDir: "./dist",
    assetsDir: "assets/template",
    manifest: "assets/template/manifest.json",
    rollupOptions: { input },
  },
  plugins: [],
});
