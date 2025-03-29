import path from "path";
import fs from "fs";
import glob from "glob";
import { optimize } from "svgo";

import { getViteConfig, setViteConfig } from "../utils/viteConfig.js";
import getFileDest from "../utils/getFileDest.js";
import urlToID from "../utils/urlToID.js";

export default function viteDynamicSvgSprite({ targets = [], svgo = {} } = {}) {
  return {
    name: "vite-plugin-dynamic-svg-sprite",

    resolveId(id) {
      return id === "virtual:dynamic-svg-sprite" ? id : null;
    },

    load(id) {
      if (id === "virtual:dynamic-svg-sprite") {
        const DynamicSvgSprite = fs.readFileSync(
          path.resolve(__dirname, "./DynamicSvgSprite.js"),
          "utf-8",
        );

        return `
          ${DynamicSvgSprite}

          const instance = new DynamicSvgSprite();

          export { instance, DynamicSvgSprite };
        `;
      }

      return null;
    },

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      const viteConfig = getViteConfig();

      targets.forEach((target) => {
        const src = path.resolve(viteConfig.root, target.src);
        const dest = path.resolve(
          viteConfig.root,
          viteConfig.build.outDir,
          target.dest,
        );
        const files = glob.sync(src, { ignore: target.ignore });

        files.forEach((fileSrc) => {
          const content = fs.readFileSync(fileSrc, "utf-8");
          const widthMatch = content.match(/width=["']([^"']*)["']/);
          const heightMatch = content.match(/height=["']([^"']*)["']/);
          const viewBoxMatch = content.match(/viewBox=["']([^"']*)["']/);

          const width = widthMatch ? parseInt(widthMatch[1]) : null;
          const height = heightMatch ? parseInt(heightMatch[1]) : null;
          const viewBox = viewBoxMatch ? viewBoxMatch[1] : null;
          const svgoResult = optimize(content, { ...svgo, path: fileSrc });
          const optimizedContent = svgoResult.data;

          const innerContentMatch = optimizedContent.match(
            /<svg[^>]*>([\s\S]*)<\/svg>/i,
          );
          const optimizedInnerContent =
            innerContentMatch && innerContentMatch[1]
              ? innerContentMatch[1].trim()
              : "";
          const fileDest = getFileDest({
            fileSrc,
            src,
            dest,
            root: viteConfig.root,
          });
          const id = urlToID(
            "/" + path.relative(viteConfig.build.outDir, fileDest),
          );

          let symbolAttrs = ` id="dss-${id}"`;
          if (viewBox) symbolAttrs += ` viewBox="${viewBox}"`;

          const jsonContent = {
            id,
            width,
            height,
            viewBox,
            symbol: `<symbol${symbolAttrs}>${optimizedInnerContent}</symbol>`,
          };

          fs.mkdirSync(path.dirname(fileDest), { recursive: true });
          fs.writeFileSync(`${fileDest}.json`, JSON.stringify(jsonContent));
        });
      });
    },
  };
}
