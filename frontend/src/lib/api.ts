const API_BASE_URL = "https://api.draw.mixdev.me";

export type BoardListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Board = BoardListItem & {
  data: any;
};

function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as any),
  };

  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearToken();
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(json?.error || `http_${res.status}`);
  }
  return json as T;
}

export async function register(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string } }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function listBoards() {
  return request<{ items: BoardListItem[] }>("/boards", { method: "GET" });
}

export async function createBoard(name?: string) {
  return request<Board>("/boards", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getBoard(id: string) {
  return request<Board>(`/boards/${id}`, { method: "GET" });
}

export async function saveBoard(id: string, data: any, name?: string) {
  return request<Board>(`/boards/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data, name }),
  });
}

