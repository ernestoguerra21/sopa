"use client";

import { useEffect, useRef, useState } from "react";
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
    await api.timeEntries.create({ employeeId, date });
    load();
  }

  async function saveFromTimer(hours: number) {
    await api.timeEntries.create({ employeeId, date: new Date().toISOString().slice(0, 10), hours });
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

      {needsHours ? (
        <Cronometro key={employeeId} onStop={saveFromTimer} />
      ) : (
        <form onSubmit={addEntry} className="glass" style={{ padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Fecha</label>
            <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button type="submit" className="btn-glow" style={{ height: "42px", padding: "0 18px" }}>Registrar día</button>
        </form>
      )}

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

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function Cronometro({ onStop }: { onStop: (hours: number) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [, forceTick] = useState(0);
  const startedAt = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function currentElapsed() {
    return elapsedMs + (running && startedAt.current ? Date.now() - startedAt.current : 0);
  }

  function play() {
    startedAt.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(() => forceTick(t => t + 1), 1000);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsedMs(currentElapsed());
    startedAt.current = null;
    setRunning(false);
  }

  function stop() {
    const finalMs = currentElapsed();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    startedAt.current = null;
    setElapsedMs(0);
    if (finalMs > 0) onStop(Math.round((finalMs / 3600000) * 100) / 100);
  }

  return (
    <div className="glass" style={{ padding: "20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "1px", fontVariantNumeric: "tabular-nums" }}>
        {formatElapsed(currentElapsed())}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        {!running ? (
          <CronoBtn onClick={play} color="var(--green)"><IconPlay /></CronoBtn>
        ) : (
          <CronoBtn onClick={pause} color="var(--amber)"><IconPause /></CronoBtn>
        )}
        <CronoBtn onClick={stop} color="var(--red)" disabled={!running && elapsedMs === 0}><IconStop /></CronoBtn>
      </div>
    </div>
  );
}

function CronoBtn({ onClick, color, disabled, children }: { onClick: () => void; color: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "44px", height: "44px", borderRadius: "12px", cursor: disabled ? "not-allowed" : "pointer",
      background: "rgba(255,255,255,0.05)", border: `1px solid ${disabled ? "var(--border)" : color}`,
      color: disabled ? "var(--text-muted)" : color,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: disabled ? 0.4 : 1, transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function IconPlay() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>; }
function IconPause() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>; }
function IconStop() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>; }
