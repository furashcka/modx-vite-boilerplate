import urlToID from "@/vite/utils/urlToID.js";

export default class DynamicSvgSprite {
  static #counter = 0;
  #sprite = null;
  #contents = {};
  #observer = null;

  constructor() {
    this.#sprite = this.#createSprite();
  }

  #createSprite() {
    const id = `dss-${DynamicSvgSprite.#counter++}`;
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
  update(parentElement = document.body) {
    const svgElements = parentElement.querySelectorAll(
      "svg[data-src]:not(.dss-done)",
    );

    svgElements.forEach(async (svgElement) => {
      const url = svgElement.getAttribute("data-src");
      const id = urlToID(url);

      if (this.#contents[id]) {
        return this.#svgDone(svgElement, this.#contents[id]);
      }

      this.#contents[id] = await this.#fetchSvg(url);
      // TODO: Fill in this.#sprite using DocumentFragment
      this.#sprite.insertAdjacentHTML("afterbegin", this.#contents[id].symbol);
      this.#svgDone(svgElement, this.#contents[id]);
    });
  }

  updateByDomObserver(parentElement = document.body) {
    if (this.#observer !== null) return;

    let timeoutID = null;
    this.#observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        const isAdded =
          mutation.type === "childList" && mutation.addedNodes.length > 0;
        if (isAdded) continue;

        clearTimeout(timeoutID);
        timeoutID = setTimeout(() => this.update(parentElement));
        break;
      }
    });

    this.#observer.observe(parentElement, { childList: true, subtree: true });
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

    svgEl.innerHTML = `<use href="#dss-${content.id}"></use>`;
    svgEl.classList.add("ready");
  }

  async #fetchSvg(_url) {
    const url = new URL(_url, window.location.href);
    const version = import.meta.env.VERSION;

    if (version) url.searchParams.append("v", version);

    const jsonURL = `${url.origin}${url.pathname}.json${url.search}`;
    const svgURL = url.toString();

    // Attempt load .json created from .svg
    if (!import.meta.env.DEV) {
      try {
        const jsonResponse = await fetch(jsonURL);
        if (jsonResponse.ok) return await jsonResponse.json();
      } catch (e) {
        console.error("DynamicSvgSprite:", e, jsonURL);
      }
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

    const id = urlToID(url);
    let symbolAttrs = ` id="dss-${id}"`;
    if (viewBox) symbolAttrs += ` viewBox="${viewBox}"`;

    return {
      id,
      width,
      height,
      viewBox,
      symbol: `<symbol${symbolAttrs}>${svgElement.innerHTML}</symbol>`,
    };
  }
}
