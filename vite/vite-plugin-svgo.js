import path from "path";
import glob from "glob";
import { promises as fs } from "fs";
import { optimize } from "svgo";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteSvgo({ config = {} } = {}) {
  return {
    name: "vite-plugin-svgo",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      const viteConfig = getViteConfig();
      const outDir = viteConfig.build.outDir;
      const src = path.join(outDir, "**/*.svg");
      const files = glob.sync(src, { nodir: true });
      const promises = files.map(async (fileSrc) => {
        const content = await fs.readFile(fileSrc, "utf8");
        const svgoResult = optimize(content, { ...config, path: fileSrc });
        const optimizedContent = svgoResult.data;

        await fs.writeFile(fileSrc, optimizedContent, "utf8");
      });

      await Promise.all(promises);
    },
  };
}
