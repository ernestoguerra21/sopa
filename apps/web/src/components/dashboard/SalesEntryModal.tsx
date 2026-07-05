"use client";

import { useState } from "react";
import { api, Summary } from "@/lib/api";

export function SalesEntryModal({ current, onClose, onSave }: {
  current: Summary | null; onClose: () => void; onSave: () => void;
}) {
  const [sales,    setSales]    = useState(current?.sales?.toString() ?? "");
  const [expenses, setExpenses] = useState(current?.expenses?.toString() ?? "");
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const s = parseFloat(sales);
  const ex = parseFloat(expenses);
  const profit = !isNaN(s) && !isNaN(ex) ? s - ex : null;
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(s) || isNaN(ex)) { setError("Introduce valores numéricos válidos"); return; }
    setLoading(true); setError("");
    try {
      await api.dashboard.createSalesEntry({ sales: s, expenses: ex, notes });
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-lg" style={{ width: "100%", maxWidth: "380px", padding: "28px", margin: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
              Ventas del día
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1 1 13"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Ventas totales
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "14px" }}>€</span>
              <input type="number" step="0.01" min="0" value={sales} onChange={e => setSales(e.target.value)}
                placeholder="0.00" required className="glass-input" style={{ paddingLeft: "28px" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Gastos del día
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "14px" }}>€</span>
              <input type="number" step="0.01" min="0" value={expenses} onChange={e => setExpenses(e.target.value)}
                placeholder="0.00" required className="glass-input" style={{ paddingLeft: "28px" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Notas (opcional)
            </label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Turno completo, cierre anticipado..." className="glass-input" />
          </div>

          {/* Live profit preview */}
          {profit !== null && (
            <div style={{
              background: profit >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${profit >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: "12px", padding: "14px 16px",
              animation: "scaleIn 0.2s var(--easing-back)",
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Beneficio estimado</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 700, color: profit >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmt(profit)}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: "42px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", transition: "all 0.15s" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-glow" style={{ flex: 1, height: "42px" }}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
