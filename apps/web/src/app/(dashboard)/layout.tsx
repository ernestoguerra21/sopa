"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getStoredUser, clearSession, getActiveBusinessId, setActiveBusinessId } from "@/lib/auth";
import { api, Business, User } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Centro de operaciones", icon: IconHome },
  { href: "/tasks",     label: "Tareas",                icon: IconCheck },
  { href: "/rrhh",      label: "RRHH",                  icon: IconUsers },
  { href: "/inventario",label: "Inventario",             icon: IconBox },
  { href: "/compras",   label: "Compras",                icon: IconCart },
  { href: "/proveedores",label: "Proveedores",           icon: IconTruck },
  { href: "/usuarios",  label: "Usuarios",               icon: IconShield },
  { href: "/negocios",  label: "Negocios",               icon: IconBuilding },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.push("/login");
    else if (stored.kind === "employee") router.push("/fichar");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    api.businesses.list().then(list => {
      setBusinesses(list);
      const stored = getActiveBusinessId();
      const match = list.find(b => b.id === stored) ?? list[0];
      if (match) {
        setActiveBusinessIdState(match.id);
        if (stored !== match.id) setActiveBusinessId(match.id);
      }
    }).catch(() => {});
  }, [user]);

  function switchBusiness(id: string) {
    setActiveBusinessId(id);
    window.location.reload();
  }

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() { clearSession(); router.push("/login"); }

  const currentLabel = NAV.find(n => n.href === pathname)?.label ?? "SOPA";

  return (
    <div style={{ position: "relative", display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Background scene */}
      <div className="bg-scene">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Mobile backdrop */}
      <div className={`sidebar-backdrop${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />

      {/* Sidebar */}
      <aside className={`app-sidebar${menuOpen ? " open" : ""}`} style={{
        background: "rgba(5,5,15,0.7)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderRight: "1px solid var(--border)",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              width: "32px", height: "32px", flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "9px",
              boxShadow: "0 0 16px rgba(99,102,241,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", color: "#fff",
            }}>S</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>SOPA</span>
          </div>
          {user && (
            <div style={{ background: "var(--surface)", borderRadius: "10px", padding: "10px 12px", border: "1px solid var(--border)" }}>
              {businesses.length > 1 ? (
                <select
                  value={activeBusinessId}
                  onChange={e => switchBusiness(e.target.value)}
                  style={{
                    fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", background: "transparent",
                    border: "none", padding: 0, width: "100%", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {businesses.map(b => <option key={b.id} value={b.id} style={{ background: "var(--bg-elevated)" }}>{b.name}</option>)}
                </select>
              ) : (
                <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {businesses[0]?.name ?? user.tenant.name}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span className="dot-green" />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 8px 8px" }}>
            Módulos
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? " active" : ""}`}
              >
                <Icon size={15} />
                <span style={{ flex: 1, fontSize: "13px" }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "8px 8px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "2px" }}>
          <button
            onClick={logout}
            className="nav-item"
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fca5a5"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ""; (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            <IconLogout size={15} />
            <span style={{ fontSize: "13px" }}>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
        <div className="mobile-topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <IconMenu size={18} />
          </button>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{currentLabel}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

/* ── Inline SVG icons ── */
function IconHome({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconCheck({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconUsers({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconBox({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
}
function IconCart({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}
function IconTruck({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function IconShield({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function IconBuilding({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>;
}
function IconLogout({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconMenu({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
