const sampleWidth = 384;
const sampleHeight = 256;
const entranceNames = new Set(["sl-appear", "sl-hero-copy-rise", "sl-foreground-arrive"]);

function samplePlantEdge(image: HTMLImageElement): Float32Array | null {
  if (!image.complete || !image.naturalWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const edge = Float32Array.from({ length: sampleWidth }, (_, x) => {
    for (let y = 0; y < sampleHeight; y++) {
      if (pixels[(y * sampleWidth + x) * 4 + 3] >= 16) return y / sampleHeight;
    }
    return 1;
  });
  return edge.some(y => y < .98) ? edge : null;
}

// Offset coordinates exclude the entrance and scroll transforms.
function layoutOrigin(element: HTMLElement) {
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

function plantClearance(hero: HTMLElement, image: HTMLImageElement, edge: Float32Array) {
  const width = image.offsetWidth;
  const height = image.offsetHeight;
  if (!width || !height) return 0;
  const left = image.getBoundingClientRect().left + window.scrollX;
  const top = layoutOrigin(hero).y + hero.offsetHeight - height;
  let clearance = Infinity;
  for (const action of hero.querySelectorAll<HTMLElement>(".sl-hero-board button, .sl-hero-phrase p")) {
    const { x, y } = layoutOrigin(action);
    const first = Math.max(0, Math.floor((x - left) / width * edge.length));
    const last = Math.min(edge.length - 1, Math.ceil((x + action.offsetWidth - left) / width * edge.length));
    for (let i = first; i <= last; i++) {
      clearance = Math.min(clearance, top + edge[i] * height - y - action.offsetHeight);
    }
  }
  // Leave room for thin stems, rounding, and the button focus outline.
  return Number.isFinite(clearance) ? Math.max(0, clearance - 8) : 0;
}

type Geometry = { travel: number; scale: number; plantBase: number; clearance: number };
type ScrollRange = KeyframeAnimationOptions & { rangeStart: string; rangeEnd: string };
type ScrollTimelineFactory = new (options: { source: Element }) => AnimationTimeline;

function scrollTimeline() {
  const Timeline = (window as Window & { ScrollTimeline?: ScrollTimelineFactory }).ScrollTimeline;
  return Timeline && document.scrollingElement && CSS.supports("animation-range", "0px 100px")
    ? new Timeline({ source: document.scrollingElement })
    : null;
}

function layerPositions(phase: number, { scale, plantBase, clearance }: Geometry) {
  // Show the separation early, then ease the scenery into its resting position.
  const depth = phase * (2 - phase);
  const foreground = Math.min(68 * scale, clearance) * depth;
  return [244 * scale * depth, 124 * scale * depth, -foreground, 1 + foreground / plantBase];
}

const translateY = (value: number) => `0 ${value}px`;
const scaleY = (value: number) => `1 ${value}`;

export function observeHeroDepth(hero: HTMLElement) {
  const plants = hero.querySelector<HTMLImageElement>(".sl-hero-plants img");
  const elements = [
    hero.querySelector<HTMLElement>(".sl-hero-photo img"),
    hero.querySelector<HTMLElement>(".sl-hero-hills img"),
    hero.querySelector<HTMLElement>(".sl-hero-foreground-track"),
    hero.querySelector<HTMLElement>(".sl-hero-foreground-extension img"),
  ];
  if (!plants || elements.some(element => !element) || !("IntersectionObserver" in window)) return;
  const layers = (elements as HTMLElement[]).map((element, index) => ({
    element,
    property: index === 3 ? "scale" as const : "translate" as const,
    format: index === 3 ? scaleY : translateY,
  }));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timeline = scrollTimeline();
  let animations: Animation[] = [];
  let geometry: Geometry | undefined;
  let lastPaint: { phase: number; geometry: Geometry } | undefined;
  let edgeSource = "";
  let decoding = "";
  let edge: Float32Array | null = null;
  let frame = 0;
  let measurement = 0;
  let tracking = false;
  let listening = false;
  let disposed = false;
  let waitingForFirstScroll = true;
  const initial = hero.getBoundingClientRect();
  let inView = initial.bottom > 0 && initial.top < window.innerHeight;

  function paint() {
    frame = 0;
    if (timeline || !geometry) return;
    const phase = Math.max(0, Math.min(1, window.scrollY / geometry.travel));
    if (phase === lastPaint?.phase && geometry === lastPaint.geometry) return;
    const offsets = layerPositions(phase, geometry);
    layers.forEach(({ element, property, format }, index) => {
      element.style[property] = format(offsets[index]);
    });
    lastPaint = { phase, geometry };
  }

  function schedulePaint() {
    if (tracking && !frame) frame = requestAnimationFrame(paint);
  }

  function onScroll() {
    if (waitingForFirstScroll && window.scrollY > 12) {
      waitingForFirstScroll = false;
      if (typeof CSSAnimation !== "undefined") {
        for (const animation of hero.getAnimations({ subtree: true })) {
          if (animation instanceof CSSAnimation && entranceNames.has(animation.animationName) && animation.playState === "running") {
            animation.updatePlaybackRate(4);
          }
        }
      }
      readPlants();
      requestMeasurement();
      syncScrollListener();
    }
    if (!timeline) schedulePaint();
  }

  function syncScrollListener() {
    const needed = tracking && (!timeline || waitingForFirstScroll);
    if (needed === listening) return;
    listening = needed;
    if (needed) window.addEventListener("scroll", onScroll, { passive: true });
    else window.removeEventListener("scroll", onScroll);
  }

  function stopAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    layers.forEach(({ element, property }) => element.style.removeProperty(property));
    lastPaint = undefined;
  }

  function measure() {
    measurement = 0;
    const style = getComputedStyle(hero);
    const next: Geometry = {
      // A mobile browser's collapsing toolbar should not change the scroll range.
      travel: Math.max(1, Math.min(hero.offsetHeight * .58, 650)),
      scale: Number(style.getPropertyValue("--sl-hero-depth-scale")),
      plantBase: Number.parseFloat(style.getPropertyValue("--sl-hero-plants-base")),
      clearance: edge && plants!.currentSrc === edgeSource ? plantClearance(hero, plants!, edge) : 0,
    };
    const changed = !geometry || next.travel !== geometry.travel || next.scale !== geometry.scale
      || next.plantBase !== geometry.plantBase || Math.abs(next.clearance - geometry.clearance) > .25;
    if (changed) {
      geometry = next;
      if (timeline) {
        stopAnimations();
        // Sample the same curve as the fallback; the browser interpolates on its scroll timeline.
        const positions = Array.from({ length: 41 }, (_, i) => layerPositions(i / 40, next));
        const options: ScrollRange = { timeline, rangeStart: "0px", rangeEnd: `${next.travel}px`, fill: "both" };
        try {
          layers.forEach(({ element, property, format }, index) => {
            const keyframes = positions.map(values => ({ [property]: format(values[index]) }));
            animations.push(element.animate(keyframes, options));
          });
        } catch {
          stopAnimations();
          timeline = null;
          syncScrollListener();
        }
      }
    }
    if (!timeline) schedulePaint();
  }

  function requestMeasurement() {
    if (!disposed && tracking && !measurement) measurement = requestAnimationFrame(measure);
  }

  function readPlants() {
    const source = plants!.currentSrc;
    if (!source || source === edgeSource || source === decoding) return;
    decoding = source;
    void plants!.decode().then(() => {
      if (disposed || plants!.currentSrc !== source) return;
      const sampled = samplePlantEdge(plants!);
      if (!sampled) return;
      edgeSource = source;
      edge = sampled;
      requestMeasurement();
    }).catch(() => {
      // The load event will retry if the responsive source changed while decoding.
    }).finally(() => {
      if (decoding === source) decoding = "";
    });
  }

  function sync() {
    if (motion.matches) {
      hero.setAttribute("data-entry-skipped", "");
      waitingForFirstScroll = false;
      stopAnimations();
      geometry = undefined;
    }
    const active = inView && !motion.matches && !document.hidden;
    if (active === tracking) return;
    tracking = active;
    hero.toggleAttribute("data-depth-active", active);
    syncScrollListener();
    if (active) {
      readPlants();
      requestMeasurement();
      if (window.scrollY > 12) onScroll();
    } else {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurement);
      frame = 0;
      measurement = 0;
    }
  }

  const viewport = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  viewport.observe(hero);
  const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestMeasurement) : null;
  resize?.observe(hero);
  resize?.observe(plants);
  const board = hero.querySelector(".sl-hero-board");
  if (board) resize?.observe(board);
  const content = new MutationObserver(requestMeasurement);
  if (board) content.observe(board, { childList: true, characterData: true, subtree: true });
  void document.fonts.ready.then(requestMeasurement);
  if (!resize) window.addEventListener("resize", requestMeasurement, { passive: true });
  plants.addEventListener("load", readPlants);
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
  return () => {
    disposed = true;
    viewport.disconnect();
    resize?.disconnect();
    content.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measurement);
    stopAnimations();
    hero.removeAttribute("data-depth-active");
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", requestMeasurement);
    plants.removeEventListener("load", readPlants);
    motion.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
  };
}
