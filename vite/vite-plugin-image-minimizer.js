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
      await Promise.all([
        makeWEBP(targets, webp),
        minimizePNG(targets, png),
        minimizeJPEG(targets, jpeg),
        minimizeJPG(targets, jpeg),
        minimizeSVG(targets, svgo),
      ]);
    },
  };
}

async function makeWEBP(targets, configs) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, "**/*.{png,jpg,jpeg}", "webp");

  const promises = files.map(async ({ src, dest }) => {
    dest = path.resolve(viteConfig.build.outDir, dest);

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(src).webp(configs).toFile(dest);
  });

  await Promise.all(promises);
}

async function minimizePNG(targets, configs) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, "**/*.png", "png");

  const promises = files.map(async ({ src, dest }) => {
    dest = path.resolve(viteConfig.build.outDir, dest);

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(src).png(configs).toFile(dest);
  });

  await Promise.all(promises);
}

async function minimizeJPEG(targets, configs) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, "**/*.jpeg", "jpeg");

  const promises = files.map(async ({ src, dest }) => {
    dest = path.resolve(viteConfig.build.outDir, dest);

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(src).jpeg(configs).toFile(dest);
  });

  await Promise.all(promises);
}

async function minimizeJPG(targets, configs) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, "**/*.jpg", "jpg");

  const promises = files.map(async ({ src, dest }) => {
    dest = path.resolve(viteConfig.build.outDir, dest);

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(src).jpeg(configs).toFile(dest);
  });

  await Promise.all(promises);
}

async function minimizeSVG(targets, config) {
  const viteConfig = getViteConfig();
  const files = getTargetsFiles(targets, "**/*.svg", "svg");

  const promises = files.map(async ({ src, dest }) => {
    const content = await fs.readFile(src, "utf8");
    const svgoResult = optimize(content, { ...config });

    dest = path.resolve(viteConfig.build.outDir, dest);
    await fs.writeFile(dest, svgoResult.data, "utf8");
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
  fileDest = !fileDest.startsWith("/") ? fileDest : fileDest.substring(1);

  const parsedPath = path.parse(fileDest);

  return `${parsedPath.dir}/${parsedPath.name}.${ext}`;
}
