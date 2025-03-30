import glob from "glob";
import { defineConfig } from "vite";

import viteGlobRouter from "./vite/vite-plugin-glob-router.js";
import viteCopy from "./vite/vite-plugin-copy.js";
import viteModxBackendCopy from "./vite/vite-plugin-modx-backend-copy.js";
import viteImageMinimizer from "./vite/vite-plugin-image-minimizer.js";
import viteDynamicSvgSprite from "./vite/dynamic-svg-sprite/vite-plugin-dynamic-svg-sprite.js";
import viteSimplifiedFavicon from "./vite/vite-plugin-simplified-favicon.js";
import viteStripTplComments from "./vite/vite-plugin-strip-tpl-comments.js";

const root = __dirname;

export default defineConfig({
  root,
  publicDir: "root",
  resolve: {
    alias: { "@": root },
  },
  server: {
    origin: "http://localhost:5173",
    cors: true,
    strictPort: true,
  },
  define: {
    "import.meta.env.VERSION": +new Date(),
  },
  build: {
    outDir: "dist",
    assetsDir: "assets/template",
    manifest: "assets/template/manifest.json",
    rollupOptions: {
      input: glob.sync("pages/**/*.{js,scss}"),
      output: {
        entryFileNames: "assets/template/js/[name]-[hash].js",
        chunkFileNames: "assets/template/js/chunks/[name]-[hash].js",

        assetFileNames(assetInfo) {
          const { name, originalFileName } = assetInfo;

          // Analog entryFileNames & chunkFileNames for .css
          if (name && originalFileName && name.endsWith(".css")) {
            if (originalFileName.match(/^pages\//)) {
              return "assets/template/css/[name]-[hash][extname]";
            }

            return "assets/template/css/chunks/[name]-[hash][extname]";
          }

          return "assets/template/[name]-[hash][extname]";
        },
      },
    },
  },
  plugins: [
    viteGlobRouter({
      targets: [
        {
          src: "assets/template/components/**/*.!(scss|tpl|js|webp)",
          dest: "components/**/*.!(scss|tpl|js|webp)",
        },
        {
          src: "assets/template/components/**/*.{png,jpg,jpeg,webp}",
          dest: "components/**/*.{png,jpg,jpeg,webp}",
        },
        {
          src: "assets/template/**/*.{png,jpg,jpeg,webp}",
          dest: "assets/template/**/*.{png,jpg,jpeg,webp}",
        },
      ],
    }),
    viteCopy({
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
    viteImageMinimizer({
      targets: [
        {
          src: "components",
          dest: "assets/template/components",
        },
        {
          src: "root",
          dest: "",
        },
      ],
    }),
    viteDynamicSvgSprite({
      targets: [
        {
          src: "components/**/*.svg",
          ignore: ["!components/favicon/favicon.svg"],
          dest: "assets/template/components",
        },
        {
          src: "root/**/*.svg",
          dest: "",
        },
      ],
      // svgo runs from viteImageMinimizer
      svgo: false,
    }),
    viteSimplifiedFavicon({
      src: "components/favicon/favicon.svg",
      dest: "assets/template/components/favicon",
    }),
    viteStripTplComments(),
  ],
});
