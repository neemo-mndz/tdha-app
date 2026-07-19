"use client";

import { useState, useCallback } from "react";
import type { UserProfile } from "@/lib/types/profile";
import { AvatarUploader } from "./AvatarUploader";
import { NameForm } from "./NameForm";
import { BirthDateForm } from "./BirthDateForm";
import { PasswordForm } from "./PasswordForm";
import { DaySelector } from "./DaySelector";
import { ReportActions } from "./ReportActions";
import Link from "next/link";
import { startOfWeek, format } from "date-fns";

interface ProfilePageProps {
  user: UserProfile;
  daysWithLogs: string[];
}

export function ProfilePage({ user, daysWithLogs }: ProfilePageProps) {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [selectedDays, setSelectedDays] = useState<string[]>(daysWithLogs);
  const [weekOffset, setWeekOffset] = useState(0);

  const handleSelectionChange = useCallback((days: string[]) => {
    setSelectedDays(days);
  }, []);

  const handleWeekOffsetChange = useCallback((offset: number) => {
    setWeekOffset(offset);
    // When navigating to a different week, deselect all days
    // (unless returning to the original week)
    if (offset === 0) {
      setSelectedDays(daysWithLogs);
    } else {
      setSelectedDays([]);
    }
  }, [daysWithLogs]);

  return (
    <div className="profile-page">
      {/* Header with back link */}
      <header className="profile-page__header">
        <Link href="/" className="profile-page__back">
          ← Voltar
        </Link>
        <h1 className="profile-page__title">Perfil</h1>
      </header>

      {/* Avatar */}
      <section className="profile-page__section">
        <AvatarUploader
          currentAvatarUrl={user.avatarUrl}
          userName={user.name}
          userEmail={user.email}
        />
      </section>

      {/* Name form */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Nome</h2>
        <NameForm currentName={user.name} />
      </section>

      {/* Birth date form */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Data de nascimento</h2>
        <BirthDateForm currentBirthDate={user.birthDate} />
      </section>

      {/* Email (read-only) */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Email</h2>
        <p className="profile-page__email">{user.email}</p>
      </section>

      {/* Account creation date */}
      <section className="profile-page__section">
        <p className="profile-page__created-at">
          Conta criada em{" "}
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </section>

      {/* Password form */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Alterar senha</h2>
        <PasswordForm />
      </section>

      {/* Report export section */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">
          Exportar relatório semanal
        </h2>
        <DaySelector
          weekStart={weekStart}
          daysWithData={weekOffset === 0 ? daysWithLogs : []}
          selectedDays={selectedDays}
          onSelectionChange={handleSelectionChange}
          weekOffset={weekOffset}
          onWeekOffsetChange={handleWeekOffsetChange}
        />
        <ReportActions userName={user.name} selectedDays={selectedDays} />
      </section>
    </div>
  );
}
