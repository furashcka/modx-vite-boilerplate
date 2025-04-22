import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import minimatch from "minimatch";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";
import eventBus from "./utils/eventBus.js";

export default function viteModx({
  root = "dist-modx",
  targets = [],
  clearCache = true,
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
      const copyFileHandler = async (src, watcherEvent) => {
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
        const files = await cpy(target.src, dest, {
          flat,
          filter: (file) => file.path === src,
        });
        eventBus.emit("vite-plugin-modx:files-copied", {
          watcherEvent,
          files,
        });

        if (clearCache) await fs.rm(cache, { recursive: true, force: true });
      };

      // Copies all files, once
      const promises = targets.map(async (target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(root, target.dest);
        const { flat = false } = target;

        let files = await cpy(src, dest, { flat });
        eventBus.emit("vite-plugin-modx:files-copied", {
          watcherEvent: "first-start",
          files,
        });
      });

      await Promise.all(promises);
      await phpViteDevMode(root, true);
      await fs.rm(cacheDir, { recursive: true, force: true });

      server.watcher.on("add", (src) => copyFileHandler(src, "add"));
      server.watcher.on("change", (src) => copyFileHandler(src, "change"));
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
