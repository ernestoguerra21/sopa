"use client";

import { useEffect, useState } from "react";
import { api, Business } from "@/lib/api";
import { getActiveBusinessId, setActiveBusinessId } from "@/lib/auth";

export default function NegociosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    try {
      const data = await api.businesses.list();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la lista de negocios");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await api.businesses.create({ name });
      setName("");
      setCreating(false);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo crear el negocio");
    }
  }

  function startEdit(b: Business) {
    setEditingId(b.id);
    setEditName(b.name);
  }

  async function saveEdit(id: string) {
    await api.businesses.update(id, { name: editName });
    setEditingId(null);
    load();
  }

  async function remove(b: Business) {
    setError("");
    try {
      await api.businesses.remove(b.id);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el negocio");
    }
  }

  function activate(b: Business) {
    setActiveBusinessId(b.id);
    window.location.reload();
  }

  const activeId = getActiveBusinessId();

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Negocios</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{businesses.length} negocios en tu organización</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Crear negocio
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {creating && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px" }}>
            <input className="glass-input" style={{ flex: 1 }} placeholder="Nombre del negocio" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <button type="button" onClick={() => setCreating(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "0 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button type="submit" className="btn-glow" style={{ padding: "0 20px" }}>Crear</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : businesses.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin negocios registrados.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {businesses.map((b, i) => (
            <div key={b.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px" }}>
              <div style={{
                width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "13px", color: "#fff",
                boxShadow: "0 0 12px rgba(99,102,241,0.3)",
              }}>
                {b.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === b.id ? (
                  <input className="glass-input" style={{ maxWidth: "260px" }} value={editName} onChange={e => setEditName(e.target.value)} />
                ) : (
                  <>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{b.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{b.slug}</div>
                  </>
                )}
              </div>

              {b.id === activeId && <span className="badge-low" style={{ color: "var(--green)" }}>Activo</span>}

              {editingId === b.id ? (
                <button onClick={() => saveEdit(b.id)} className="btn-glow" style={{ padding: "6px 14px", fontSize: "12px" }}>Guardar</button>
              ) : (
                <>
                  {b.id !== activeId && (
                    <button onClick={() => activate(b)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                      Cambiar a este
                    </button>
                  )}
                  <button onClick={() => startEdit(b)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => remove(b)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
