/**
 * A requestAnimationFrame loop that runs only while it has something to do: `frame` receives
 * the timestamp and the time since the last frame (capped, so a long pause does not make
 * anything jump) and returns false once it is done; wake() starts it again. It never runs
 * while `target` is off screen or the tab is hidden. dispose() stops it for good.
 */
export function createFrameLoop(target: Element, frame: (now: number, dt: number) => boolean) {
  let raf = 0;
  let last = 0;
  let onScreen = true;
  let disposed = false;

  const tick = (now: number) => {
    const dt = Math.min(48, now - last);
    last = now;
    raf = frame(now, dt) ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => {
    if (raf || disposed || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) wake();
    else stop();
  });
  observer.observe(target);

  const onVisibility = () => (document.hidden ? stop() : wake());
  document.addEventListener("visibilitychange", onVisibility);

  return {
    wake,
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
