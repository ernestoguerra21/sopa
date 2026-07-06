"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function TimeOffCalendar() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendar, setCalendar] = useState<{ date: string; employees: { id: string; name: string }[] }[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.timeOff.calendar(month, year);
      setCalendar(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [month, year]);

  function getDaysInMonth() {
    return new Date(year, month, 0).getDate();
  }

  function getFirstDayOfMonth() {
    return new Date(year, month - 1, 1).getDay();
  }

  const days = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const calendarDays: (number | null)[] = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div style={{ marginTop: "32px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
        Calendario de vacaciones
      </h2>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => { setMonth(previousMonth); setYear(previousYear); }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "inherit",
          }}
        >
          ← Anterior
        </button>

        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
          {new Date(year, month - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </h3>

        <button
          onClick={() => { setMonth(nextMonth); setYear(nextYear); }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "inherit",
          }}
        >
          Siguiente →
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px" }}>Cargando...</p>
      ) : (
        <div className="glass" style={{ padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  padding: "8px",
                  textTransform: "uppercase",
                }}
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day, idx) => {
              const dateStr = day
                ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;
              const dayCalendar = dateStr ? calendar.find((c) => c.date === dateStr) : null;
              const hasEmployees = dayCalendar && dayCalendar.employees.length > 0;

              return (
                <div
                  key={idx}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "6px",
                    fontSize: "11px",
                    background: hasEmployees ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)",
                    border: hasEmployees ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--border)",
                    color: day ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {day && <div style={{ fontWeight: 600 }}>{day}</div>}
                  {hasEmployees && (
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", overflow: "hidden" }}>
                      {dayCalendar.employees.slice(0, 2).map((emp) => (
                        <div key={emp.id} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {emp.name}
                        </div>
                      ))}
                      {dayCalendar.employees.length > 2 && (
                        <div style={{ fontSize: "8px" }}>+{dayCalendar.employees.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
