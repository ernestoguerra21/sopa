"use client";

import { useEffect, useRef, useState } from "react";
import { api, Task, TimeEntry, User } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { TimeOffRequest } from "@/components/TimeOffRequest";

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` };
}

export default function FicharPage() {
  const [me, setMe] = useState<User | null>(getStoredUser());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const fresh = await api.auth.me();
    setMe(fresh);
    const { from, to } = monthRange();
    const [entriesData, tasksData] = await Promise.all([
      api.timeEntries.list(fresh.id, from, to),
      api.tasks.list(),
    ]);
    setEntries(entriesData);
    setTasks(tasksData);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function registerDay(e: React.FormEvent) {
    e.preventDefault();
    await api.timeEntries.create({ date });
    load();
  }

  async function saveFromTimer(hours: number) {
    await api.timeEntries.create({ date: new Date().toISOString().slice(0, 10), hours });
    load();
  }

  const needsHours = me?.payRateType === "POR_HORA";
  const totalDays = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  if (loading) return <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>;

  return (
    <div className="animate-fade-up delay-0">
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
        Mi fichaje
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
        {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {!me?.payRateType && (
        <p style={{ fontSize: "12px", color: "var(--amber)", marginBottom: "16px" }}>
          Tu tipo de tarifa aún no está definido — pide a tu gerente que lo configure para que tu fichaje alimente la nómina.
        </p>
      )}

      {needsHours ? (
        <Cronometro onStop={saveFromTimer} />
      ) : (
        <form onSubmit={registerDay} className="glass" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Fecha</label>
            <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button type="submit" className="btn-glow" style={{ height: "42px", padding: "0 20px" }}>Registrar día trabajado</button>
        </form>
      )}

      <div style={{ display: "flex", gap: "16px", margin: "16px 0 12px", fontSize: "12px", color: "var(--text-muted)" }}>
        <span><strong style={{ color: "var(--text-primary)" }}>{totalDays}</strong> días este mes</span>
        {needsHours && <span><strong style={{ color: "var(--text-primary)" }}>{totalHours}</strong> horas totales</span>}
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin fichajes este mes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "32px" }}>
          {entries.map(entry => (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                {new Date(entry.date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
              </span>
              {entry.hours != null && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{entry.hours}h</span>}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
        Mis tareas
      </h2>
      {tasks.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin tareas asignadas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {tasks.map(task => (
            <div key={task.id} className="glass" style={{ padding: "12px 14px", opacity: task.status === "DONE" ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-primary)", textDecoration: task.status === "DONE" ? "line-through" : "none" }}>
                  {task.title}
                </span>
                <PriorityBadge p={task.priority} />
              </div>
              {task.dueDate && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Límite: {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {me && <TimeOffRequest employeeId={me.id} />}
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "HIGH" ? "badge-high" : p === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={cls}>{p === "HIGH" ? "Alta" : p === "MEDIUM" ? "Media" : "Baja"}</span>;
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
