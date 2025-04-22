import "@/common/css/base.css"; // For dev mode only
import { instance as dynamicSvgSprite } from "virtual:dynamic-svg-sprite";

dynamicSvgSprite.update();
dynamicSvgSprite.updateByDomObserver();
