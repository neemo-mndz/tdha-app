import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">
        A página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
