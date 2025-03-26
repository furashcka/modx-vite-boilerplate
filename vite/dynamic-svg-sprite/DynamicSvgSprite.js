export default class DynamicSvgSprite {
  #contents = {};
  #sprite = null;

  constructor() {
    this.#sprite = this.#createSprite();
  }

  #createSprite() {
    const id = `dss-id-${+new Date()}`;
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

      try {
        this.#contents[url] = await this.#fetchSvg(url);
        // TODO: Fill in this.#sprite using DocumentFragment
        this.#sprite.insertAdjacentHTML(
          "afterbegin",
          this.#contents[url].symbol,
        );
        this.#svgDone(svgEl, this.#contents[url]);
      } catch (error) {
        console.error(`Couldn't add ${url} to the sprite:`, error);
      }
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

  async #fetchSvg(url) {
    const version = import.meta.env.VERSION
      ? `?v=${import.meta.env.VERSION}`
      : "";
    const jsonURL = `${url}.json${version}`;
    const svgURL = `${url}${version}`;

    // JSON
    {
      const jsonResponse = await fetch(jsonURL);

      if (jsonResponse.ok) return jsonResponse.json();
      if (jsonResponse.status !== 404) {
        throw new Error(`Error loading JSON: ${JsonResponse.status}`);
      }
    }

    // SVG
    {
      const svgResponse = await fetch(svgURL);

      if (svgResponse.ok) {
        return this.#parseSvg({
          url: svgURL,
          text: await svgResponse.text(),
        });
      }

      throw new Error(`Error loading SVG: ${svgResponse.status}`);
    }
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
