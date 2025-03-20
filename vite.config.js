import { resolve } from "path";
import glob from "glob";
import { defineConfig } from "vite";

import viteModxFrontendCopy from "./vite/vite-plugin-modx-frontend-copy.js";

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
  plugins: [
    viteModxFrontendCopy({
      targets: [
        {
          src: "components/**/*.!(scss|tpl|js)",
          dest: "assets/template/components",
        },
      ],
    }),
  ],
});
