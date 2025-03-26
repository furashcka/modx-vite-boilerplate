export default function urlToID(url) {
  return url.replace(/[^a-zA-Z0-9]/g, "");
}
