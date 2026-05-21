export interface AuthUser {
  username: string;
}

const CREDENTIALS = [
  { username: 'Zaii', password: 'P@ssword122825' },
  { username: 'Ruru', password: 'P@ssword091425' },
];

const AUTH_KEY = 'ledger-console:auth';

export function login(username: string, password: string): AuthUser | null {
  const match = CREDENTIALS.find(
    (c) => c.username.toLowerCase() === username.toLowerCase() && c.password === password,
  );
  if (!match) return null;
  const user: AuthUser = { username: match.username };
  try { sessionStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  return user;
}

export function logout(): void {
  try { sessionStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
