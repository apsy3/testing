"use client";

import { useState } from "react";
import styles from "../styles/login.module.scss";

export function LoginForm() {
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    if (!email) {
      setMessage("Enter a valid email address.");
      return;
    }

    setState("submitting");
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "Unable to send login email.");
      setState("error");
      return;
    }

    setState("sent");
    setMessage("Check your inbox for the magic link.");
    event.currentTarget.reset();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" name="email" placeholder="you@example.com" required autoComplete="email" />
      </label>
      <button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : "Send magic link"}
      </button>
      {message ? <p className={styles.message}>{message}</p> : null}
    </form>
  );
}
