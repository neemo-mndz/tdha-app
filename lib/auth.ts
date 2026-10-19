import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession, renewSession } from "@/lib/auth/session";

/**
 * Obtém o ID do usuário autenticado no contexto atual (Server Component ou Server Action).
 *
 * - Lê o cookie `session_id` via `cookies()`
 * - Valida a sessão no banco com `validateSession()`
 * - Renova a sessão (rolling 30 dias) com `renewSession()`
 * - Se não autenticado: `redirect('/login')` — funciona tanto em Server Components
 *   (renderiza redirect) quanto em Server Actions (lança NEXT_REDIRECT internamente)
 */
export async function getCurrentUserId(returnTo?: "/quick-capture"): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect(returnTo === "/quick-capture" ? "/login?next=/quick-capture" : "/login");
  }

  const session = await validateSession(sessionId);

  if (!session) {
    redirect(returnTo === "/quick-capture" ? "/login?next=/quick-capture" : "/login");
  }

  // Rolling session: renova expiração a cada request autenticado
  await renewSession(sessionId);

  return session.userId;
}
