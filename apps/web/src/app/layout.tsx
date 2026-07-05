import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOPA — Sistema Operativo Para Administradores",
  description: "Gestión operativa para hostelería",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
