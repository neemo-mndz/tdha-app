"use client";

import { useState, useTransition } from "react";
import { updateName } from "@/lib/actions/profile";

interface NameFormProps {
  currentName: string | null;
}

export function NameForm({ currentName }: NameFormProps) {
  const [name, setName] = useState(currentName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (trimmed.length > 100) {
      setError("Nome deve ter no máximo 100 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await updateName({ name: trimmed });
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form className="name-form" onSubmit={handleSubmit}>
      <label className="name-form__label" htmlFor="name-input">
        Nome
      </label>
      <div className="name-form__row">
        <input
          id="name-input"
          type="text"
          className="name-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          aria-label="Nome de exibição"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "name-error" : undefined}
        />
        <button
          type="submit"
          className="name-form__btn"
          disabled={isPending}
        >
          {isPending ? "..." : "Salvar"}
        </button>
      </div>
      {error && (
        <p id="name-error" role="alert" className="name-form__error">
          {error}
        </p>
      )}
    </form>
  );
}
