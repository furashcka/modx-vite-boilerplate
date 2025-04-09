import path from "node:path";
import fs from "node:fs/promises";
import glob from "glob";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModxFavicon() {
  return {
    name: "vite-plugin-strip-tpl-comments",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      const viteConfig = getViteConfig();
      const src = path.join(viteConfig.build.outDir, "**/*.tpl");
      const files = glob.sync(src, { nodir: true });
      const promises = files.map(async (fileSrc) => {
        let content = await fs.readFile(fileSrc, "utf8");

        /* Remove lines that are entirely comments */
        content = content
          // Split lines considering Windows & Unix line endings
          .split(/\r?\n/)
          // Filter out comment-only lines
          .filter((line) => !/^\s*<!--.*?-->\s*$/.test(line))
          .join("\n");

        // Remove any remaining inline comments
        content = content.replace(/<!--[\s\S]*?-->/g, "");

        await fs.writeFile(fileSrc, content, "utf8");
      });

      await Promise.all(promises);
    },
  };
}
