import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weekly Companion',
  description: 'Seu companheiro semanal para registros diários',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
