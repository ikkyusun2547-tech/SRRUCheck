import { getItem, setItem, deleteItem } from "./storage";

export type AuthUser = {
  id: string;
  email: string;
  role: "student" | "admin";
  profileCompleted: boolean;
  firstName: string | null;
  lastName: string | null;
};

const TOKEN_KEY = "srrucheck_token";
const USER_KEY = "srrucheck_user";

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function storeSession(token: string, user: AuthUser): Promise<void> {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await deleteItem(TOKEN_KEY);
  await deleteItem(USER_KEY);
}
