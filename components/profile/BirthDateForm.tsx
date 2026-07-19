"use client";

import { useState, useTransition } from "react";
import { updateBirthDate } from "@/lib/actions/profile";
import { differenceInYears } from "date-fns";

interface BirthDateFormProps {
  currentBirthDate: string | null; // yyyy-MM-dd
}

export function BirthDateForm({ currentBirthDate }: BirthDateFormProps) {
  const [dateValue, setDateValue] = useState(currentBirthDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function calculateAge(dateStr: string): number | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return differenceInYears(new Date(), date);
  }

  const age = calculateAge(dateValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setError("Data inválida");
      return;
    }

    const parsedDate = new Date(dateValue);
    if (isNaN(parsedDate.getTime())) {
      setError("Data inválida");
      return;
    }

    const calculatedAge = differenceInYears(new Date(), parsedDate);
    if (calculatedAge < 13 || calculatedAge > 120) {
      setError("Idade deve estar entre 13 e 120 anos");
      return;
    }

    startTransition(async () => {
      const result = await updateBirthDate({ birthDate: dateValue });
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form className="birthdate-form" onSubmit={handleSubmit}>
      <label className="birthdate-form__label" htmlFor="birthdate-input">
        Data de nascimento
      </label>
      <div className="birthdate-form__row">
        <input
          id="birthdate-input"
          type="date"
          className="birthdate-form__input"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          aria-label="Data de nascimento"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "birthdate-error" : undefined}
        />
        {age !== null && (
          <span className="birthdate-form__age">{age} anos</span>
        )}
        <button
          type="submit"
          className="birthdate-form__btn"
          disabled={isPending}
        >
          {isPending ? "..." : "Salvar"}
        </button>
      </div>
      {error && (
        <p id="birthdate-error" role="alert" className="birthdate-form__error">
          {error}
        </p>
      )}
    </form>
  );
}
