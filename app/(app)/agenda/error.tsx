"use client";
export default function AgendaError({ reset }: { reset: () => void }) {
  return <main className="shell"><h1>Não foi possível abrir a agenda</h1><p>Tente novamente em instantes.</p><button type="button" onClick={reset}>Tentar novamente</button></main>;
}
