import path from "path";
import fs from "fs";
import { rm } from "fs/promises";
import minimatch from "minimatch";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";
import getFileDest from "./utils/getFileDest.js";

export default function viteModxBackendCopy({
  root: modxRoot = "./dist/tmp",
  targets = [],
  clearCache = true,
  liveReload = true,
} = {}) {
  return {
    name: "vite-plugin-modx-backend-copy",

    async configResolved(config) {
      setViteConfig(config);
    },

    configureServer(server) {
      const viteConfig = getViteConfig();
      const copyFileHandler = (fileSrc) => {
        const target = getMatchedTarget({ targets, file: fileSrc });
        if (!target) return;

        // TODO: Need refactoring
        const fileDest = path.resolve(
          modxRoot,
          path.relative(
            viteConfig.root,
            getFileDest({
              fileSrc,
              src: target.src,
              dest: target.dest,
              root: viteConfig.root,
            }),
          ),
        );

        cpy(fileSrc, path.dirname(fileDest));

        if (clearCache) clearModxCache({ modxRoot });
        if (liveReload) server.ws.send({ type: "full-reload", path: "*" });
      };

      // Copies all files, once
      targets.forEach((target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(modxRoot, target.dest);
        const { flat = false } = target;

        cpy(src, dest, { flat });
      });

      server.watcher.on("add", copyFileHandler);
      server.watcher.on("change", copyFileHandler);
    },

    async writeBundle() {
      const viteConfig = getViteConfig();

      targets.forEach((target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(
          viteConfig.root,
          viteConfig.build.outDir,
          target.dest,
        );
        const { flat = false } = target;

        cpy(src, dest, { flat });
      });
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

async function clearModxCache({ modxRoot }) {
  const cachePath = path.join(modxRoot, "core/cache");

  try {
    if (fs.existsSync(cachePath)) {
      await rm(cachePath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Error clearing MODX cache: ${error.message}`);
  }
}
