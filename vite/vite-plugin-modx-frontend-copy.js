import path from "path";
import fs from "fs";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";
import globProxyURL from "./utils/globProxyURL.js";

export default function viteModxFrontendCopy({ targets = [] } = {}) {
  return {
    name: "vite-plugin-modx-frontend-copy",

    async configResolved(config) {
      setViteConfig(config);
    },

    configureServer(server) {
      const viteConfig = getViteConfig();

      server.middlewares.use(async (req, res, next) => {
        for (const target of targets) {
          const proxyURL = globProxyURL(target.dest, target.src, req.url);
          if (!proxyURL) continue;

          const fileSrc = viteConfig.root + proxyURL;
          if (!fs.existsSync(fileSrc)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          req.url = proxyURL;
          break;
        }

        next();
      });
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

        cpy(src, dest);
      });
    },
  };
}
