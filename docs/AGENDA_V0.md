# Agenda v0

O menu hambúrguer reúne Minha semana, Agenda, Acompanhamento de leitura, Histórico, Configurações e lembretes, Perfil e Sair. A navegação tem rótulos, estado atual, fechamento com Escape/clique externo e suporte a teclado.

A agenda fica em `/agenda`. O dia é uma folha com manhã, tarde, noite e itens sem período definido. A visão semanal mostra sete dias. Há navegação entre semanas, seleção de data, retorno a Hoje, filtros por assunto e contagem de pendências. A tarefa ou compromisso recebe título, data, observações, horário opcional de início/fim e uma ou mais tags: Trabalho, Casal, Pessoal e Psicóloga. É possível editar, reagendar, concluir/reabrir e excluir com confirmação. A opção “Já realizada” permite cadastrar diretamente uma tarefa concluída, inclusive com data passada. O botão flutuante “+” da agenda abre este formulário usando a data selecionada e o assunto filtrado; nas outras páginas, continua abrindo a captura rápida.

As tags classificam assuntos; Casal não compartilha dados com outra conta. Os compromissos são privados por usuário e não geram registros de atividades automaticamente. Recorrência, notificações, integração com calendários externos e edição das tags ficam fora desta versão.

## Referências consultadas

- [Todoist — visualização Em breve](https://www.todoist.com/pt-BR/help/todoist/get-started/plan-your-week-with-the-upcoming-view-OKOg1mR8): planejamento dos próximos dias e navegação semanal.
- [Sunsama — Channels and Contexts](https://help.sunsama.com/docs/getting-started/basics/channels-and-contexts/): separação por assuntos/contextos.
- [TickTick — recursos](https://ticktick.com/features): visualizações de agenda e diferenciação por tags.

A adaptação prioriza a folha diária e mantém a paleta e a tipografia do app, sem biblioteca adicional de calendário.

## Persistência e lançamento

- Schema Drizzle: `agenda_entries`, com índice em usuário/data e restrições de tamanho, tags, períodos e horários.
- Migração aditiva: `drizzle/migrations/0007_agenda_entries.sql`.
- Testada no branch Neon `dev-agenda-v0` (`br-morning-darkness-acmbzml7`), projeto `old-sky-36133942`, banco `neondb`. A tabela já está presente em produção desde a publicação da v0; a opção “Já realizada” utiliza a coluna `completed` existente e não exige nova migração.
- O snapshot Drizzle registra o schema atual, incluindo mudanças anteriores já presentes no ponto zero. O journal anterior não registrava as migrações manuais 0004–0006; a 0007 não tenta reaplicá-las. Em um banco existente, aplicar apenas a 0007, sem rodar o histórico completo automaticamente.
- O preview do branch Git `feat/agenda-v0` deve usar uma variável DATABASE_URL exclusiva do branch Neon de teste. Nenhuma credencial deve ser versionada.

## Verificação

`npm test -- components/navigation/__tests__/AppMenu.test.tsx components/agenda/__tests__/AgendaForm.test.tsx lib/actions/__tests__/agenda.test.ts lib/validation/__tests__/agenda.schema.test.ts lib/agenda/__tests__/model.test.ts`

Integração real, exclusivamente em banco isolado: definir `AGENDA_INTEGRATION=1`, `AGENDA_TEST_BRANCH` e `DATABASE_URL`, depois executar Vitest em `lib/db/queries/__tests__/agenda.integration.test.ts`. O teste cria e remove apenas suas próprias contas sintéticas.

Antes de publicar, aplicar a migração 0007 em produção e integrar o código; confirmar cadastro, edição, conclusão, filtro e navegação no celular. O menu e a agenda não exigem reinstalação do widget Android.

A migração `0008_agenda_psicologa.sql` amplia a restrição de tags para incluir `psicologa`, permitindo combinar as quatro tags. Em banco existente, aplicar apenas esta migração após a 0007.
