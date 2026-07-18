# Implementation Plan: Edit Log Time

## Overview

Implementa a funcionalidade de edição de horário (`createdAt`) de logs existentes. O plano segue a arquitetura definida no design: schema Zod → query DB → Server Action → atualização do componente LogItem com input de horário no modo de edição.

## Tasks

- [x] 1. Criar schema de validação e query de banco de dados
  - [x] 1.1 Adicionar `updateLogTimeSchema` em `lib/validation/log.schema.ts`
    - Criar o schema Zod com campos `logId` (UUID), `time` (regex HH:mm + range 00-23/00-59), e `date` (yyyy-MM-dd)
    - Exportar o tipo `UpdateLogTimeInput`
    - Reutilizar os schemas internos existentes (`logIdSchema`, `dateSchema`) quando possível
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.2 Adicionar `updateLogCreatedAt` em `lib/db/queries/logs.ts`
    - Criar função que recebe `logId: string` e `newCreatedAt: Date` e executa UPDATE no campo `createdAt`
    - Seguir o padrão de `updateLogById` existente
    - _Requirements: 1.2_

- [x] 2. Implementar Server Action e testes de validação
  - [x] 2.1 Adicionar `updateLogTime` Server Action em `lib/actions/logs.ts`
    - Importar `updateLogTimeSchema` e `updateLogCreatedAt`
    - Validar input com Zod, verificar autenticação e autorização via `getLogOwner`
    - Construir `newCreatedAt` a partir de `date` + `time`
    - Chamar `updateLogCreatedAt` e `revalidatePath`
    - Retornar `{ success: true }` ou `{ success: false, error: "..." }`
    - Tratar caso de log não encontrado com "Registro não encontrado"
    - Tratar caso de não-proprietário com "Não autorizado"
    - _Requirements: 1.2, 1.5, 2.3, 3.1, 3.2, 3.3_

  - [ ]* 2.2 Escrever property test para validação de horário (Property 1)
    - **Property 1: Time validation accepts valid times and rejects invalid ones**
    - Gerar strings aleatórias com fast-check e verificar que o schema aceita apenas strings no formato `/^\d{2}:\d{2}$/` com horas em [0,23] e minutos em [0,59]
    - Mínimo 100 iterações
    - Arquivo: `lib/validation/__tests__/log.schema.test.ts`
    - **Validates: Requirements 1.4, 2.1, 2.2, 2.4**

  - [ ]* 2.3 Escrever property test para preservação de data (Property 2)
    - **Property 2: Time update preserves date portion**
    - Gerar datas válidas (yyyy-MM-dd) e horários válidos (HH:mm) com fast-check, construir timestamp e verificar que a porção de data é preservada
    - Mínimo 100 iterações
    - Arquivo: `lib/validation/__tests__/log.schema.test.ts`
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Escrever unit tests para Server Action `updateLogTime`
    - Testar retorno de erro para input inválido (formato errado, fora de range, vazio)
    - Testar retorno "Não autorizado" para log de outro usuário
    - Testar retorno "Registro não encontrado" para UUID inexistente
    - Testar sucesso para proprietário com input válido
    - Arquivo: `lib/actions/__tests__/logs.test.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 3. Checkpoint - Validação do backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Atualizar componente LogItem com seletor de horário
  - [x] 4.1 Adicionar input de horário ao modo de edição do `LogItem`
    - Adicionar state `editTime` inicializado com `format(new Date(log.createdAt), "HH:mm")`
    - Renderizar `<input type="time">` no modo de edição, ao lado do textarea, com `aria-label="Selecionar horário do registro"`
    - Pre-preencher com o horário atual do log
    - Garantir navegação por Tab, setas e Enter (nativo do input type="time")
    - _Requirements: 1.1, 4.1, 4.2, 4.6_

  - [x] 4.2 Integrar chamada a `updateLogTime` no fluxo de salvar
    - No `handleUpdate`, detectar se `editTime` mudou em relação ao horário original
    - Se mudou, chamar `updateLogTime({ logId, time: editTime, date })` adicionalmente
    - Exibir erro retornado pela action abaixo do input de horário
    - Em caso de erro, reverter `editTime` ao valor original
    - Em caso de sucesso, a lista será reordenada via `revalidatePath`
    - _Requirements: 1.2, 1.3, 1.5, 4.3_

  - [x] 4.3 Implementar cancelamento e validação client-side
    - No cancelamento, reverter `editTime` ao valor original salvo
    - Adicionar validação client-side: impedir submit se formato não é HH:mm ou valores fora de range
    - Exibir mensagem de erro inline quando formato é inválido
    - _Requirements: 4.4, 4.5_

  - [ ]* 4.4 Escrever property test para autorização (Property 3)
    - **Property 3: Non-owner authorization is always rejected**
    - Gerar pares de userId ≠ ownerId com fast-check, mockar `getCurrentUserId` e `getLogOwner`, verificar que a action retorna erro de autorização
    - Mínimo 100 iterações
    - Arquivo: `lib/actions/__tests__/logs.test.ts`
    - **Validates: Requirements 3.2**

  - [ ]* 4.5 Escrever unit tests para o componente LogItem atualizado
    - Testar que TimePickerInput é renderizado pré-preenchido no modo edição
    - Testar que cancelamento reverte o horário ao valor original
    - Testar que erro do server action é exibido ao usuário
    - Testar que input time possui aria-label correto
    - Arquivo: `components/logs/__tests__/LogItem.test.tsx`
    - _Requirements: 1.1, 1.5, 4.1, 4.4, 4.6_

- [x] 5. Final checkpoint - Validação completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- A reordenação da lista acontece automaticamente via `revalidatePath` + query existente com `ORDER BY createdAt ASC`
- O input nativo `type="time"` fornece acessibilidade (Tab, setas, Enter) sem JS adicional

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] }
  ]
}
```
