import { getCurrentAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import {
  cleanOriginalName,
  processImage,
  processPdf,
  removeFile,
  storeFile,
  UPLOAD_LIMITS,
} from "@/lib/media/storage";
import { mediaUrl } from "@/lib/media/url";

/*
 * Uploads an image or PDF from the admin forms (POST multipart/form-data: `file`, `kind`).
 * A Route Handler rather than a Server Action because it receives a file: the browser sends it
 * as soon as one is chosen, and the form then submits only the returned id.
 */

const error = (message: string, status: number) => Response.json({ error: message }, { status });

/** The request must come from this site's own pages (the session cookie is SameSite=Lax too). */
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return error("Your session has ended. Please sign in again.", 401);
  if (!isSameOrigin(request)) return error("This request is not allowed.", 403);

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > UPLOAD_LIMITS.document + 64 * 1024) {
    return error("The file is too large.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("The upload could not be read.", 400);
  }

  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "image" && kind !== "document") || !(file instanceof File)) {
    return error("Choose a file to upload.", 400);
  }
  if (file.size === 0) return error("The file is empty.", 400);
  if (file.size > UPLOAD_LIMITS[kind]) {
    const mb = UPLOAD_LIMITS[kind] / 1024 / 1024;
    return error(`The file is too large. The limit is ${mb} MB.`, 413);
  }

  // The type is decided from the bytes themselves, never from the name or the browser's claim.
  const bytes = Buffer.from(await file.arrayBuffer());
  const processed = kind === "image" ? await processImage(bytes) : processPdf(bytes);
  if (!processed) {
    return error(
      kind === "image" ? "Upload a JPEG, PNG or WebP image." : "Upload a PDF document.",
      415,
    );
  }

  let storageKey: string | undefined;
  try {
    storageKey = await storeFile(processed);
    const name = cleanOriginalName(file.name);
    const [row] = await getDb()
      .insert(schema.media)
      .values({
        kind,
        storageKey,
        originalName: name,
        mimeType: processed.mimeType,
        byteSize: processed.data.length,
        width: processed.width,
        height: processed.height,
        uploadedBy: admin.id,
      })
      .returning({ id: schema.media.id });

    return Response.json({ id: row.id, url: mediaUrl(storageKey), name, kind }, { status: 201 });
  } catch (cause) {
    console.error("Admin: storing an upload failed", cause);
    if (storageKey) await removeFile(storageKey);
    return error("The file could not be saved. Please try again.", 500);
  }
}
