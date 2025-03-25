import { instance as dynamicSvgSprite } from "virtual:dynamic-svg-sprite";

document.addEventListener("DOMContentLoaded", () => {
  dynamicSvgSprite.update(document.body);
});
