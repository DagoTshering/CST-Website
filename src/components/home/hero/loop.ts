/**
 * A requestAnimationFrame loop that runs only while `target` is on screen and the tab is
 * visible. `frame` receives the timestamp and the time since the last frame (capped, so a
 * long pause does not make everything jump). Returns a function that stops it for good.
 */
export function startFrameLoop(target: Element, frame: (now: number, dt: number) => void) {
  let raf = 0;
  let last = 0;
  let onScreen = true;

  const tick = (now: number) => {
    const dt = Math.min(48, now - last);
    last = now;
    frame(now, dt);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) start();
    else stop();
  });
  observer.observe(target);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  start();

  return () => {
    stop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
