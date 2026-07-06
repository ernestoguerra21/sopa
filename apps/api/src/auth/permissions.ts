export type Permission =
  | "organization.view"
  | "organization.manage"
  | "business.view"
  | "business.manage"
  | "users.manage"
  | "roles.manage"
  | "dashboard.view"
  | "sales.view"
  | "sales.edit"
  | "finance.view"
  | "hr.view"
  | "hr.manage"
  | "tasks.view"
  | "tasks.manage"
  | "inventory.view"
  | "inventory.manage"
  | "suppliers.manage"
  | "purchase_orders.manage"
  | "reports.view"
  | "settings.manage";

export const ORGANIZATION_ROLE_PERMISSIONS = {
  OWNER: [
    "organization.view",
    "organization.manage",
    "business.view",
    "business.manage",
    "users.manage",
    "roles.manage",
    "dashboard.view",
    "sales.view",
    "sales.edit",
    "finance.view",
    "hr.view",
    "hr.manage",
    "tasks.view",
    "tasks.manage",
    "inventory.view",
    "inventory.manage",
    "suppliers.manage",
    "purchase_orders.manage",
    "reports.view",
    "settings.manage",
  ],
  ADMIN_ORG: [
    "organization.view",
    "business.view",
    "business.manage",
    "users.manage",
    "dashboard.view",
    "sales.view",
    "finance.view",
    "hr.view",
    "hr.manage",
    "tasks.manage",
    "inventory.manage",
    "suppliers.manage",
    "purchase_orders.manage",
    "reports.view",
  ],
  FINANCE_MANAGER: [
    "business.view",
    "dashboard.view",
    "sales.view",
    "finance.view",
    "reports.view",
  ],
  HR_MANAGER: [
    "business.view",
    "hr.view",
    "hr.manage",
    "users.manage",
  ],
  READ_ONLY: [
    "organization.view",
    "business.view",
    "dashboard.view",
    "reports.view",
  ],
} satisfies Record<string, Permission[]>;

export const BUSINESS_ROLE_PERMISSIONS = {
  MANAGER: [
    "business.view",
    "dashboard.view",
    "sales.view",
    "sales.edit",
    "hr.view",
    "tasks.view",
    "tasks.manage",
    "inventory.view",
    "inventory.manage",
    "suppliers.manage",
    "purchase_orders.manage",
  ],
  OPERATIONS_MANAGER: [
    "business.view",
    "dashboard.view",
    "tasks.view",
    "tasks.manage",
    "inventory.view",
    "inventory.manage",
    "suppliers.manage",
    "purchase_orders.manage",
  ],
  INVENTORY_MANAGER: [
    "business.view",
    "inventory.view",
    "inventory.manage",
    "suppliers.manage",
    "purchase_orders.manage",
  ],
  SUPERVISOR: [
    "business.view",
    "dashboard.view",
    "sales.view",
    "sales.edit",
    "tasks.view",
    "tasks.manage",
    "inventory.view",
  ],
  STAFF: [
    "tasks.view",
  ],
  READ_ONLY: [
    "business.view",
    "dashboard.view",
    "tasks.view",
    "inventory.view",
  ],
} satisfies Record<string, Permission[]>;
