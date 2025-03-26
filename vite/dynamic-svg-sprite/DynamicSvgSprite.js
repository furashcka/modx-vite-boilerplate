export default class DynamicSvgSprite {
  static #counter = 0;
  #contents = {};
  #sprite = null;

  constructor() {
    this.#sprite = this.#createSprite();
  }

  #createSprite() {
    const id = `dss-id-${DynamicSvgSprite.#counter++}`;
    const sprite = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    sprite.setAttribute("id", id);
    sprite.style.display = "none";
    document.body.appendChild(sprite);

    return sprite;
  }

  // Creates/updates a sprite
  update(parentEl) {
    const useElements = parentEl.querySelectorAll(
      "svg:not(.dss-done) > use[href]",
    );

    useElements.forEach(async (useEl) => {
      const svgEl = useEl.parentElement;
      const url = useEl.getAttribute("href").replace("#", "");

      // Svg has already been uploaded at this url
      if (this.#contents[url]) {
        this.#svgDone(svgEl, this.#contents[url]);
        return;
      }

      this.#contents[url] = await this.#fetchSvg(url);
      // TODO: Fill in this.#sprite using DocumentFragment
      this.#sprite.insertAdjacentHTML("afterbegin", this.#contents[url].symbol);
      this.#svgDone(svgEl, this.#contents[url]);
    });
  }

  // Svg processed
  #svgDone(svgEl, content) {
    if (!svgEl.width && content.width) {
      svgEl.setAttribute("width", content.width);
    }

    if (!svgEl.height && content.height) {
      svgEl.setAttribute("height", content.height);
    }

    if (!svgEl.hasAttribute("viewBox") && content.viewBox) {
      svgEl.setAttribute("viewBox", content.viewBox);
    }

    svgEl.classList.add("ready");
  }

  async #fetchSvg(_url) {
    const url = new URL(_url, window.location.href);
    const version = import.meta.env.VERSION;

    if (version) url.searchParams.append("v", version);

    const jsonURL = `${url.origin}${url.pathname}.json${url.search}`;
    const svgURL = url.toString();

    // Attempt load .json created from .svg
    try {
      const jsonResponse = await fetch(jsonURL);
      if (jsonResponse.ok) return await jsonResponse.json();
    } catch (e) {
      console.error("DynamicSvgSprite:", e, jsonURL);
    }

    // Attempt load .svg
    try {
      const svgResponse = await fetch(svgURL);
      if (!svgResponse.ok) return "";

      return this.#parseSvg({
        url: svgURL,
        text: await svgResponse.text(),
      });
    } catch (e) {
      console.error("DynamicSvgSprite:", e, svgURL);
    }

    return "";
  }

  #parseSvg({ url, text }) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(text, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");
    const width = svgElement.getAttribute("width");
    const height = svgElement.getAttribute("height");
    const viewBox = svgElement.getAttribute("viewBox");

    let symbolAttrs = ` id="${url}"`;
    if (viewBox) symbolAttrs += ` viewBox="${viewBox}"`;

    return {
      width,
      height,
      viewBox,
      symbol: `<symbol${symbolAttrs}>${svgElement.innerHTML}</symbol>`,
    };
  }
}
