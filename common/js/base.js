import { instance as dynamicSvgSprite } from "virtual:dynamic-svg-sprite";

document.addEventListener("DOMContentLoaded", () => {
  dynamicSvgSprite.update(document.body);
});

// HOT Reload (dev only)
if (import.meta.hot) import.meta.hot.accept();
