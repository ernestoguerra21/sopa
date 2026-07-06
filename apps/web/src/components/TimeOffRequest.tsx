"use client";

import { useEffect, useState } from "react";
import { api, TimeOff } from "@/lib/api";

export function TimeOffRequest({ employeeId }: { employeeId: string }) {
  const [requests, setRequests] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "VACATION",
    startDate: "",
    endDate: "",
    reason: "",
  });

  async function load() {
    const data = await api.timeOff.listByEmployee(employeeId);
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [employeeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.timeOff.create({
        employeeId,
        type: form.type as any,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      load();
      setForm({ type: "VACATION", startDate: "", endDate: "", reason: "" });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  const pending = requests.filter(r => r.status === "PENDING");
  const approved = requests.filter(r => r.status === "APPROVED");

  return (
    <div style={{ marginTop: "32px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
        Vacaciones y Ausencias
      </h2>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "10px 16px",
          fontSize: "13px",
          fontFamily: "inherit",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        {showForm ? "Cancelar" : "Solicitar ausencia"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Tipo</label>
            <select
              className="glass-input"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="VACATION">Vacaciones</option>
              <option value="SICK_LEAVE">Licencia por enfermedad</option>
              <option value="PERSONAL">Asuntos personales</option>
              <option value="UNPAID">Licencia sin sueldo</option>
            </select>
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Desde</label>
              <input
                type="date"
                className="glass-input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Hasta</label>
              <input
                type="date"
                className="glass-input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Motivo (opcional)</label>
            <textarea
              className="glass-input"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Describe el motivo de tu ausencia..."
              style={{ minHeight: "80px", fontFamily: "inherit", fontSize: "13px" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.startDate || !form.endDate}
            className="btn-glow"
            style={{ height: "42px" }}
          >
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Cargando...</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--amber)", marginBottom: "10px" }}>Pendientes de aprobación ({pending.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pending.map(req => (
                  <div key={req.id} className="glass" style={{ padding: "10px 12px", fontSize: "12px" }}>
                    <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>
                      {new Date(req.startDate).toLocaleDateString("es-ES")} - {new Date(req.endDate).toLocaleDateString("es-ES")}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {req.type === "VACATION" && "Vacaciones"}
                      {req.type === "SICK_LEAVE" && "Licencia por enfermedad"}
                      {req.type === "PERSONAL" && "Asuntos personales"}
                      {req.type === "UNPAID" && "Licencia sin sueldo"}
                    </div>
                    {req.reason && <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>{req.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>Aprobadas ({approved.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {approved.map(req => (
                  <div key={req.id} className="glass" style={{ padding: "10px 12px", fontSize: "12px", background: "rgba(34,197,94,0.05)", borderLeft: "3px solid #22c55e" }}>
                    <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>
                      {new Date(req.startDate).toLocaleDateString("es-ES")} - {new Date(req.endDate).toLocaleDateString("es-ES")}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      Aprobado {req.approvedAt && `el ${new Date(req.approvedAt).toLocaleDateString("es-ES")}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin solicitudes de ausencia</p>
          )}
        </>
      )}
    </div>
  );
}
