import { resolve } from "path";
import glob from "glob";
import { defineConfig } from "vite";

import viteModxFrontendCopy from "./vite/vite-plugin-modx-frontend-copy.js";
import viteModxBackendCopy from "./vite/vite-plugin-modx-backend-copy.js";

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
    viteModxBackendCopy({
      // Don't forget to update absolute path to modx root
      root: "./dist",
      targets: [
        {
          src: "components/**/*.tpl",
          dest: "core/elements/components",
        },
        {
          src: "layouts/**/*.tpl",
          dest: "core/elements/layouts",
        },
        {
          src: "pages/**/*.tpl",
          dest: "core/elements/pages",
          // Nested directories will not be copied.
          flat: true,
        },
        {
          src: "root/core/elements/configs/**/*",
          dest: "core/elements/configs",
        },
        {
          src: "root/core/elements/plugins/**/*",
          dest: "core/elements/plugins",
        },
        {
          src: "root/core/elements/snippets/**/*",
          dest: "core/elements/snippets",
        },
        {
          src: "root/.htaccess",
          dest: "",
        },
      ],
      clearCache: true,
      liveReload: true,
    }),
  ],
});
