"use client";

import { useEffect, useState } from "react";
import { api, Employee } from "@/lib/api";

export default function RrhhPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [form,      setForm]      = useState({ name: "", position: "" });

  async function load() {
    const data = await api.employees.list();
    setEmployees(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) return;
    await api.employees.create(form);
    setForm({ name: "", position: "" });
    setCreating(false);
    load();
  }

  async function toggleStatus(emp: Employee) {
    await api.employees.update(emp.id, { status: emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
    load();
  }

  async function remove(id: string) {
    await api.employees.remove(id);
    load();
  }

  const active = employees.filter(e => e.status === "ACTIVE").length;

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Equipo</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{active} activos de {employees.length}</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Añadir empleado
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text" autoFocus
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
                className="glass-input" style={{ flex: 1 }}
              />
              <input
                type="text"
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                placeholder="Puesto (camarero, cocina...)"
                className="glass-input" style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreating(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-glow" style={{ padding: "8px 20px" }}>Añadir</button>
            </div>
          </form>
        </div>
      )}

      {/* Employee list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>👥</div>
          <p style={{ fontSize: "13px" }}>Aún no hay empleados registrados</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {employees.map((emp, i) => (
            <div key={emp.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`}
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", opacity: emp.status === "INACTIVE" ? 0.55 : 1 }}>
              {/* Avatar */}
              <div style={{
                width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px",
                background: emp.status === "ACTIVE" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "13px", color: "#fff",
                boxShadow: emp.status === "ACTIVE" ? "0 0 12px rgba(99,102,241,0.3)" : "none",
              }}>
                {emp.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{emp.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{emp.position}</div>
              </div>

              {/* Status pill */}
              <button onClick={() => toggleStatus(emp)} style={{
                fontSize: "11px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
                padding: "4px 10px", borderRadius: "99px", transition: "all 0.15s",
                background: emp.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${emp.status === "ACTIVE" ? "rgba(16,185,129,0.25)" : "var(--border)"}`,
                color: emp.status === "ACTIVE" ? "var(--green)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                {emp.status === "ACTIVE" && <span className="dot-green" />}
                {emp.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </button>

              {/* Delete */}
              <button onClick={() => remove(emp.id)}
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
