import path from "path";
import globParent from "glob-parent";

export default function globProxyURL(src, dest, url) {
  const normalize = (p) => path.posix.normalize(p).replace(/^\//, "");
  const normalizedSrc = normalize(src);
  const normalizedUrl = normalize(url);
  const normalizedDest = normalize(globParent(dest));

  if (!normalizedUrl.startsWith(normalizedSrc)) return null;

  const relativePath = path.posix.relative(normalizedSrc, normalizedUrl);

  return "/" + path.posix.join(normalizedDest, relativePath);
}
