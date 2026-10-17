"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  normaliseEmail,
  PASSWORD_MAX_LENGTH,
  verifyAgainstDummy,
  verifyPassword,
} from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { clientIp, isLoginThrottled, recordLoginAttempt } from "@/lib/auth/throttle";
import { getDb, schema } from "@/lib/db";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  /** Echoed back so the email field keeps its value; the password never is. */
  email?: string;
};

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(320, "Enter a valid email address.")
    .pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(PASSWORD_MAX_LENGTH, "Incorrect email or password."),
});

/** One message for every failed sign-in, so it never reveals which emails have accounts. */
const INVALID = "Incorrect email or password.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: { email: errors.email?.[0], password: errors.password?.[0] },
      email: raw.email,
    };
  }

  const email = normaliseEmail(parsed.data.email);
  const ip = await clientIp();

  try {
    if (await isLoginThrottled(email, ip)) {
      return {
        error: "Too many unsuccessful attempts. Please wait 15 minutes and try again.",
        email: raw.email,
      };
    }

    const db = getDb();
    const [admin] = await db
      .select({ id: schema.adminUsers.id, passwordHash: schema.adminUsers.passwordHash })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .limit(1);

    const valid = admin
      ? await verifyPassword(admin.passwordHash, parsed.data.password)
      : await verifyAgainstDummy(parsed.data.password);

    await recordLoginAttempt(email, ip, valid);
    if (!admin || !valid) return { error: INVALID, email: raw.email };

    await db
      .update(schema.adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.adminUsers.id, admin.id));
    await createSession(admin.id);
  } catch (error) {
    console.error("Admin: sign-in failed", error);
    return { error: "Sign-in is unavailable at the moment. Please try again.", email: raw.email };
  }

  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
