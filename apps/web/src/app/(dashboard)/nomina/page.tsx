"use client";

import { useEffect, useState } from "react";
import { api, PayrollRecord, Employee } from "@/lib/api";
import { getActiveBusinessId } from "@/lib/auth";

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
  const [companyName, setCompanyName] = useState("");

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

  useEffect(() => {
    const activeId = getActiveBusinessId();
    api.businesses.list().then(bs => {
      const b = bs.find(x => x.id === activeId) ?? bs[0];
      if (b) setCompanyName(b.name);
    }).catch(() => {});
  }, []);

  function printReceipt(r: PayrollRecord) {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) { setError("Permite las ventanas emergentes para imprimir el recibo"); return; }
    win.document.write(receiptHtml(r, companyName));
    win.document.close();
    win.focus();
    win.onload = () => { win.print(); };
    // Fallback si onload ya pasó
    setTimeout(() => { try { win.print(); } catch {} }, 300);
  }

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

  // Desglose por tramos a partir del bruto actual (mismos tramos que cuba-calculator.ts)
  function breakdownFor(g: number) {
    const round = (n: number) => Math.round(n * 100) / 100;
    const ss: { bracket: string; amount: number }[] = [];
    ss.push({ bracket: "Hasta 15,000 @ 5%", amount: round(Math.min(g, 15000) * 0.05) });
    if (g > 15000) ss.push({ bracket: "Exceso de 15,000 @ 10%", amount: round((g - 15000) * 0.1) });

    const tax: { bracket: string; amount: number }[] = [];
    if (g <= 3260) {
      tax.push({ bracket: "Exento hasta 3,260", amount: 0 });
    } else {
      if (g > 3260) tax.push({ bracket: "3,260 - 9,510 @ 3%", amount: round((Math.min(g, 9510) - 3260) * 0.03) });
      if (g > 9510) tax.push({ bracket: "9,510 - 15,000 @ 5%", amount: round((Math.min(g, 15000) - 9510) * 0.05) });
      if (g > 15000) tax.push({ bracket: "15,000 - 20,000 @ 7.5%", amount: round((Math.min(g, 20000) - 15000) * 0.075) });
      if (g > 20000) tax.push({ bracket: "20,000 - 25,000 @ 10%", amount: round((Math.min(g, 25000) - 20000) * 0.1) });
      if (g > 25000) tax.push({ bracket: "25,000 - 30,000 @ 15%", amount: round((Math.min(g, 30000) - 25000) * 0.15) });
      if (g > 30000) tax.push({ bracket: "30,000+ @ 20%", amount: round((g - 30000) * 0.2) });
    }
    return { socialSecurityBreakdown: ss, incomeTaxBreakdown: tax };
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
            <button onClick={() => printReceipt({
              ...editing,
              grossSalary: fGross || "0",
              socialSecurityDeduction: fSS || "0",
              incomeTaxDeduction: fTax || "0",
              otherDeductions: fOther || "0",
              totalDeductions: String(Number(fSS) + Number(fTax) + Number(fOther)),
              netSalary: String(Number(fGross) - (Number(fSS) + Number(fTax) + Number(fOther))),
              calculationDetails: breakdownFor(Number(fGross) || 0),
            })} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 18px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              Recibo PDF
            </button>
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

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function receiptHtml(record: PayrollRecord, company: string) {
  const emp = record.employee;
  const fullName = [emp?.name, emp?.lastName].filter(Boolean).join(" ");
  const gross = Number(record.grossSalary);
  const ss = Number(record.socialSecurityDeduction);
  const tax = Number(record.incomeTaxDeduction);
  const other = Number(record.otherDeductions ?? 0);
  const total = Number(record.totalDeductions);
  const net = Number(record.netSalary);

  const row = (label: string, amount: string, opts: { bold?: boolean; sub?: boolean } = {}) => `
    <tr${opts.bold ? ' style="font-weight:700;background:#f3f4f6"' : ""}>
      <td style="padding:${opts.sub ? "3px 8px 3px 24px" : "5px 8px"};border:1px solid #ddd${opts.sub ? ";color:#666;font-size:11px" : ""}">${label}</td>
      <td style="padding:${opts.sub ? "3px 8px" : "5px 8px"};border:1px solid #ddd;text-align:right;width:160px${opts.sub ? ";color:#666;font-size:11px" : ""}">${amount}</td>
    </tr>`;

  const ssBrackets = (record.calculationDetails?.socialSecurityBreakdown ?? [])
    .map(b => row(esc(b.bracket), money(b.amount), { sub: true })).join("");
  const taxBrackets = (record.calculationDetails?.incomeTaxBreakdown ?? [])
    .map(b => row(esc(b.bracket), money(b.amount), { sub: true })).join("");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Recibo ${esc(fullName)} - ${MESES[record.month - 1]} ${record.year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; color: #111; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.5; padding: 40px; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px">
    <div>
      <div style="font-size:18px;font-weight:700">${esc(company) || "Empresa"}</div>
      <div style="font-size:11px;color:#555">Empresa pagadora</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:14px;font-weight:600">Recibo individual de salarios</div>
      <div style="font-size:12px;color:#555">Período: ${MESES[record.month - 1]} ${record.year}</div>
    </div>
  </div>

  <table style="font-size:12px;margin-bottom:18px">
    <tbody>
      <tr>
        <td style="padding:4px 8px;background:#f3f4f6;font-weight:600;width:22%;border:1px solid #ddd">Trabajador/a</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${esc(fullName) || "—"}</td>
        <td style="padding:4px 8px;background:#f3f4f6;font-weight:600;width:16%;border:1px solid #ddd">Carnet de identidad</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${esc(emp?.documentId) || "—"}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;background:#f3f4f6;font-weight:600;border:1px solid #ddd">Categoría / Puesto</td>
        <td style="padding:4px 8px;border:1px solid #ddd" colspan="3">${esc(emp?.position) || "—"}</td>
      </tr>
    </tbody>
  </table>

  <div style="font-weight:700;font-size:13px;margin-bottom:6px">I. DEVENGOS</div>
  <table style="font-size:12px;margin-bottom:16px"><tbody>
    ${row("Salario base", money(gross))}
    ${row("A. TOTAL DEVENGADO", money(gross), { bold: true })}
  </tbody></table>

  <div style="font-weight:700;font-size:13px;margin-bottom:6px">II. DEDUCCIONES</div>
  <table style="font-size:12px;margin-bottom:16px"><tbody>
    ${row("Contribución a la Seguridad Social", money(ss))}
    ${ssBrackets}
    ${row("Impuesto sobre Ingresos Personales", money(tax))}
    ${taxBrackets}
    ${other > 0 ? row("Otras deducciones", money(other)) : ""}
    ${row("B. TOTAL A DEDUCIR", money(total), { bold: true })}
  </tbody></table>

  <table style="font-size:14px;margin-bottom:28px"><tbody>
    <tr style="font-weight:700">
      <td style="padding:9px 8px;border:2px solid #111">LÍQUIDO TOTAL A PERCIBIR (A − B)</td>
      <td style="padding:9px 8px;border:2px solid #111;text-align:right;width:160px">${money(net)}</td>
    </tr>
  </tbody></table>

  <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px;color:#555">
    <div>Recibí,<br><br>_______________________<br>Firma del trabajador/a</div>
    <div style="text-align:right">Fecha: ___ / ___ / ${record.year}<br><br>_______________________<br>Sello y firma de la empresa</div>
  </div>
</body></html>`;
}
