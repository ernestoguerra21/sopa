"use client";

import { useEffect, useState, useRef } from "react";
import { api, Summary, Alert, Task } from "@/lib/api";
import { SalesEntryModal } from "@/components/dashboard/SalesEntryModal";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [salesModal, setSalesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  async function load() {
    try {
      const [s, a, t] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.alerts(),
        api.tasks.list(),
      ]);
      setSummary(s);
      setAlerts(a);
      setTasks(t.filter(x => x.status !== "DONE").slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function dismiss(id: string) {
    setDismissing(prev => new Set(prev).add(id));
    setTimeout(async () => {
      await api.dashboard.dismissAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 250);
  }

  async function toggleTask(task: Task) {
    await api.tasks.updateStatus(task.id, task.status === "DONE" ? "PENDING" : "DONE");
    load();
  }

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "13px" }}>
      <PulseLoader />
    </div>
  );

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 28px" }}>
      {/* Header */}
      <div className="animate-fade-up delay-0" style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          {today}
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          ¿Qué necesita tu negocio hoy?
        </h1>
      </div>

      {/* Metric grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <MetricCard delay={1} label="Ventas del día" value={summary?.hasEntry ? fmt(summary.sales) : null} emptyLabel="Sin datos" color="green" icon={<IconTrend />}
          action={<button onClick={() => setSalesModal(true)} style={{ marginTop: "10px", fontSize: "11px", color: "var(--accent-soft)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "14px" }}>+</span> {summary?.hasEntry ? "Actualizar" : "Introducir ventas"}
          </button>}
        />
        <MetricCard delay={2} label="Gastos" value={summary?.hasEntry ? fmt(summary.expenses) : null} color="red" icon={<IconTrendDown />} />
        <MetricCard delay={3} label="Beneficio estimado" value={summary?.hasEntry ? fmt(summary.profit) : null}
          color={summary && summary.profit >= 0 ? "green" : "red"} icon={<IconStar />} highlight={!!(summary?.hasEntry && summary.profit > 0)} />
        <MetricCard delay={4} label="Personal activo" value={summary ? String(summary.activeEmployees) : null} color="blue" icon={<IconUsers />} />
        <MetricCard delay={5} label="Tareas pendientes" value={summary ? String(summary.pendingTasks) : null}
          color={summary && summary.pendingTasks > 2 ? "amber" : "green"} icon={<IconCheck />} />
        <MetricCard delay={6} label="Compras pendientes" value={summary ? String(summary.pendingOrders) : null}
          emptyLabel="Sin pedidos" color={summary && summary.pendingOrders > 0 ? "amber" : "green"} icon={<IconCart />} />
      </div>

      {/* Lower grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Alerts */}
        <div className="animate-fade-up delay-3">
          <SectionHeader label="Alertas" count={alerts.length} countColor="var(--amber)" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {alerts.length === 0
              ? <EmptyState icon={<IconBell />} message="Sin alertas activas" />
              : alerts.map(a => (
                <div key={a.id} className={`alert-item${dismissing.has(a.id) ? " dismissing" : ""}`}>
                  <span style={{ color: "var(--amber)", marginTop: "1px", flexShrink: 0 }}><IconAlertIcon type={a.type} /></span>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{a.message}</span>
                  <button onClick={() => dismiss(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", borderRadius: "4px", flexShrink: 0, transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <IconX />
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        {/* Tasks */}
        <div className="animate-fade-up delay-4">
          <SectionHeader label="Tareas del día" action={<a href="/tasks" style={{ fontSize: "11px", color: "var(--accent-soft)", textDecoration: "none" }}>Ver todas →</a>} />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {tasks.length === 0
              ? <EmptyState icon={<IconCheck />} message="Sin tareas pendientes" />
              : tasks.map((task, i) => (
                <button key={task.id} onClick={() => toggleTask(task)}
                  className="task-item"
                  style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
                >
                  <div className={`checkbox${task.status === "DONE" ? " checked" : ""}`}>
                    {task.status === "DONE" && <IconCheckSmall />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: task.status === "DONE" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "DONE" ? "line-through" : "none", lineHeight: 1.4 }}>
                      {task.title}
                    </div>
                    {task.assignee && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{task.assignee.name}</div>}
                  </div>
                  <PriorityBadge p={task.priority} />
                </button>
              ))
            }
          </div>
        </div>
      </div>

      {salesModal && (
        <SalesEntryModal
          current={summary}
          onClose={() => setSalesModal(false)}
          onSave={() => { setSalesModal(false); load(); }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ── */

function MetricCard({ label, value, emptyLabel, color, icon, action, highlight, delay }: {
  label: string; value: string | null; emptyLabel?: string;
  color: "green"|"red"|"blue"|"amber"|"muted"; icon: React.ReactNode;
  action?: React.ReactNode; highlight?: boolean; delay: number;
}) {
  const colors = { green: "var(--green)", red: "var(--red)", blue: "var(--accent-soft)", amber: "var(--amber)", muted: "var(--text-muted)" };
  const glows  = { green: "var(--green-glow)", red: "var(--red-glow)", blue: "var(--accent-glow)", amber: "var(--amber-glow)", muted: "transparent" };
  const c = colors[color];
  return (
    <div className={`glass animate-fade-up delay-${delay}`} style={{
      padding: "18px 20px",
      ...(highlight ? { borderColor: "rgba(16,185,129,0.25)", boxShadow: `0 0 24px ${glows[color]}` } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ color: c }}>{icon}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      {value !== null
        ? <div className="metric-number" style={{ color: "var(--text-primary)" }}>{value}</div>
        : <div className="metric-number" style={{ color: "var(--text-muted)", fontSize: "16px" }}>{emptyLabel ?? "—"}</div>
      }
      {action}
    </div>
  );
}

function SectionHeader({ label, count, countColor, action }: { label: string; count?: number; countColor?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        {count !== undefined && count > 0 && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: countColor, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "99px", padding: "1px 7px" }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "13px" }}>
      {icon}{message}
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "HIGH" ? "badge-high" : p === "MEDIUM" ? "badge-medium" : "badge-low";
  const l   = p === "HIGH" ? "Alta" : p === "MEDIUM" ? "Media" : "Baja";
  return <span className={cls}>{l}</span>;
}

function PulseLoader() {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", opacity: 0.7,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite alternate` }} />
      ))}
      <style>{`@keyframes pulse { from{opacity:0.2;transform:scale(0.8)} to{opacity:0.9;transform:scale(1.1)} }`}</style>
    </div>
  );
}

function IconAlertIcon({ type }: { type: string }) {
  if (type === "LOW_STOCK")     return <IconBox />;
  if (type === "OVERDUE_TASK")  return <IconClock />;
  return <IconBell />;
}

/* ── Icon set ── */
const s = { width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.8, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconTrend()     { return <svg {...s} viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function IconTrendDown() { return <svg {...s} viewBox="0 0 24 24"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>; }
function IconStar()      { return <svg {...s} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconUsers()     { return <svg {...s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconCheck()     { return <svg {...s} viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconCheckSmall(){ return <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2 2 4-4"/></svg>; }
function IconCart()      { return <svg {...s} viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>; }
function IconBell()      { return <svg {...s} viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconBox()       { return <svg {...s} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function IconClock()     { return <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconX()         { return <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1l10 10M11 1 1 11"/></svg>; }
