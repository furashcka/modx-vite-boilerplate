import { resolve, relative } from "path";

export default function getFileDest({ fileSrc, src, dest, root } = {}) {
  const globSymbols = ["*", "?", "["];
  const indices = globSymbols
    .map((symbol) => src.indexOf(symbol))
    .filter((index) => index >= 0);
  const firstIndex = indices.length ? Math.min(...indices) : Infinity;
  const srcBase = firstIndex === Infinity ? src : src.slice(0, firstIndex);

  const srcBasePath = resolve(root, srcBase);
  const relativeFilePath = relative(srcBasePath, fileSrc);

  return resolve(root, dest, relativeFilePath);
}
