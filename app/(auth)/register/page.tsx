"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { registerAction, ActionResult } from "@/lib/actions/auth";

const TIMEOUT_MS = 30_000;

export default function RegisterPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = isPending && !isTimedOut;

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGeneralError("");
  }

  function clientValidate(formData: FormData): Record<string, string> | null {
    const errors: Record<string, string> = {};
    const email = (formData.get("email") as string) ?? "";
    const password = (formData.get("password") as string) ?? "";
    const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

    if (!email.trim()) {
      errors.email = "Campo obrigatório";
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
        email.trim().toLowerCase()
      ) ||
      email.length > 254
    ) {
      errors.email = "Insira um email válido";
    }

    if (!password) {
      errors.password = "Campo obrigatório";
    } else if (password.length < 8 || password.length > 128) {
      errors.password = "A senha precisa ter entre 8 e 128 caracteres";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Campo obrigatório";
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = "As senhas não coincidem";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Client-side validation
    const clientErrors = clientValidate(formData);
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setGeneralError("");
    setIsTimedOut(false);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      setGeneralError("Falha na comunicação com o servidor. Tente novamente.");
    }, TIMEOUT_MS);

    startTransition(async () => {
      try {
        const result: ActionResult = await registerAction(formData);
        // If we get here, the action returned (didn't redirect)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!result.success) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          if (result.error && !result.fieldErrors) {
            setGeneralError("Algo deu errado. Tente novamente.");
          }
          // Clear passwords on server error
          const passwordInput = form.elements.namedItem(
            "password"
          ) as HTMLInputElement | null;
          const confirmInput = form.elements.namedItem(
            "confirmPassword"
          ) as HTMLInputElement | null;
          if (passwordInput) passwordInput.value = "";
          if (confirmInput) confirmInput.value = "";
        }
      } catch {
        // registerAction redirects on success which throws in transitions
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    });
  }

  return (
    <form
      ref={formRef}
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
      {generalError && (
        <p
          role="alert"
          style={{
            fontSize: "13px",
            color: "#C6685A",
            textAlign: "center",
            margin: 0,
          }}
        >
          {generalError}
        </p>
      )}

      {/* Email field */}
      <div>
        <input
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          placeholder="Email"
          aria-label="Email"
          aria-invalid={!!fieldErrors.email}
          onChange={() => clearFieldError("email")}
          style={{
            width: "100%",
            padding: "14px 16px",
            border: `1px solid ${fieldErrors.email ? "#C6685A" : "var(--line)"}`,
            borderRadius: "var(--radius)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "var(--ink)",
            background: "var(--surface)",
            outline: "none",
            transition: "border-color 0.15s ease",
          }}
        />
        {fieldErrors.email && (
          <p
            role="alert"
            style={{
              fontSize: "12px",
              color: "#C6685A",
              margin: "6px 0 0 4px",
            }}
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Senha"
            aria-label="Senha"
            aria-invalid={!!fieldErrors.password}
            onChange={() => clearFieldError("password")}
            style={{
              width: "100%",
              padding: "14px 44px 14px 16px",
              border: `1px solid ${fieldErrors.password ? "#C6685A" : "var(--line)"}`,
              borderRadius: "var(--radius)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
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
            role="alert"
            style={{
              fontSize: "12px",
              color: "#C6685A",
              margin: "6px 0 0 4px",
            }}
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm password field */}
      <div>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            aria-label="Confirmar senha"
            aria-invalid={!!fieldErrors.confirmPassword}
            onChange={() => clearFieldError("confirmPassword")}
            style={{
              width: "100%",
              padding: "14px 44px 14px 16px",
              border: `1px solid ${fieldErrors.confirmPassword ? "#C6685A" : "var(--line)"}`,
              borderRadius: "var(--radius)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: "var(--ink)",
              background: "var(--surface)",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
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
            {showConfirmPassword ? (
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
        {fieldErrors.confirmPassword && (
          <p
            role="alert"
            style={{
              fontSize: "12px",
              color: "#C6685A",
              margin: "6px 0 0 4px",
            }}
          >
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "100%",
          padding: "14px",
          background: "var(--structure)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius)",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: "14px",
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
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.6s linear infinite",
            }}
          />
        )}
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </button>

      {/* Link to login */}
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "var(--muted)",
          margin: 0,
        }}
      >
        Já tem conta?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          Entre aqui
        </Link>
      </p>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
