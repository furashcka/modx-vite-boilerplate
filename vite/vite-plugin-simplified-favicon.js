import path from "path";
import sharp from "sharp";
import ico from "sharp-ico";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteSimplifiedFavicon({ src, dest }) {
  return {
    name: "vite-plugin-simplified-favicon",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      try {
        const viteConfig = getViteConfig();

        await ico.sharpsToIco(
          [sharp(src)],
          path.resolve(viteConfig.build.outDir, dest, "favicon.ico"),
          {
            sizes: [48],
          },
        );
      } catch (error) {
        this.error(`Error generating favicon: ${error.message}`);
      }
    },
  };
}
