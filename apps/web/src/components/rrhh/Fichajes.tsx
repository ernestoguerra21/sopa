"use client";

import { useEffect, useState } from "react";
import { api, Employee, TimeEntry } from "@/lib/api";

function monthRange(monthStr: string) {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` };
}

export function Fichajes({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editHours, setEditHours] = useState("");

  const employee = employees.find(e => e.id === employeeId);
  const needsHours = employee?.payRateType === "POR_HORA";

  async function load() {
    if (!employeeId) return;
    setLoading(true);
    const { from, to } = monthRange(month);
    const data = await api.timeEntries.list(employeeId, from, to);
    setEntries(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, [employeeId, month]);

  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id);
    setEditDate(entry.date.slice(0, 10));
    setEditHours(entry.hours != null ? String(entry.hours) : "");
  }

  async function saveEdit(id: string) {
    await api.timeEntries.update(id, { date: editDate, hours: editHours ? parseFloat(editHours) : undefined });
    setEditingId(null);
    load();
  }

  async function removeEntry(id: string) {
    await api.timeEntries.remove(id);
    load();
  }

  const totalDays = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  if (employees.length === 0) {
    return <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Añade empleados primero para poder ver fichajes.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <select className="glass-input" style={{ maxWidth: "240px" }} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.lastName ?? ""}</option>)}
        </select>
        <input type="month" className="glass-input" style={{ maxWidth: "160px" }} value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
        El fichaje lo registra cada trabajador desde su propia sesión. Aquí puedes corregir horas o fechas si hay un error.
      </p>

      <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
        <span><strong style={{ color: "var(--text-primary)" }}>{totalDays}</strong> días registrados</span>
        {needsHours && <span><strong style={{ color: "var(--text-primary)" }}>{totalHours}</strong> horas totales</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : entries.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin fichajes registrados este mes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {entries.map(entry => (
            <div key={entry.id} className="glass" style={{ padding: "10px 12px" }}>
              {editingId === entry.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <input type="date" className="glass-input" style={{ maxWidth: "150px" }} value={editDate} onChange={e => setEditDate(e.target.value)} />
                  {entry.hours != null && (
                    <input type="number" step="0.1" min="0" className="glass-input" style={{ maxWidth: "90px" }} value={editHours} onChange={e => setEditHours(e.target.value)} />
                  )}
                  <button onClick={() => saveEdit(entry.id)} className="btn-glow" style={{ padding: "6px 14px", fontSize: "12px" }}>Guardar</button>
                  <button onClick={() => setEditingId(null)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>Cancelar</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    {new Date(entry.date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {entry.hours != null && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{entry.hours}h</span>}
                    <button onClick={() => startEdit(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l10 10M11 1 1 11"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
