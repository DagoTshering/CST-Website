/** Public URL of an uploaded file; served by src/app/media/[file]/route.ts. */
export function mediaUrl(storageKey: string) {
  return `/media/${storageKey}`;
}

/** Storage keys are a UUID plus the extension of the verified file type, nothing else. */
export const STORAGE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/;
