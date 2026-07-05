"use client";

import { useEffect, useState } from "react";
import { api, Task } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = { PENDING: "Pendiente", IN_PROGRESS: "En progreso", DONE: "Hecho" };
type Filter = "ALL" | "PENDING" | "IN_PROGRESS" | "DONE";

export default function TasksPage() {
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter,   setFilter]   = useState<Filter>("ALL");
  const [form,     setForm]     = useState({ title: "", priority: "MEDIUM", dueDate: "" });
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  async function load() {
    const data = await api.tasks.list();
    setTasks(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await api.tasks.create({ title: form.title, priority: form.priority as Task["priority"], dueDate: form.dueDate || undefined });
    setForm({ title: "", priority: "MEDIUM", dueDate: "" });
    setCreating(false);
    load();
  }

  async function changeStatus(task: Task, status: Task["status"]) {
    await api.tasks.updateStatus(task.id, status);
    load();
  }

  async function remove(id: string) {
    setRemoving(prev => new Set(prev).add(id));
    setTimeout(async () => {
      await api.tasks.remove(id);
      load();
      setRemoving(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 250);
  }

  const filtered = filter === "ALL" ? tasks : tasks.filter(t => t.status === filter);
  const counts: Record<Filter, number> = {
    ALL: tasks.length,
    PENDING: tasks.filter(t => t.status === "PENDING").length,
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter(t => t.status === "DONE").length,
  };

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Tareas</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{tasks.length} tareas en total</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Nueva tarea
        </button>
      </div>

      {/* Filters */}
      <div className="animate-fade-up delay-1" style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px", border: "1px solid var(--border)" }}>
        {(["ALL","PENDING","IN_PROGRESS","DONE"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "7px 6px",
            borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: filter === f ? 500 : 400,
            fontFamily: "inherit",
            background: filter === f ? "rgba(255,255,255,0.08)" : "transparent",
            color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
            transition: "all 0.15s",
            boxShadow: filter === f ? "0 1px 6px rgba(0,0,0,0.3)" : "none",
          }}>
            {f === "ALL" ? "Todas" : STATUS_LABELS[f]}
            <span style={{ marginLeft: "4px", opacity: 0.5 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Create form */}
      {creating && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text" autoFocus
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Nombre de la tarea..."
              className="glass-input"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="glass-input" style={{ flex: 1 }}>
                <option value="LOW">Prioridad baja</option>
                <option value="MEDIUM">Prioridad media</option>
                <option value="HIGH">Prioridad alta</option>
              </select>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="glass-input" style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreating(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-glow" style={{ padding: "8px 20px" }}>Crear</button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>✓</div>
          <p style={{ fontSize: "13px" }}>Sin tareas en este estado</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map((task, i) => (
            <div key={task.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`}
              style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 16px",
                opacity: removing.has(task.id) ? 0 : 1,
                transform: removing.has(task.id) ? "translateX(12px)" : "translateX(0)",
                transition: "opacity 0.25s, transform 0.25s",
                ...(task.status === "DONE" ? { opacity: removing.has(task.id) ? 0 : 0.55 } : {}),
              }}>
              {/* Checkbox */}
              <button onClick={() => changeStatus(task, task.status === "DONE" ? "PENDING" : "DONE")}
                className={`checkbox${task.status === "DONE" ? " checked" : ""}`}>
                {task.status === "DONE" && <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2 2 4-4"/></svg>}
              </button>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: task.status === "DONE" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "DONE" ? "line-through" : "none", lineHeight: 1.4 }}>
                  {task.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
                  <PriorityBadge p={task.priority} />
                  {task.assignee && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{task.assignee.name}</span>}
                  {task.dueDate && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Límite: {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", opacity: 0 }} className="task-actions">
                {task.status === "PENDING" && (
                  <button onClick={() => changeStatus(task, "IN_PROGRESS")}
                    style={{ fontSize: "11px", color: "var(--accent-soft)", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    Iniciar
                  </button>
                )}
                <button onClick={() => remove(task.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", borderRadius: "6px", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.glass:hover .task-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "HIGH" ? "badge-high" : p === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={cls}>{p === "HIGH" ? "Alta" : p === "MEDIUM" ? "Media" : "Baja"}</span>;
}
