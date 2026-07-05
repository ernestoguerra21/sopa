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
    create: (data: EmployeeInput) =>
      request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<EmployeeInput>) =>
      request(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/employees/${id}`, { method: "DELETE" }),
  },
  departments: {
    list: () => request<Department[]>("/departments"),
    create: (data: { name: string; parentId?: string }) =>
      request<Department>("/departments", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/departments/${id}`, { method: "DELETE" }),
  },
  timeEntries: {
    list: (employeeId: string, from?: string, to?: string) => {
      const params = new URLSearchParams({ employeeId, ...(from ? { from } : {}), ...(to ? { to } : {}) });
      return request<TimeEntry[]>(`/time-entries?${params}`);
    },
    create: (data: { employeeId: string; date: string; hours?: number }) =>
      request<TimeEntry>("/time-entries", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/time-entries/${id}`, { method: "DELETE" }),
  },
  inventory: {
    list: () => request<InventoryItem[]>("/inventory"),
    create: (data: { name: string; unit: string; quantity?: number; minQuantity?: number }) =>
      request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<InventoryItem, "name" | "unit" | "quantity" | "minQuantity">>) =>
      request(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/inventory/${id}`, { method: "DELETE" }),
  },
  suppliers: {
    list: () => request<Supplier[]>("/suppliers"),
    create: (data: { name: string; contact?: string; phone?: string }) =>
      request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Supplier, "name" | "contact" | "phone">>) =>
      request(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/suppliers/${id}`, { method: "DELETE" }),
  },
  purchaseOrders: {
    list: () => request<PurchaseOrder[]>("/purchase-orders"),
    create: (data: { supplierId: string; notes?: string; items: { name: string; quantity: number; unit: string; inventoryItemId?: string }[] }) =>
      request<PurchaseOrder>("/purchase-orders", { method: "POST", body: JSON.stringify(data) }),
    receive: (id: string) => request(`/purchase-orders/${id}/receive`, { method: "PATCH" }),
    cancel: (id: string) => request(`/purchase-orders/${id}/cancel`, { method: "PATCH" }),
    remove: (id: string) => request(`/purchase-orders/${id}`, { method: "DELETE" }),
  },
};

export interface EmployeeInput {
  name: string;
  position: string;
  status?: "ACTIVE" | "INACTIVE";
  lastName?: string;
  documentId?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  departmentId?: string | null;
  managerId?: string | null;
  contractType?: "FIJO" | "TEMPORAL";
  payRateType?: "POR_HORA" | "POR_DIA" | "MENSUAL_FIJO";
  payRate?: number;
  scheduleType?: "FIJO" | "ROTATIVO" | "ABIERTO";
  scheduleDetail?: { days?: string[]; startTime?: string; endTime?: string } | null;
}

export interface Employee extends EmployeeInput {
  id: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  department?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
}

export interface Department {
  id: string;
  name: string;
  parentId?: string | null;
  _count?: { employees: number };
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  hours?: number | null;
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

export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  inventoryItemId?: string | null;
}

export interface PurchaseOrder {
  id: string;
  status: "PENDING" | "RECEIVED" | "CANCELLED";
  notes?: string | null;
  supplierId: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
  createdAt: string;
}
