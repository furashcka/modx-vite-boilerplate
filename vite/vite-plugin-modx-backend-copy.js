import path from "node:path";
import fs from "node:fs/promises";
import minimatch from "minimatch";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModxBackendCopy({
  root = "dist-modx",
  targets = [],
  clearCache = true,
  liveReload = true,
} = {}) {
  return {
    name: "vite-plugin-modx-backend-copy",

    configResolved(config) {
      setViteConfig(config);
    },

    configureServer(server) {
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
