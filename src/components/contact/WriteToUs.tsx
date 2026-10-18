"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";

import s from "./Contact.module.css";
import { WRITE_EVENT } from "./WriteToButton";

type Recipient = { id: string; name: string; email: string };

const EMAIL = /^\S+@\S+\.\S+$/;

/** A line-art envelope, tipped over the block's corner. */
const Envelope = () => (
  <svg className={s.envelope} viewBox="0 0 92 64" aria-hidden="true" focusable="false">
    <rect
      x="1"
      y="1"
      width="90"
      height="62"
      rx="3"
      fill="var(--color-white)"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M2 3 L46 38 L90 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M2 61 L34 31 M90 61 L58 31"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.5"
    />
    <rect
      x="62"
      y="40"
      width="22"
      height="16"
      fill="none"
      stroke="var(--color-brass)"
      strokeWidth="1.5"
      strokeDasharray="2 2"
    />
  </svg>
);

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * "Write to us": pick an office, write a message, and the visitor's own email app opens with it
 * ready to send (a mailto: link). Nothing is sent from the page: there is no server side. The
 * directory's "Write" buttons address the message here (WRITE_EVENT).
 */
export function WriteToUs({
  recipients,
  defaultId,
}: {
  recipients: Recipient[];
  defaultId: string;
}) {
  const [to, setTo] = useState(defaultId);
  const [message, setMessage] = useState<ReactNode>(null);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const block = useRef<HTMLElement>(null);
  const nameField = useRef<HTMLInputElement>(null);
  const recipient = recipients.find((r) => r.id === to) ?? recipients[0];

  useEffect(() => {
    const onWrite = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!recipients.some((r) => r.id === id)) return;
      setTo(id);
      setMessage(null);
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // to its top (below the header: scroll-margin-top), so its heading shows even on a phone
      block.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      window.setTimeout(() => nameField.current?.focus({ preventScroll: true }), smooth ? 450 : 0);
    };
    window.addEventListener(WRITE_EVENT, onWrite);
    return () => window.removeEventListener(WRITE_EVENT, onWrite);
  }, [recipients]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const fields = {
      name: value("name"),
      email: value("email"),
      subject: value("subject"),
      message: value("message"),
    };

    const missing = new Set(
      Object.entries(fields)
        .filter(([key, v]) => !v || (key === "email" && !EMAIL.test(v)))
        .map(([key]) => key),
    );
    setInvalid(missing);
    if (missing.size > 0) {
      setMessage("Please fill in your name, a valid email address, a subject and a message.");
      return;
    }

    const body = `${fields.message}\n\n${fields.name}\n${fields.email}`;
    window.location.href = `mailto:${recipient.email}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(body)}`;
    setMessage(
      <>
        If your email app did not open, write to <strong>{recipient.email}</strong> directly.
      </>,
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(recipient.email);
      setMessage(
        <>
          Copied <strong>{recipient.email}</strong>.
        </>,
      );
    } catch {
      // no clipboard (an older browser, or permission refused): show the address to copy by hand
      setMessage(
        <>
          The address is <strong>{recipient.email}</strong>.
        </>,
      );
    }
  }

  const fieldProps = (name: string) => ({
    id: `write-${name}`,
    name,
    required: true,
    "aria-invalid": invalid.has(name) || undefined,
    className: s.input,
  });

  return (
    <section ref={block} id="write" aria-labelledby="write-title" className={s.writeBlock}>
      <Envelope />
      <div>
        <p className={s.eyebrow}>Write to us</p>
        <h2 id="write-title" className={s.blockTitle}>
          Send a message
        </h2>
        <p className={s.lede}>
          Pick who it is for, write your message, and we will open it in your email app, ready to
          send. Nothing is sent from this page.
        </p>
        <p className={s.chosen}>
          Prefer to copy the address? <strong>{recipient.email}</strong>
        </p>
      </div>

      {/* compact (fields in pairs), so the whole box fits on one laptop screen */}
      <form noValidate onSubmit={submit}>
        <div className={s.pair}>
          <Field id="write-to" label="To">
            <div className={s.selectBox}>
              <select
                id="write-to"
                className={s.input}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setMessage(null);
                }}
              >
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className={s.selectIcon} aria-hidden="true" />
            </div>
          </Field>
          <Field id="write-subject" label="Subject">
            <input {...fieldProps("subject")} />
          </Field>
        </div>
        <div className={s.pair}>
          <Field id="write-name" label="Your name">
            <input ref={nameField} {...fieldProps("name")} autoComplete="name" />
          </Field>
          <Field id="write-email" label="Your email">
            <input {...fieldProps("email")} type="email" autoComplete="email" />
          </Field>
        </div>
        <Field id="write-message" label="Message">
          <textarea {...fieldProps("message")} rows={4} />
        </Field>

        <div className={s.formActions}>
          <Button type="submit">Open in my email app</Button>
          <Button variant="secondary" onClick={copy}>
            Copy address
          </Button>
        </div>
        <p role="status" className={s.formStatus}>
          {message}
        </p>
      </form>
    </section>
  );
}
