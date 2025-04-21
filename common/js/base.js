// For HMR, in production will be removed
if (import.meta.hot) import.meta.hot.accept();

import { instance as dynamicSvgSprite } from "virtual:dynamic-svg-sprite";

dynamicSvgSprite.update();
dynamicSvgSprite.updateByDomObserver();
