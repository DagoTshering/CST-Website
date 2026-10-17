"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { buttonClass, Notice } from "@/components/admin/ui";
import { cx } from "@/lib/cx";

import { login, type LoginState } from "../actions";

const inputClass =
  "block w-full rounded-md border border-admin-line bg-white px-3.5 py-2.5 text-[0.9375rem] text-admin-navy shadow-xs transition-colors placeholder:text-admin-muted/70 focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/20 focus:outline-none disabled:bg-admin-bg aria-invalid:border-admin-danger aria-invalid:ring-admin-danger/15";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state.error && (
        <Notice tone="error" ref={errorRef} tabIndex={-1} className="focus:outline-none">
          {state.error}
        </Notice>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-admin-navy">
          Email address
        </label>
        <input
          // a new key after each attempt keeps the typed email after React resets the form
          key={`email-${state.email ?? ""}`}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email}
          disabled={pending}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={cx(inputClass, "mt-1.5")}
        />
        {emailError && (
          <p id="email-error" className="mt-1.5 text-sm text-admin-danger">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-admin-navy">
          Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={cx(inputClass, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-admin-muted hover:text-admin-navy focus-visible:outline-2 focus-visible:outline-admin-accent"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="size-[18px]" aria-hidden="true" />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="mt-1.5 text-sm text-admin-danger">
            {passwordError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "min-h-11 w-full text-[0.9375rem]")}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
