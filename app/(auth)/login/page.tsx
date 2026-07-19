"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { loginAction, ActionResult } from "@/lib/actions/auth";

const TIMEOUT_MS = 30_000;
const ERROR_CLEAR_DELAY = 300;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTimedOut, setIsTimedOut] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autofocus on email field
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (emailClearRef.current) clearTimeout(emailClearRef.current);
      if (passwordClearRef.current) clearTimeout(passwordClearRef.current);
    };
  }, []);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    // Clear inline error within 300ms
    if (emailClearRef.current) clearTimeout(emailClearRef.current);
    emailClearRef.current = setTimeout(() => {
      clearFieldError("email");
      setFormError("");
    }, ERROR_CLEAR_DELAY);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (passwordClearRef.current) clearTimeout(passwordClearRef.current);
    passwordClearRef.current = setTimeout(() => {
      clearFieldError("password");
      setFormError("");
    }, ERROR_CLEAR_DELAY);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side quick validation
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Campo obrigatório";
    if (!password) errors.password = "Campo obrigatório";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setIsTimedOut(false);

    // Start timeout
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      setFormError("Falha na comunicação com o servidor. Tente novamente.");
    }, TIMEOUT_MS);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("password", password);
        formData.set("rememberMe", rememberMe ? "true" : "false");

        const result: ActionResult = await loginAction(formData);

        // Clear timeout on response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!result.success) {
          // Keep email, clear password on error
          setPassword("");

          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          if (result.error === "invalid_credentials") {
            setFormError("Email ou senha incorretos");
          } else if (result.error === "rate_limited") {
            setFormError("Muitas tentativas. Aguarde alguns minutos.");
          } else if (result.error) {
            setFormError("Algo deu errado. Tente novamente.");
          }
        }
        // If success, the server action will redirect — no action needed here
      } catch {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // NEXT_REDIRECT errors are thrown by redirect() — let them propagate
        // For other errors, show generic message
        setPassword("");
        setFormError("Algo deu errado. Tente novamente.");
      }
    });
  }

  const isSubmitting = isPending && !isTimedOut;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        width: "100%",
        maxWidth: "380px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Form-level error */}
      {formError && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: "10px 14px",
            background: "#FDF2F0",
            border: "1px solid #F5C6BE",
            borderRadius: "12px",
            fontSize: "13px",
            color: "#C6685A",
            textAlign: "center",
          }}
        >
          {formError}
        </p>
      )}

      {/* Email field */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor="login-email"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Email
        </label>
        <input
          ref={emailRef}
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          style={{
            padding: "12px 14px",
            border: `1px solid ${fieldErrors.email ? "#C6685A" : "var(--line)"}`,
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
            color: "var(--ink)",
            background: "var(--surface)",
            outline: "none",
            transition: "border-color 0.15s ease",
          }}
        />
        {fieldErrors.email && (
          <p
            id="login-email-error"
            role="alert"
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#C6685A",
            }}
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor="login-password"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Senha
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
            style={{
              width: "100%",
              padding: "12px 44px 12px 14px",
              border: `1px solid ${fieldErrors.password ? "#C6685A" : "var(--line)"}`,
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              color: "var(--ink)",
              background: "var(--surface)",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p
            id="login-password-error"
            role="alert"
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#C6685A",
            }}
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Remember me checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          id="login-remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          style={{ width: "16px", height: "16px", accentColor: "var(--structure)" }}
        />
        <label
          htmlFor="login-remember"
          style={{ fontSize: "13px", color: "var(--muted)", cursor: "pointer" }}
        >
          Manter conectado
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          marginTop: "8px",
          padding: "12px 20px",
          background: "var(--structure)",
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
          transition: "opacity 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isSubmitting && (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        )}
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      {/* Link to register */}
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "var(--muted)",
          margin: "8px 0 0",
        }}
      >
        Não tem conta?{" "}
        <Link
          href="/register"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          Crie a sua
        </Link>
      </p>

    </form>
  );
}
