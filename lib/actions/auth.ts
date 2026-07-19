"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerSchema, loginSchema } from "@/lib/auth/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, invalidateSession } from "@/lib/auth/session";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/auth/rate-limit";
import {
  findUserByEmail,
  createUser,
  emailExists,
} from "@/lib/db/queries/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const COOKIE_NAME = "session_id";
const COOKIE_MAX_AGE_DEFAULT = 2592000; // 30 days in seconds
const COOKIE_MAX_AGE_REMEMBER = 7776000; // 90 days in seconds

function getSessionCookieOptions(rememberMe: boolean = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: rememberMe ? COOKIE_MAX_AGE_REMEMBER : COOKIE_MAX_AGE_DEFAULT,
  };
}

/**
 * Server action para registro de novo usuário.
 *
 * Flow:
 * 1. Extrai email, password, confirmPassword do formData
 * 2. Valida com registerSchema → se falha, retorna fieldErrors
 * 3. Verifica emailExists() → se true, retorna erro email_exists
 * 4. hashPassword(password)
 * 5. createUser(email, passwordHash)
 * 6. createSession(userId)
 * 7. Set cookie com session_id
 * 8. redirect('/')
 */
export async function registerAction(formData: FormData): Promise<ActionResult> {
  const rawEmail = formData.get("email") ?? "";
  const rawPassword = formData.get("password") ?? "";
  const rawConfirmPassword = formData.get("confirmPassword") ?? "";

  const parsed = registerSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field && typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    const exists = await emailExists(email);
    if (exists) {
      return {
        success: false,
        error: "email_exists",
        fieldErrors: { email: "Esse email já está cadastrado" },
      };
    }

    const passwordHash = await hashPassword(password);
    const userId = await createUser(email, passwordHash);

    const sessionId = await createSession(userId);
    if (!sessionId) {
      return {
        success: false,
        error: "unknown",
        fieldErrors: { email: "Algo deu errado. Tente novamente." },
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionId, getSessionCookieOptions());
  } catch (error) {
    console.error("Register action failed:", error);
    return {
      success: false,
      error: "unknown",
      fieldErrors: { email: "Algo deu errado. Tente novamente." },
    };
  }

  redirect("/");
}

/**
 * Server action para login de usuário existente.
 *
 * Flow:
 * 1. Extrai email, password do formData
 * 2. Valida com loginSchema → se falha, retorna fieldErrors
 * 3. checkRateLimit(email) → se blocked, retorna erro rate_limited
 * 4. findUserByEmail(email) → se não encontrado, recordFailedAttempt + retorna erro
 * 5. verifyPassword(password, hash) → se false, recordFailedAttempt + retorna erro
 * 6. clearFailedAttempts(email)
 * 7. createSession(userId)
 * 8. Set cookie
 * 9. redirect('/')
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawEmail = formData.get("email") ?? "";
  const rawPassword = formData.get("password") ?? "";
  const rememberMe = formData.get("rememberMe") === "true";

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field && typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    const rateLimit = await checkRateLimit(email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "rate_limited",
        fieldErrors: {
          email: "Muitas tentativas. Aguarde alguns minutos.",
        },
      };
    }

    const user = await findUserByEmail(email);
    if (!user) {
      await recordFailedAttempt(email);
      return {
        success: false,
        error: "invalid_credentials",
        fieldErrors: {
          email: "Email ou senha incorretos",
        },
      };
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await recordFailedAttempt(email);
      return {
        success: false,
        error: "invalid_credentials",
        fieldErrors: {
          email: "Email ou senha incorretos",
        },
      };
    }

    await clearFailedAttempts(email);

    const sessionId = await createSession(user.id);
    if (!sessionId) {
      return {
        success: false,
        error: "unknown",
        fieldErrors: { email: "Algo deu errado. Tente novamente." },
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionId, getSessionCookieOptions(rememberMe));
  } catch (error) {
    console.error("Login action failed:", error);
    return {
      success: false,
      error: "unknown",
      fieldErrors: { email: "Algo deu errado. Tente novamente." },
    };
  }

  redirect("/");
}

/**
 * Server action para logout do usuário.
 *
 * Flow:
 * 1. Lê session_id do cookie
 * 2. Invalida sessão no banco
 * 3. Remove cookie
 * 4. Redirect para /login
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId) {
    await invalidateSession(sessionId);
  }

  cookieStore.delete(COOKIE_NAME);

  redirect("/login");
}
