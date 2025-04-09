import path from "path";
import fs from "fs";
import glob from "glob";
import { defineConfig } from "vite";

import viteGlobRouter from "./vite/vite-plugin-glob-router.js";
import viteCopy from "./vite/vite-plugin-copy.js";
import viteImageMinimizer from "./vite/vite-plugin-image-minimizer.js";
import viteDynamicSvgSprite from "./vite/dynamic-svg-sprite/vite-plugin-dynamic-svg-sprite.js";
import viteSimplifiedFavicon from "./vite/vite-plugin-simplified-favicon.js";
import viteStripTplComments from "./vite/vite-plugin-strip-tpl-comments.js";
import viteModx from "./vite/vite-plugin-modx.js";

const viteRoot = __dirname;
// Don't forget to set absolute path to modx root and local modx address.
const modxRoot = "dist-modx";
const modxUrl = "http://localhost/";

export default defineConfig({
  root: viteRoot,
  publicDir: "root",
  resolve: {
    alias: { "@": viteRoot },
  },
  // Before starting dev mode, turn off the vpn, after you can turn on
  server: {
    host: "0.0.0.0",
    proxy: {
      "/": {
        xfwd: true,
        changeOrigin: true,
        target: modxUrl,
        bypass: (req) => {
          if (req.url.match(/^\/(@vite|@id|virtual|node_modules)/)) {
            return req.url;
          }

          const url = path.posix.normalize("/" + req.url.split("?")[0]);

          const isFolder = !path.extname(url);
          if (isFolder) return true;

          const publicDest = path.join(viteRoot, "root", url);
          if (fs.existsSync(publicDest)) return url;

          const rootDest = path.join(viteRoot, url);
          if (fs.existsSync(rootDest)) return url;

          return true;
        },
      },
    },
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
    viteModx({
      root: modxRoot,
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
    }),
  ],
});
