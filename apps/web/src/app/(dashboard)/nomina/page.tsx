"use client";

import { useEffect, useState } from "react";
import { api, PayrollRecord, Employee } from "@/lib/api";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const now = new Date();

function money(v: string | number) {
  return Number(v).toLocaleString("es-CU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NominaPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [recs, emps] = await Promise.all([api.payroll.list(month, year), api.employees.list()]);
      setRecords(recs);
      setEmployees(emps);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la nómina");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [month, year]);

  async function generateAll() {
    setError("");
    setGenerating(true);
    try {
      const active = employees.filter(e => e.status === "ACTIVE");
      for (const emp of active) {
        await api.payroll.generate(emp.id, month, year);
      }
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo generar la nómina");
    } finally {
      setGenerating(false);
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api.payroll.remove(id);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  const totalNeto = records.reduce((s, r) => s + Number(r.netSalary), 0);
  const totalRet = records.reduce((s, r) => s + Number(r.totalDeductions), 0);

  return (
    <div className="page-container" style={{ maxWidth: "920px", margin: "0 auto" }}>
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Nómina</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Resolución 41/2023 · {records.length} nóminas · Neto {money(totalNeto)} · Retenido {money(totalRet)}</p>
        </div>
        <button onClick={generateAll} disabled={generating} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px", opacity: generating ? 0.6 : 1 }}>
          {generating ? "Generando..." : `Generar ${MESES[month - 1]}`}
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <select className="glass-input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ maxWidth: "160px" }}>
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="glass-input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ maxWidth: "110px" }}>
          {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : records.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin nóminas para {MESES[month - 1]} {year}. Pulsa &quot;Generar&quot; para calcularlas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {records.map((r, i) => (
            <div key={r.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{r.employee?.name ?? "—"}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{r.employee?.position ?? ""}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: "100px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Bruto</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{money(r.grossSalary)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: "100px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Retenido</div>
                  <div style={{ fontSize: "13px", color: "#fca5a5" }}>-{money(r.totalDeductions)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: "110px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Neto</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--green)" }}>{money(r.netSalary)}</div>
                </div>
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "12px", fontFamily: "inherit" }}>
                  {expanded === r.id ? "Ocultar" : "Detalle"}
                </button>
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                  </svg>
                </button>
              </div>

              {expanded === r.id && r.calculationDetails && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", gap: "32px", fontSize: "12px" }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>Seguridad Social</div>
                    {r.calculationDetails.socialSecurityBreakdown.map((b, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: "var(--text-secondary)", padding: "2px 0" }}>
                        <span>{b.bracket}</span><span>{money(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>Impuesto Ingresos Personales</div>
                    {r.calculationDetails.incomeTaxBreakdown.map((b, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: "var(--text-secondary)", padding: "2px 0" }}>
                        <span>{b.bracket}</span><span>{money(b.amount)}</span>
                      </div>
                    ))}
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
