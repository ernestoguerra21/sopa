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
  const [employeeId, setEmployeeId] = useState("");
  const [generating, setGenerating] = useState(false);

  // Formulario de edición
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [fGross, setFGross] = useState("");
  const [fSS, setFSS] = useState("");
  const [fTax, setFTax] = useState("");
  const [fOther, setFOther] = useState("");
  const [saving, setSaving] = useState(false);

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
  useEffect(() => { load(); setEditing(null); }, [month, year]);

  function openEditor(r: PayrollRecord) {
    setEditing(r);
    setFGross(String(Number(r.grossSalary)));
    setFSS(String(Number(r.socialSecurityDeduction)));
    setFTax(String(Number(r.incomeTaxDeduction)));
    setFOther(String(Number(r.otherDeductions ?? 0)));
  }

  async function generate() {
    if (!employeeId) { setError("Selecciona un trabajador"); return; }
    setError("");
    setGenerating(true);
    try {
      const rec = await api.payroll.generate(employeeId, month, year);
      await load();
      // Abrir directamente el formulario del recién generado
      const fresh = await api.payroll.list(month, year);
      const found = fresh.find(r => r.employeeId === employeeId);
      if (found) openEditor(found);
    } catch (err: any) {
      setError(err.message || "No se pudo generar la nómina");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!editing) return;
    setError("");
    setSaving(true);
    try {
      const updated = await api.payroll.update(editing.id, {
        grossSalary: Number(fGross),
        socialSecurityDeduction: Number(fSS),
        incomeTaxDeduction: Number(fTax),
        otherDeductions: Number(fOther),
      });
      setEditing(null);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  // Al cambiar el bruto en el formulario, recalcular retenciones legales en vivo (mismos tramos que el backend)
  function onGrossChange(v: string) {
    setFGross(v);
    const g = Number(v);
    if (!isFinite(g) || g < 0) return;
    // Seguridad Social
    let ss = Math.min(g, 15000) * 0.05;
    if (g > 15000) ss += (g - 15000) * 0.1;
    // Impuesto
    let tax = 0;
    if (g > 3260) tax += (Math.min(g, 9510) - 3260) * 0.03;
    if (g > 9510) tax += (Math.min(g, 15000) - 9510) * 0.05;
    if (g > 15000) tax += (Math.min(g, 20000) - 15000) * 0.075;
    if (g > 20000) tax += (Math.min(g, 25000) - 20000) * 0.1;
    if (g > 25000) tax += (Math.min(g, 30000) - 25000) * 0.15;
    if (g > 30000) tax += (g - 30000) * 0.2;
    setFSS(String(Math.round(ss * 100) / 100));
    setFTax(String(Math.round(tax * 100) / 100));
  }

  async function remove(id: string) {
    setError("");
    try {
      await api.payroll.remove(id);
      if (editing?.id === id) setEditing(null);
      load();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  const previewTotal = Number(fSS) + Number(fTax) + Number(fOther);
  const previewNet = Number(fGross) - previewTotal;
  const totalNeto = records.reduce((s, r) => s + Number(r.netSalary), 0);

  const labelStyle = { fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", display: "block" } as const;

  return (
    <div className="page-container" style={{ maxWidth: "920px", margin: "0 auto" }}>
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Nómina</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Resolución 41/2023 · {records.length} nóminas en {MESES[month - 1]} {year} · Neto total {money(totalNeto)}</p>
        </div>
      </div>

      {/* Generador: trabajador + mes/año */}
      <div className="glass animate-fade-up delay-1" style={{ padding: "16px", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: "200px" }}>
          <label style={labelStyle}>Trabajador</label>
          <select className="glass-input" style={{ width: "100%" }} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
            <option value="">Seleccionar...</option>
            {employees.filter(e => e.status === "ACTIVE").map(e => (
              <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: "130px" }}>
          <label style={labelStyle}>Mes</label>
          <select className="glass-input" style={{ width: "100%" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ minWidth: "90px" }}>
          <label style={labelStyle}>Año</label>
          <select className="glass-input" style={{ width: "100%" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={generating || !employeeId} className="btn-glow" style={{ height: "38px", padding: "0 20px", opacity: generating || !employeeId ? 0.5 : 1 }}>
          {generating ? "Generando..." : "Generar nómina"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Formulario de ajuste manual */}
      {editing && (
        <div className="glass animate-scale-in" style={{ padding: "20px", marginBottom: "20px", borderColor: "rgba(99,102,241,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{editing.employee?.name}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{editing.employee?.position} · {MESES[editing.month - 1]} {editing.year}</div>
            </div>
            <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", fontFamily: "inherit" }}>✕ Cerrar</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Salario bruto</label>
              <input type="number" step="0.01" min="0" className="glass-input" style={{ width: "100%" }} value={fGross} onChange={e => onGrossChange(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Seguridad Social</label>
              <input type="number" step="0.01" min="0" className="glass-input" style={{ width: "100%" }} value={fSS} onChange={e => setFSS(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Impuesto Ingresos</label>
              <input type="number" step="0.01" min="0" className="glass-input" style={{ width: "100%" }} value={fTax} onChange={e => setFTax(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Otras deducciones</label>
              <input type="number" step="0.01" min="0" className="glass-input" style={{ width: "100%" }} value={fOther} onChange={e => setFOther(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Total retenido: <span style={{ color: "#fca5a5" }}>-{money(isFinite(previewTotal) ? previewTotal : 0)}</span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--green)" }}>
              Neto a cobrar: {money(isFinite(previewNet) ? previewNet : 0)}
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={save} disabled={saving} className="btn-glow" style={{ padding: "8px 24px", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar ajustes"}
            </button>
          </div>
        </div>
      )}

      {/* Lista del mes */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : records.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin nóminas para {MESES[month - 1]} {year}. Selecciona un trabajador y pulsa &quot;Generar nómina&quot;.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {records.map((r, i) => (
            <div key={r.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`}
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", cursor: "pointer", borderColor: editing?.id === r.id ? "rgba(99,102,241,0.4)" : undefined }}
              onClick={() => openEditor(r)}>
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
              <button onClick={e => { e.stopPropagation(); remove(r.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
