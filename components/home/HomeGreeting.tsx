import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HomeGreetingProps {
  today: Date;
}

export function HomeGreeting({ today }: HomeGreetingProps) {
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const dateStr = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="greeting">
      <h1>{greeting}. Hoje é {dateStr}.</h1>
      <p>Seu espaço para registrar o dia, sem pressão.</p>
    </div>
  );
}
