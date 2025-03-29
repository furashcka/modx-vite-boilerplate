import path from "path";
import glob from "glob";
import { promises as fs } from "fs";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModxFavicon() {
  return {
    name: "vite-plugin-strip-tpl-comments",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      const viteConfig = getViteConfig();
      const outDir = viteConfig.build.outDir;
      const src = path.join(outDir, "**/*.tpl");
      const files = glob.sync(src, { nodir: true });

      for (const file of files) {
        try {
          let content = await fs.readFile(file, "utf8");

          /* Remove lines that are entirely comments */
          content = content
            // Split lines considering Windows & Unix line endings
            .split(/\r?\n/)
            // Filter out comment-only lines
            .filter((line) => !/^\s*<!--.*?-->\s*$/.test(line))
            .join("\n");

          // Remove any remaining inline comments
          content = content.replace(/<!--[\s\S]*?-->/g, "");

          await fs.writeFile(file, content, "utf8");
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
    },
  };
}
