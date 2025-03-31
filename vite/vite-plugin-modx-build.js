import path from "path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import cpy from "cpy";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";

export default function viteModxFavicon({ root = "dist-modx" }) {
  const templatesDir = path.resolve(root, "assets/template");
  const elementsDir = path.resolve(root, "core/elements");
  const cacheDir = path.resolve(root, "core/cache");

  return {
    name: "vite-plugin-modx-build",

    configResolved(config) {
      setViteConfig(config);
    },

    async configureServer() {
      await fs.rm(cacheDir, { recursive: true, force: true });
      await htaccessProxy(root, true);
      await phpViteDevMode(root, true);
    },

    async buildEnd() {
      const viteConfig = getViteConfig();

      await Promise.all([
        fs.rm(templatesDir, { recursive: true, force: true }),
        fs.rm(elementsDir, { recursive: true, force: true }),
        fs.rm(cacheDir, { recursive: true, force: true }),
      ]);

      await cpy(`${viteConfig.build.outDir}/**/*`, root);

      await htaccessProxy(root, false);
      await phpViteDevMode(root, false);
    },
  };
}

async function htaccessProxy(root, isEnable) {
  const fileSrc = `${root}/.htaccess`;
  if (!existsSync(fileSrc)) return;

  const viteConfig = getViteConfig();
  const rule = [
    `# Vite proxy, this is only for development mode.`,
    `RewriteCond %{REQUEST_URI} ^/assets/`,
    `RewriteCond %{REQUEST_FILENAME} !-f`,
    `RewriteRule ^assets/(.*)$ ${viteConfig.server.origin}/assets/$1 [P,L]`,
  ].join("\n");
  let content = await fs.readFile(fileSrc, "utf-8");

  if (isEnable) {
    content = content.replace(`RewriteBase /`, `RewriteBase /\n\n${rule}`);
  } else {
    content = content.replace(`\n\n${rule}`, "");
  }

  await fs.writeFile(fileSrc, content);
}

async function phpViteDevMode(root, isEnabled) {
  const fileSrc = `${root}/core/elements/snippets/vite.php`;
  if (!existsSync(fileSrc)) return;

  let content = await fs.readFile(fileSrc, "utf-8");
  content = content.replace(
    /\$is_dev\s*=\s*(true|false)\s*;/,
    `$is_dev = ${isEnabled};`,
  );

  await fs.writeFile(fileSrc, content);
}
