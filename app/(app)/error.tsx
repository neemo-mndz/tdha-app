'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main>
      <p>Algo deu errado ao carregar o calendário.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
