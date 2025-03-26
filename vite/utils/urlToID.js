export default function urlToID(url) {
  url = url.replace(/^[a-zA-Z]+:\/\/[^\/]+/, "");
  url = url.split("?")[0];
  url = url.replace(/[^a-zA-Z0-9]/g, "");

  return url;
}
