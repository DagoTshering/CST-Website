/**
 * The clock that moves the highlight from programme to programme, in the order they were
 * first offered. One clock drives both the highlight and (on smaller screens) which drawing
 * is in the shared slot, so the two can never fall out of step.
 */
export function createTour<Key extends string>(keys: readonly Key[], stepMs: number) {
  let index = 0;
  let stepStartedAt = 0;

  return {
    get key() {
      return keys[index];
    },
    /** Jumps to a programme and restarts its beat. */
    jumpTo(key: Key) {
      const i = keys.indexOf(key);
      if (i >= 0) {
        index = i;
        stepStartedAt = 0;
      }
    },
    /** Moves on when a beat has passed. Returns true if the programme changed. */
    tick(now: number) {
      if (!stepStartedAt) {
        stepStartedAt = now;
        return false;
      }
      if (now - stepStartedAt < stepMs) return false;
      stepStartedAt = now;
      index = (index + 1) % keys.length;
      return true;
    },
    /** Holds the tour; the next beat starts whole rather than half-run. */
    hold() {
      stepStartedAt = 0;
    },
  };
}
