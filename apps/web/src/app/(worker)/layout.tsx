"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, clearSession } from "@/lib/auth";
import { User } from "@/lib/api";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.push("/login");
    else if (stored.kind !== "employee") router.push("/dashboard");
    else setUser(stored);
  }, [router]);

  function logout() {
    clearSession();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-scene">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <header style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(5,5,15,0.7)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "9px",
            boxShadow: "0 0 16px rgba(99,102,241,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", color: "#fff",
          }}>S</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.tenant.name}</div>
          </div>
        </div>
        <button onClick={logout} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)",
          borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
        }}>
          Cerrar sesión
        </button>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: "640px", margin: "0 auto", padding: "28px 20px" }}>
        {children}
      </main>
    </div>
  );
}
