# Product Steering — Weekly Companion App

## Propósito

Este produto NÃO é um app de produtividade ou to-do list tradicional.

É um sistema de suporte cognitivo para pessoas com TDAH (ADHD), construído em torno da ideia de que:

> As pessoas com TDAH vivem a vida em semanas, não em dias isolados.

O produto deve ajudar o usuário a:
- Visualizar a semana com clareza.
- Registrar experiências diárias com fricção mínima.
- Relembrar o que aconteceu ao longo da semana.
- Reduzir overwhelm e desorganização.

## Usuário-alvo

Pessoas neurodivergentes, especialmente com TDAH, que:
- Têm dificuldade de percepção de tempo (time blindness).
- Abandonam apps de produtividade tradicionais por excesso de fricção.
- Sentem culpa/pressão com mecânicas de streak e cobrança.
- Precisam de baixíssimo custo cognitivo para manter um hábito.

## Problemas centrais que o produto resolve

1. Cegueira temporal ao longo dos dias da semana.
2. Dificuldade de acompanhar progresso semanal.
3. Esquecimento do que aconteceu durante a semana.
4. Abandono do produto por alta fricção de uso.
5. Overwhelm causado por sistemas complexos.
6. Inconsistência no registro diário.

## Princípios de design (não negociáveis)

- **Sem features de IA** (nesta fase do produto).
- **Sem onboarding complexo.** O usuário deve entender a tela principal em segundos.
- **Sem fluxos multi-etapas** para ações centrais (logar, lembrar, ver a semana).
- **Sem mecânicas de culpa.** Proibido: streaks, contadores de dias perdidos, notificações de cobrança, badges de "falha".
- **Toda ação central deve ser executável em menos de 10 segundos**, do tap inicial até a confirmação.
- **O calendário é a UI central.** Todas as outras telas orbitam o calendário semanal, nunca o substituem.
- **Velocidade > estrutura.** Prefira permitir um registro "sujo" e rápido a exigir categorização antes de salvar.
- **Clareza > quantidade de features.** Se uma feature aumenta a carga cognitiva da tela principal, ela não entra no MVP.
- **Consciência semanal > pressão diária.** O produto nunca deve fazer o usuário sentir que "perdeu o dia"; ele deve poder reentrar na semana a qualquer momento sem penalidade (soft re-entry).

## Diferenciação

- Mapa mental semanal (não uma lista de tarefas).
- Indicadores de consciência temporal (gaps visíveis na semana, sem julgamento).
- Anti-abandono: reentrada suave, sem punição por dias sem log.
- Logging ultra-rápido como prioridade sobre qualquer estrutura de dados.

## Fases do produto (referência — cada fase vira specs separadas no Kiro)

- **Fase 1 (MVP):** Calendário semanal, sistema de logs diários, captura instantânea, lembretes básicos, overview semanal.
- **Fase 2 (Engajamento):** Timeline semanal em formato de "história", cores por dia, micro-prompts, lembretes gentis, reflexão semanal opcional.
- **Fase 3 (Estrutura, sem IA):** Tags, categorização simples, busca entre logs, filtros por semana/tipo.

## Inspiração de UX

Stripe e Notion como referência de clareza visual em SaaS; padrões de UI amigáveis a TDAH (baixa densidade de informação, uma ação primária por tela, espaço em branco generoso).
