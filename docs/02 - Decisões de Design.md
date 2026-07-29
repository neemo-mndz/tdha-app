# 🎨 Decisões de Design e Arquitetura

Este documento guarda o *porquê* das coisas serem como são. Quando você esquecer por que não usou uma biblioteca X ou por que o botão Y é de uma certa cor, a resposta estará aqui.

## 1. Identidade Visual (TDAH Friendly)
- **Paleta de Cores:** Sóbria (verde/terracota). Evita o excesso de estímulos de cores vibrantes puras (vermelho gritante, azul elétrico), promovendo um ambiente calmo para registro.
- **Tipografia:** `Outfit` para títulos (arredondada e amigável), `Inter` para leitura, `IBM Plex Mono` para números/horas. Ajuda na hierarquia visual sem ser agressiva.
- **Formas:** Border-radius generoso (18px) cria um design "soft" e convidativo, que reduz a ansiedade de abrir o app para registrar uma falha ou dia ruim.

## 2. Decisões Arquiteturais
- **Next.js 15 App Router:** Facilita o uso de Server Actions, removendo a necessidade de criar arquivos de API separados. Tudo acontece no mesmo componente.
- **Drizzle ORM + Neon DB:** Drizzle é mais leve e *type-safe* que o Prisma. Neon permite ter o banco na nuvem com instâncias "Serverless" rápidas e escaláveis, casando perfeitamente com a Vercel.
- **Optimistic UI:** Pessoas com TDAH precisam de *feedback imediato*. O uso de `useOptimistic` garante que, ao clicar em "Salvar", a tarefa apareça instantaneamente na tela, sem esperar o banco de dados responder. Se houver erro, a interface reverte.

## 3. O que evitamos
- **TailwindCSS (Por enquanto):** Preferiu-se manter CSS puro global (Vanilla CSS) para manter o controle absoluto das micro-interações, mas temos um plano de refatoração futura se os arquivos crescerem muito.
- **Gráficos complexos:** A página inicial não deve ter gráficos que "julguem" o usuário se ele falhar na semana. Apenas uma visão rápida do dia.
