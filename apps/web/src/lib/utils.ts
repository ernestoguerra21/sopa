import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(
    new Date(date),
  );
}
