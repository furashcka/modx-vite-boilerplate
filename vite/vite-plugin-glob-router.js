import path from "path";
import fs from "fs";
import glob from "glob";
import minimatch from "minimatch";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteGlobRouter({ targets }) {
  return {
    name: "vite-plugin-glob-router",

    configResolved(config) {
      setViteConfig(config);
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [fileURL, query] = req.url.split("?");
        const foundTarget = findTarget(targets, fileURL);
        if (!foundTarget) return next();

        const destFileURL = resolveDestURL(foundTarget, fileURL);
        if (!destFileURL) return next();

        req.url = !query ? destFileURL : `${destFileURL}?${query}`;

        next();
      });
    },
  };
}

function findTarget(targets, fileURL) {
  for (const target of targets) {
    const isMatch = minimatch(
      path.posix.normalize("/" + fileURL),
      path.posix.normalize("/" + target.src),
    );

    if (isMatch) return target;
  }

  return null;
}

function resolveDestURL(target, fileURL) {
  const viteConfig = getViteConfig();
  const startSrc = extractGlob(target.src, "**/", "start");
  const startDest = extractGlob(target.dest, "**/", "start");

  fileURL = fileURL.replace(startSrc, startDest);
  fileURL = !fileURL.startsWith("/") ? fileURL : fileURL.substring(1);

  const fileDest = path.resolve(viteConfig.root, fileURL);
  if (fs.existsSync(fileDest)) return `/${fileURL}`;

  const extensions = extractGlob(target.dest, "/**/*.", "end");
  const parsedFile = path.parse(fileDest);
  const fileGlob = `${parsedFile.dir}/${parsedFile.name}.${extensions}`;

  const [foundFile] = glob.sync(fileGlob);
  if (!foundFile) return null;

  fileURL = path.relative(viteConfig.root, foundFile);

  return `/${fileURL}`;
}

function extractGlob(str, delimiter, pos = "end") {
  const arr = str.split(delimiter);
  const i = pos === "start" ? 0 : 1;

  return arr[i];
}
