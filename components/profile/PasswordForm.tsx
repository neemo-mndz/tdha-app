"use client";

import { useState, useTransition, useEffect } from "react";
import { changePassword } from "@/lib/actions/profile";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword.length > 128) {
      setError("A senha deve ter no máximo 128 caracteres");
      return;
    }
    if (confirmPassword !== newPassword) {
      setError("As senhas não coincidem");
      return;
    }

    startTransition(async () => {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Senha alterada com sucesso");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className="password-form" onSubmit={handleSubmit}>
      <div className="password-form__field">
        <label htmlFor="current-password" className="password-form__label">
          Senha atual
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          className="password-form__input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="password-form__field">
        <label htmlFor="new-password" className="password-form__label">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className="password-form__input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="password-form__field">
        <label htmlFor="confirm-password" className="password-form__label">
          Confirmar nova senha
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          className="password-form__input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="password-form__error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="password-form__success">
          {success}
        </p>
      )}

      <button
        type="submit"
        className="password-form__btn"
        disabled={isPending}
      >
        {isPending ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
