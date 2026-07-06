import { User } from "./api";

export function saveToken(token: string) {
  localStorage.setItem("sopa_token", token);
}

export function clearToken() {
  localStorage.removeItem("sopa_token");
}

export function saveUser(user: User) {
  localStorage.setItem("sopa_user", JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sopa_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("sopa_token");
  localStorage.removeItem("sopa_user");
  localStorage.removeItem("sopa_business_id");
}

export function getActiveBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sopa_business_id");
}

export function setActiveBusinessId(id: string) {
  localStorage.setItem("sopa_business_id", id);
}
