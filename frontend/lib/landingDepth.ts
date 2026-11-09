// Highest opaque point in each of 24 equal columns, as a percentage of
// image height. These envelopes cover every size and both tones of each crop.
const widePlantEdge = [74, 75, 78, 78, 79, 81, 83, 85, 87, 87, 88, 87, 86, 85, 83, 82, 82, 81, 80, 78, 77, 75, 74, 72];
const mobilePlantEdge = [84, 85, 86, 86, 87, 87, 88, 88, 89, 87, 87, 87, 86, 86, 85, 85, 84, 83, 83, 83, 82, 82, 82, 81];

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

function plantClearance(hero: HTMLElement, image: HTMLImageElement, edge: readonly number[], content: Iterable<HTMLElement>) {
  const width = image.offsetWidth;
  const height = image.offsetHeight;
  if (!width || !height) return 0;
  const left = image.getBoundingClientRect().left + window.scrollX;
  const top = layoutOrigin(hero).y + hero.offsetHeight - height;
  let clearance = Infinity;
  for (const element of content) {
    const { x, y } = layoutOrigin(element);
    const first = Math.max(0, Math.floor((x - left) / width * edge.length));
    const last = Math.min(edge.length - 1, Math.floor((x + element.offsetWidth - left) / width * edge.length));
    for (let i = first; i <= last; i++) {
      clearance = Math.min(clearance, top + edge[i] / 100 * height - y - element.offsetHeight);
    }
  }
  // Leave room for thin stems and rounding around the wordmarks.
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
  const windowTravel = Math.min(26 * scale, clearance);
  const foreground = Math.min(68 * scale, clearance - windowTravel) * depth;
  return [244 * scale * depth, 124 * scale * depth, -foreground, 1 + foreground / plantBase, windowTravel * depth];
}

const translateY = (value: number) => `0 ${value}px`;
const scaleY = (value: number) => `1 ${value}`;

export function observeHeroDepth(hero: HTMLElement) {
  const plants = hero.querySelector<HTMLImageElement>(".sl-hero-plants img");
  const elements = [
    hero.querySelector<HTMLElement>(".sl-hero-photo"),
    hero.querySelector<HTMLElement>(".sl-hero-hills"),
    hero.querySelector<HTMLElement>(".sl-hero-foreground-track"),
    hero.querySelector<HTMLElement>(".sl-hero-foreground-extension img"),
    hero.querySelector<HTMLElement>(".sl-hero-platform"),
  ];
  if (!plants || elements.some(element => !element) || !("IntersectionObserver" in window)) return;
  const brand = hero.querySelectorAll<HTMLElement>(".sl-platform-brand, .sl-hero-rail-brand");
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
  let frame = 0;
  let measurement = 0;
  let tracking = false;
  let listening = false;
  let disposed = false;
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

  function syncScrollListener() {
    const needed = tracking && !timeline;
    if (needed === listening) return;
    listening = needed;
    if (needed) window.addEventListener("scroll", schedulePaint, { passive: true });
    else window.removeEventListener("scroll", schedulePaint);
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
      clearance: plantClearance(hero, plants!, style.getPropertyValue("--sl-hero-crop").trim() === "mobile"
        ? mobilePlantEdge : widePlantEdge, brand),
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

  function sync() {
    if (motion.matches) {
      hero.setAttribute("data-entry-skipped", "");
      stopAnimations();
      geometry = undefined;
    }
    const active = inView && !motion.matches && !document.hidden;
    if (active === tracking) return;
    tracking = active;
    hero.toggleAttribute("data-depth-active", active);
    syncScrollListener();
    if (active) {
      requestMeasurement();
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
  brand.forEach(element => resize?.observe(element));
  void document.fonts.ready.then(requestMeasurement);
  if (!resize) window.addEventListener("resize", requestMeasurement, { passive: true });
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
  return () => {
    disposed = true;
    viewport.disconnect();
    resize?.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measurement);
    stopAnimations();
    hero.removeAttribute("data-depth-active");
    window.removeEventListener("scroll", schedulePaint);
    window.removeEventListener("resize", requestMeasurement);
    motion.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
  };
}
