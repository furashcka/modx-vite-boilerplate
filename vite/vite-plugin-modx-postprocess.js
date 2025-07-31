import path from "node:path";
import fs from "node:fs/promises";
import glob from "glob";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModxPostprocess(args) {
  const { stripComments: isStripComments, manifest } = Object.assign(args, {
    stripComments: true,
    manifest: {
      stripFonts: true,
    },
  });

  return {
    name: "vite-plugin-modx-postprocess",
    apply: "build",

    configResolved(config) {
      setViteConfig(config);
    },

    async closeBundle(output) {
      const viteConfig = getViteConfig();
      const src = path.join(viteConfig.build.outDir, "**/*.tpl");
      const files = glob.sync(src, { nodir: true });
      const spritemapURI = await getSpritemapURI();

      const promises = files.map(async (fileSrc) => {
        let content = await fs.readFile(fileSrc, "utf8");

        content = replaceSvgSpritemap(content, spritemapURI);
        if (isStripComments) content = stripComments(content);

        await fs.writeFile(fileSrc, content, "utf8");
      });

      await Promise.all(promises);
      if (manifest.stripFonts) await manifestStripFonts();
    },
  };
}

async function getSpritemapURI() {
  const viteConfig = getViteConfig();
  const manifestFile = path.join(
    viteConfig.build.outDir,
    "assets/template/manifest.json",
  );

  try {
    const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
    const entry = Object.values(manifest).find(({ src }) => {
      return src === "spritemap.svg";
    });

    return entry.file;
  } catch (e) {
    console.error(e);
  }
}

/*
  .tpl files are not processed by Vite, so vite-plugin-svg-spritemap cannot replace
  "/__spritemap" with the hashed spritemap filename in these templates.
  This function performs that replacement using the URI from the manifest.
*/
function replaceSvgSpritemap(content, spritemapURI) {
  return content.replaceAll("/__spritemap", `/${spritemapURI}`);
}

/* Remove lines that are entirely comments */
function stripComments(content) {
  content = content
    // Split lines considering Windows & Unix line endings
    .split(/\r?\n/)
    // Filter out comment-only lines
    .filter((line) => !/^\s*<!--.*?-->\s*$/.test(line))
    .join("\n");

  // Remove any remaining inline comments
  return content.replace(/<!--[\s\S]*?-->/g, "");
}

/* Remove fonts from manifest.json */
async function manifestStripFonts() {
  const viteConfig = getViteConfig();
  const outDir = viteConfig.build?.outDir ?? "dist";
  const manifestRelPath = viteConfig.build?.manifest ?? "manifest.json";
  const manifestPath = path.join(outDir, manifestRelPath);

  const FONT_EXTENSIONS = [".woff", ".woff2", ".ttf", ".otf", ".eot"];

  const hasFontExtension = (filename) => {
    if (!filename) return false;
    const lowercaseFilename = filename.toLowerCase();
    return FONT_EXTENSIONS.some((ext) => lowercaseFilename.endsWith(ext));
  };

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestContent);

    const filteredManifest = Object.fromEntries(
      Object.entries(manifest)
        .filter(
          ([key, value]) =>
            !hasFontExtension(key) && !hasFontExtension(value?.src),
        )
        .map(([key, value]) => {
          if (value?.assets && Array.isArray(value.assets)) {
            return [
              key,
              {
                ...value,
                assets: value.assets.filter(
                  (asset) => !hasFontExtension(asset),
                ),
              },
            ];
          }
          return [key, value];
        }),
    );

    await fs.writeFile(
      manifestPath,
      JSON.stringify(filteredManifest, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("Failed to strip fonts from manifest:", error);
  }
}
