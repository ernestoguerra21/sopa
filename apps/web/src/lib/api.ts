const BASE = "/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sopa_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/auth/me"),
  },
  dashboard: {
    summary: () => request<Summary>("/dashboard/summary"),
    alerts: () => request<Alert[]>("/dashboard/alerts"),
    dismissAlert: (id: string) =>
      request(`/dashboard/alerts/${id}`, { method: "DELETE" }),
    createSalesEntry: (data: { sales: number; expenses: number; notes?: string }) =>
      request("/dashboard/sales-entry", { method: "POST", body: JSON.stringify(data) }),
  },
  tasks: {
    list: () => request<Task[]>("/tasks"),
    create: (data: Partial<Task>) =>
      request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: Task["status"]) =>
      request(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    remove: (id: string) => request(`/tasks/${id}`, { method: "DELETE" }),
  },
  employees: {
    list: () => request<Employee[]>("/employees"),
    create: (data: { name: string; position: string }) =>
      request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Employee, "name" | "position" | "status">>) =>
      request(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/employees/${id}`, { method: "DELETE" }),
  },
  inventory: {
    list: () => request<InventoryItem[]>("/inventory"),
    create: (data: { name: string; unit: string; quantity?: number; minQuantity?: number }) =>
      request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<InventoryItem, "name" | "unit" | "quantity" | "minQuantity">>) =>
      request(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/inventory/${id}`, { method: "DELETE" }),
  },
};

export interface Employee {
  id: string;
  name: string;
  position: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "SUPERVISOR";
  tenant: { id: string; name: string };
}

export interface Summary {
  sales: number;
  expenses: number;
  profit: number;
  activeEmployees: number;
  pendingTasks: number;
  pendingOrders: number;
  hasEntry: boolean;
}

export interface Alert {
  id: string;
  type: "LOW_STOCK" | "OVERDUE_TASK" | "PENDING_ORDER" | "CONTRACT_EXPIRING";
  message: string;
  dismissed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  dueDate?: string;
  assigneeId?: string;
  assignee?: { id: string; name: string } | null;
  createdAt: string;
}
