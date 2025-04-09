import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import minimatch from "minimatch";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModx({
  root = "dist-modx",
  targets = [],
  clearCache = true,
  liveReload = true,
} = {}) {
  const templatesDir = path.resolve(root, "assets/template");
  const elementsDir = path.resolve(root, "core/elements");
  const cacheDir = path.resolve(root, "core/cache");

  return {
    name: "vite-plugin-modx",

    configResolved(config) {
      setViteConfig(config);
    },

    async configureServer(server) {
      const viteConfig = getViteConfig();
      const cache = path.resolve(root, "core/cache");
      const copyFileHandler = async (src) => {
        const target = getMatchedTarget({ targets, file: src });
        if (!target) return;

        const dest = path.resolve(root, target.dest);
        const { flat = false } = target;

        /*
          To preserve the directory structure when copying,
          cpy expects a glob pattern, which is why we have
          to use a stupid filter solution.
        */
        // TODO: Optimize so that copying takes place in one operation.
        cpy(target.src, dest, {
          flat,
          filter: (file) => file.path === src,
        });

        if (clearCache) await fs.rm(cache, { recursive: true, force: true });
        if (liveReload) server.ws.send({ type: "full-reload", path: "*" });
      };

      // Copies all files, once
      targets.forEach((target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(root, target.dest);
        const { flat = false } = target;

        cpy(src, dest, { flat });
      });

      server.watcher.on("add", copyFileHandler);
      server.watcher.on("change", copyFileHandler);

      await fs.rm(cacheDir, { recursive: true, force: true });
      await htaccessProxy(root, true);
      await phpViteDevMode(root, true);
    },

    async writeBundle() {
      const viteConfig = getViteConfig();
      const promises = [];

      targets.forEach((target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(
          viteConfig.root,
          viteConfig.build.outDir,
          target.dest,
        );
        const { flat = false } = target;

        promises.push(cpy(src, dest, { flat }));
      });

      await Promise.all(promises);
    },

    async closeBundle() {
      const viteConfig = getViteConfig();

      await Promise.all([
        fs.rm(templatesDir, { recursive: true, force: true }),
        fs.rm(elementsDir, { recursive: true, force: true }),
        fs.rm(cacheDir, { recursive: true, force: true }),
      ]);

      await cpy(`${viteConfig.build.outDir}/**/*`, root);
      await htaccessProxy(root, false);
      await phpViteDevMode(root, false);
    },
  };
}

function getMatchedTarget({ targets, file } = {}) {
  const viteConfig = getViteConfig();

  for (const target of targets) {
    const isMatch = minimatch(file, path.resolve(viteConfig.root, target.src));
    if (isMatch) return target;
  }

  return null;
}

async function htaccessProxy(root, isEnable) {
  const fileSrc = `${root}/.htaccess`;
  if (!existsSync(fileSrc)) return;

  const viteConfig = getViteConfig();
  const rule = [
    `# Vite proxy, this is only for development mode.`,
    `RewriteCond %{REQUEST_URI} ^/assets/`,
    `RewriteCond %{REQUEST_FILENAME} !-f`,
    `RewriteRule ^assets/(.*)$ ${viteConfig.server.origin}/assets/$1 [P,L]`,
  ].join("\n");
  let content = await fs.readFile(fileSrc, "utf-8");

  if (isEnable) {
    content = content.replace(`RewriteBase /`, `RewriteBase /\n\n${rule}`);
  } else {
    content = content.replace(`\n\n${rule}`, "");
  }

  await fs.writeFile(fileSrc, content);
}

async function phpViteDevMode(root, isEnabled) {
  const fileSrc = `${root}/core/elements/snippets/vite.php`;
  if (!existsSync(fileSrc)) return;

  let content = await fs.readFile(fileSrc, "utf-8");
  content = content.replace(
    /\$is_dev\s*=\s*(true|false)\s*;/,
    `$is_dev = ${isEnabled};`,
  );

  await fs.writeFile(fileSrc, content);
}
