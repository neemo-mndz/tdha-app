export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  createdAt: Date;
}

export type ActionResult = { success: true } | { success: false; error: string };
