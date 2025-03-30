import path from "path";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteCopy({ targets = [] } = {}) {
  return {
    name: "vite-plugin-copy",

    configResolved(config) {
      setViteConfig(config);
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

        promises.push(cpy(src, dest));
      });

      await Promise.all(promises);
    },
  };
}
