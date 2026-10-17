"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import {
  hashPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  verifyPassword,
} from "@/lib/auth/password";
import { otherSessionsOf } from "@/lib/auth/session";
import { clientIp, isLoginThrottled, recordLoginAttempt } from "@/lib/auth/throttle";
import { getDb, schema } from "@/lib/db";

export type PasswordState = {
  status?: "error" | "saved";
  message?: string;
  fieldErrors?: { current?: string; next?: string; confirm?: string };
  at?: number;
};

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password.").max(PASSWORD_MAX_LENGTH),
    next: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`),
    confirm: z.string(),
  })
  .refine((data) => data.next === data.confirm, {
    path: ["confirm"],
    message: "The passwords do not match.",
  })
  .refine((data) => data.next !== data.current, {
    path: ["next"],
    message: "Choose a password different from the current one.",
  });

/**
 * Replaces the signed-in administrator's password after checking the current one, and signs
 * out every other session. Failed checks count towards the login throttle.
 */
export async function changePassword(
  _state: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const admin = await requireAdmin();
  const fail = (
    fieldErrors: PasswordState["fieldErrors"],
    message = "Please correct the highlighted fields.",
  ) => ({ status: "error", message, fieldErrors, at: Date.now() }) as const;

  const parsed = passwordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return fail({
      current: errors.current?.[0],
      next: errors.next?.[0],
      confirm: errors.confirm?.[0],
    });
  }

  try {
    const ip = await clientIp();
    if (await isLoginThrottled(admin.email, ip)) {
      return fail({}, "Too many unsuccessful attempts. Please wait 15 minutes and try again.");
    }

    const db = getDb();
    const [row] = await db
      .select({ passwordHash: schema.adminUsers.passwordHash })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, admin.id))
      .limit(1);
    const valid = row ? await verifyPassword(row.passwordHash, parsed.data.current) : false;
    if (!valid) {
      await recordLoginAttempt(admin.email, ip, false);
      return fail({ current: "Your current password is incorrect." });
    }

    const passwordHash = await hashPassword(parsed.data.next);
    await db.transaction(async (tx) => {
      await tx
        .update(schema.adminUsers)
        .set({ passwordHash, passwordChangedAt: new Date() })
        .where(eq(schema.adminUsers.id, admin.id));
      await tx.delete(schema.adminSessions).where(otherSessionsOf(admin.id, admin.sessionId));
    });
  } catch (error) {
    console.error("Admin: changing the password failed", error);
    return fail({}, "The password could not be changed. Please try again.");
  }

  refresh();
  return {
    status: "saved",
    message: "Your password has been changed. Any other signed-in sessions were signed out.",
    at: Date.now(),
  };
}
