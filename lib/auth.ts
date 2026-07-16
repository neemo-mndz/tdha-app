/**
 * Autenticação — funções de segurança relacionadas ao usuário
 *
 * Nota: Esta é uma implementação de stub para desenvolvimento.
 * A autenticação completa será implementada na spec 'auth'.
 */

/**
 * Obtém o ID do usuário autenticado no contexto atual (Server Component ou Server Action).
 * Lança erro se não há usuário autenticado.
 */
export async function getCurrentUserId(): Promise<string> {
  // STUB: Retorna um ID fixo para desenvolvimento
  // TODO: Integrar com middleware/session após spec 'auth'
  return "550e8400-e29b-41d4-a716-446655440000";
}
