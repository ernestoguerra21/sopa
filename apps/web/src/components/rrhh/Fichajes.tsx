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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");

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

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    await api.timeEntries.create({ employeeId, date, hours: needsHours ? parseFloat(hours) || 0 : undefined });
    setHours("");
    load();
  }

  async function removeEntry(id: string) {
    await api.timeEntries.remove(id);
    load();
  }

  const totalDays = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  if (employees.length === 0) {
    return <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Añade empleados primero para poder registrar fichajes.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <select className="glass-input" style={{ maxWidth: "240px" }} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.lastName ?? ""}</option>)}
        </select>
        <input type="month" className="glass-input" style={{ maxWidth: "160px" }} value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {employee && !employee.payRateType && (
        <p style={{ fontSize: "12px", color: "var(--amber)", marginBottom: "12px" }}>
          Este empleado no tiene tipo de tarifa definido — edítalo en Equipo para que el fichaje alimente la nómina.
        </p>
      )}

      <form onSubmit={addEntry} className="glass" style={{ padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Fecha</label>
          <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        {needsHours && (
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Horas</label>
            <input type="number" step="0.5" min="0" className="glass-input" style={{ maxWidth: "100px" }} value={hours} onChange={e => setHours(e.target.value)} />
          </div>
        )}
        <button type="submit" className="btn-glow" style={{ height: "42px", padding: "0 18px" }}>Registrar día</button>
      </form>

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
            <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                {new Date(entry.date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {entry.hours != null && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{entry.hours}h</span>}
                <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l10 10M11 1 1 11"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
