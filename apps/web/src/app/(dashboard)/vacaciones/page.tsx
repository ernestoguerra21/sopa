"use client";

import { useEffect, useState } from "react";
import { api, TimeOff } from "@/lib/api";
import { TimeOffCalendar } from "@/components/TimeOffCalendar";

export default function VacacionesPage() {
  const [pending, setPending] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  async function load() {
    const data = await api.timeOff.listByBusiness("PENDING");
    setPending(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    setApproving(id);
    try {
      await api.timeOff.approve(id);
      load();
    } finally {
      setApproving(null);
    }
  }

  async function handleReject(id: string) {
    setApproving(id);
    try {
      await api.timeOff.reject(id);
      load();
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="animate-fade-up delay-0">
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
        Vacaciones y Ausencias
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
        Gestiona solicitudes de vacaciones y visualiza el calendario de ausentismo
      </p>

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
          Solicitudes pendientes de aprobación ({pending.length})
        </h2>

        {loading ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Cargando...</p>
        ) : pending.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin solicitudes pendientes.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map((request) => (
              <div key={request.id} className="glass" style={{ padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                    {request.employee?.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {new Date(request.startDate).toLocaleDateString("es-ES")} - {new Date(request.endDate).toLocaleDateString("es-ES")}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {request.type === "VACATION" && "Vacaciones"}
                    {request.type === "SICK_LEAVE" && "Licencia por enfermedad"}
                    {request.type === "PERSONAL" && "Asuntos personales"}
                    {request.type === "UNPAID" && "Licencia sin sueldo"}
                  </div>
                  {request.reason && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
                      {request.reason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={approving === request.id}
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      opacity: approving === request.id ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {approving === request.id ? "..." : "Aprobar"}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={approving === request.id}
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#ef4444",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      opacity: approving === request.id ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {approving === request.id ? "..." : "Rechazar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TimeOffCalendar />
    </div>
  );
}
