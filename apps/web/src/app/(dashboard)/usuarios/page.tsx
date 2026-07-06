"use client";

import { useEffect, useState } from "react";
import { api, Member, MembersResponse, BusinessRole, OrganizationRole } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

const ORG_ROLE_LABELS: Record<OrganizationRole, string> = {
  OWNER: "Propietario",
  ADMIN_ORG: "Administrador",
  FINANCE_MANAGER: "Gestor financiero",
  HR_MANAGER: "Gestor RRHH",
  READ_ONLY: "Solo lectura",
};

const BUSINESS_ROLE_LABELS: Record<BusinessRole, string> = {
  MANAGER: "Gerente",
  OPERATIONS_MANAGER: "Gerente de operaciones",
  INVENTORY_MANAGER: "Gerente de inventario",
  SUPERVISOR: "Supervisor",
  STAFF: "Empleado",
  READ_ONLY: "Solo lectura",
};

export default function UsuariosPage() {
  const me = getStoredUser();
  const canManageRoles = me?.organizationRoles?.includes("OWNER") ?? false;

  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", organizationRole: "READ_ONLY" as OrganizationRole, businessRole: "" as BusinessRole | "" });

  async function load() {
    try {
      const res = await api.members.list();
      setData(res);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setError("");
    try {
      await api.members.invite({
        name: form.name,
        email: form.email,
        password: form.password,
        organizationRole: form.organizationRole,
        businessRole: form.businessRole || undefined,
      });
      setForm({ name: "", email: "", password: "", organizationRole: "READ_ONLY", businessRole: "" });
      setInviting(false);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo invitar al usuario");
    }
  }

  async function changeOrgRole(member: Member, role: OrganizationRole) {
    await api.members.updateRoles(member.userId, { organizationRole: role });
    load();
  }

  async function changeBusinessRole(member: Member, role: string) {
    await api.members.updateRoles(member.userId, { businessRole: role || null });
    load();
  }

  async function remove(member: Member) {
    try {
      await api.members.remove(member.userId);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar al usuario");
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Usuarios</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {data ? `${data.members.length} usuarios en ${data.organization.name}` : "Cargando..."}
          </p>
        </div>
        <button onClick={() => setInviting(true)} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Invitar usuario
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {!canManageRoles && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Solo el propietario puede cambiar roles. Puedes invitar y eliminar usuarios si tienes permiso de gestión.
        </p>
      )}

      {inviting && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input className="glass-input" style={{ flex: 1 }} placeholder="Nombre completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input type="email" className="glass-input" style={{ flex: 1 }} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <input type="password" className="glass-input" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <div style={{ display: "flex", gap: "10px" }}>
              <select className="glass-input" style={{ flex: 1 }} value={form.organizationRole} onChange={e => setForm({ ...form, organizationRole: e.target.value as OrganizationRole })}>
                {Object.entries(ORG_ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select className="glass-input" style={{ flex: 1 }} value={form.businessRole} onChange={e => setForm({ ...form, businessRole: e.target.value as BusinessRole })}>
                <option value="">Sin rol de negocio</option>
                {Object.entries(BUSINESS_ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setInviting(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-glow" style={{ padding: "8px 20px" }}>Invitar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : !data || data.members.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin usuarios registrados.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.members.map((member, i) => (
            <div key={member.userId} className={`glass animate-fade-up delay-${Math.min(i, 5)}`} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px" }}>
              <div style={{
                width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "13px", color: "#fff",
                boxShadow: "0 0 12px rgba(99,102,241,0.3)",
              }}>
                {member.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{member.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{member.email}</div>
              </div>

              {canManageRoles ? (
                <>
                  <select className="glass-input" style={{ maxWidth: "150px", fontSize: "12px" }} value={member.organizationRole} onChange={e => changeOrgRole(member, e.target.value as OrganizationRole)}>
                    {Object.entries(ORG_ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                  <select className="glass-input" style={{ maxWidth: "160px", fontSize: "12px" }} value={member.businessRole ?? ""} onChange={e => changeBusinessRole(member, e.target.value)}>
                    <option value="">Sin rol de negocio</option>
                    {Object.entries(BUSINESS_ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <span className="badge-low">{ORG_ROLE_LABELS[member.organizationRole]}</span>
                  {member.businessRole && <span className="badge-low">{BUSINESS_ROLE_LABELS[member.businessRole]}</span>}
                </>
              )}

              <button onClick={() => remove(member)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", borderRadius: "6px", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
