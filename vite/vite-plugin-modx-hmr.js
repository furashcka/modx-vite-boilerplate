import path from "node:path";
import fs from "node:fs/promises";

import { getViteConfig, setViteConfig } from "./utils/viteConfig.js";
import eventBus from "./utils/eventBus.js";

export default function viteModxHMR({
  root = "dist-modx",
  baseJS = "common/js/base.js",
}) {
  return {
    name: "vite-plugin-modx-hmr",

    configResolved(config) {
      setViteConfig(config);

      eventBus.on(
        "vite-plugin-modx:files-copied",
        async ({ watcherEvent, files }) => {
          if (!["first-start", "add", "change"].includes(watcherEvent)) return;

          await injectHelpersCode(root, files);
        },
      );
    },

    transform(code, id) {
      if (id.endsWith(baseJS)) {
        return {
          code: `
              ${code}
              if (import.meta.env.MODE === "development") {
                import.meta.hot.accept();
                import.meta.glob("@/components/**/*.tpl", { eager: true });
                import("@/vite/modx/mhr-tpl-client.js");
              }
          `,
          map: null,
        };
      }

      if (id.endsWith(".tpl")) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      }
    },

    async handleHotUpdate({ file, modules, read, server }) {
      if (!file.endsWith(".tpl")) return modules;

      const viteConfig = getViteConfig();
      const content = await read();

      if (
        file.includes("layouts/") ||
        file.includes("pages/") ||
        containsFenomSyntax(content)
      ) {
        server.ws.send({ type: "full-reload" });
        return modules;
      }

      await server.ws.send({
        type: "custom",
        event: "tpl-changed",
        data: {
          src: path.relative(viteConfig.root, file),
          content,
        },
      });

      return modules;
    },
  };
}

// Needs for HMR
async function injectHelpersCode(root, files) {
  const viteConfig = getViteConfig();
  const fileComponentHandler = async (fileSrc, fileDest) => {
    const start = `<!-- begin ${fileDest} -->`;
    const end = `<!-- end ${fileDest} -->`;

    let content = await fs.readFile(fileSrc, "utf-8");
    content = content.replace(start, "").replace(end, "");
    content = `${start}\n${content}\n${end}`;

    await fs.writeFile(fileSrc, content);
  };
  const fileLayoutHandler = async (fileSrc) => {
    let content = await fs.readFile(fileSrc, "utf-8");
    content = content.replace(
      `</head>`,
      `
        {ignore}
        <scirpt type="module" src="/@vite/client"></scirpt>
        <script type="module">
          window.__VITE_MODX__ = window.__VITE_MODX__ || {};
          window.__VITE_MODX__.resource_id = [[*id]];
          window.__VITE_MODX__.viteRoot = "${viteConfig.root}";
        </script>
        {/ignore}
      </head>
    `,
    );

    await fs.writeFile(fileSrc, content);
  };

  files = files.filter((file) => file.endsWith(".tpl"));
  files.forEach((fileAbsoluteDest) => {
    if (fileAbsoluteDest.includes("components/")) {
      const fileRelativeDest = path.relative(
        path.resolve(root, "core/elements"),
        fileAbsoluteDest,
      );

      fileComponentHandler(fileAbsoluteDest, fileRelativeDest);
    }

    if (fileAbsoluteDest.includes("layouts/")) {
      fileLayoutHandler(fileAbsoluteDest);
    }
  });
}

function containsFenomSyntax(content) {
  const fenomPatterns = [
    /{[^}]*\$[^}]*}/, // Variables {$var}
    /{if[^}]*}/, // Conditions {if...}
    /{foreach[^}]*}/, // Loops {foreach...}
    /{set[^}]*}/, // Setting variables {set...}
    /{include[^}]*}/, // Includes {include...}
    /{block[^}]*}/, // Blocks {block...}
    /{ignore}/, // Ignored sections
    /{while[^}]*}/, // While loops
    /{\'[^\']*\'\s*\|\s*snippet}/, // Snippet calls {'snippet_name' | snippet}
    /{[^}]*_modx->runSnippet\([^\)]*\)}/, // Snippet calls via API
    /{[^}]*_pls\[[^\]]*\]}/, // Placeholders via _pls
    /{[^}]*_modx->getPlaceholder\([^\)]*\)}/, // Placeholders via API
    /{[^}]*\|[^}]*}/, // Modifiers {$var | modifier}
    /{extends[^}]*}/, // Extends
    /{macro[^}]*}/, // Macros
  ];

  return fenomPatterns.some((pattern) => pattern.test(content));
}
