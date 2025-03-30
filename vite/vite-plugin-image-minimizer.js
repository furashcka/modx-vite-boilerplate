import path from "node:path";
import { promises as fs } from "node:fs";
import glob from "glob";
import sharp from "sharp";
import { optimize } from "svgo";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteImageMinimizer({
  targets = [],
  png = { quality: 80 },
  jpeg = { quality: 80 },
  webp = { quality: 80 },
  svgo = {},
} = {}) {
  return {
    name: "vite-plugin-image-minimizer",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle() {
      const webpPromise = processImages(
        targets,
        "**/*.{png,jpg,jpeg}",
        "webp",
        async (src, dest) => {
          await sharp(src).webp(webp).toFile(dest);
        },
      );
      const pngPromise = processImages(
        targets,
        "**/*.png",
        "png",
        async (src, dest) => {
          await sharp(src).png(png).toFile(dest);
        },
      );
      const jpegPromise = processImages(
        targets,
        "**/*.jpeg",
        "jpeg",
        async (src, dest) => {
          await sharp(src).jpeg(jpeg).toFile(dest);
        },
      );
      const jpgPromise = processImages(
        targets,
        "**/*.jpg",
        "jpg",
        async (src, dest) => {
          await sharp(src).jpeg(jpeg).toFile(dest);
        },
      );
      const svgPromise = processImages(
        targets,
        "**/*.svg",
        "svg",
        async (src, dest) => {
          const content = await fs.readFile(src, "utf8");
          const result = optimize(content, svgo);

          await fs.writeFile(dest, result.data, "utf8");
        },
      );

      await Promise.all([
        webpPromise,
        pngPromise,
        jpegPromise,
        jpgPromise,
        svgPromise,
      ]);
    },
  };
}

async function processImages(targets, pattern, ext, processor) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, pattern, ext);
  const promises = files.map(async ({ src, dest }) => {
    const resolvedDest = path.resolve(viteConfig.build.outDir, dest);
    await fs.mkdir(path.dirname(resolvedDest), { recursive: true });
    await processor(src, resolvedDest);
  });

  await Promise.all(promises);
}

function getTargetsFiles(targets, srcEnd, destExt) {
  const files = [];

  targets.forEach((target) => {
    const foundFiles = glob.sync(path.join(target.src, srcEnd));

    foundFiles.forEach((fileSrc) => {
      files.push({
        src: fileSrc,
        dest: resolveFileDest(target, fileSrc, destExt),
      });
    });
  });

  return files;
}

function resolveFileDest(target, fileSrc, ext) {
  let fileDest = fileSrc.replace(target.src, "");
  fileDest = path.join(target.dest, fileDest);
  fileDest = fileDest.startsWith("/") ? fileDest.substring(1) : fileDest;

  const parsedPath = path.parse(fileDest);
  return `${parsedPath.dir}/${parsedPath.name}.${ext}`;
}
