"use client";

import { useState } from "react";
import { api, Department, Employee, EmployeeInput } from "@/lib/api";

const WEEKDAYS = [
  { key: "mon", label: "L" }, { key: "tue", label: "M" }, { key: "wed", label: "X" },
  { key: "thu", label: "J" }, { key: "fri", label: "V" }, { key: "sat", label: "S" }, { key: "sun", label: "D" },
];

export function EmployeeFormModal({ employee, employees, departments, onClose, onSave }: {
  employee: Employee | null;
  employees: Employee[];
  departments: Department[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<EmployeeInput>({
    name: employee?.name ?? "",
    position: employee?.position ?? "",
    lastName: employee?.lastName ?? "",
    documentId: employee?.documentId ?? "",
    birthDate: employee?.birthDate?.slice(0, 10) ?? "",
    address: employee?.address ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    password: "",
    departmentId: employee?.departmentId ?? "",
    managerId: employee?.managerId ?? "",
    contractType: employee?.contractType,
    payRateType: employee?.payRateType,
    payRate: employee?.payRate,
    scheduleType: employee?.scheduleType,
    scheduleDetail: employee?.scheduleDetail ?? { days: [], startTime: "", endTime: "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: string) {
    const days = form.scheduleDetail?.days ?? [];
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    set("scheduleDetail", { ...form.scheduleDetail, days: next });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) return;
    if (!form.documentId?.trim()) { setError("El carnet de identidad es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      const payload: EmployeeInput = {
        ...form,
        departmentId: form.departmentId || null,
        managerId: form.managerId || null,
        payRate: form.payRate ? Number(form.payRate) : undefined,
        scheduleDetail: form.scheduleType === "FIJO" ? form.scheduleDetail : null,
      };
      if (employee) await api.employees.update(employee.id, payload);
      else await api.employees.create(payload);
      onSave();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const managerOptions = employees.filter(e => e.id !== employee?.id);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-lg" style={{ width: "100%", maxWidth: "560px", padding: "28px", margin: "16px", maxHeight: "88vh", overflowY: "auto" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>
          {employee ? "Editar empleado" : "Nuevo empleado"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FieldGroup label="Datos personales">
            <Row>
              <Field label="Nombre" required><input className="glass-input" value={form.name} onChange={e => set("name", e.target.value)} /></Field>
              <Field label="Apellidos"><input className="glass-input" value={form.lastName} onChange={e => set("lastName", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Carnet de identidad" required><input className="glass-input" value={form.documentId} onChange={e => set("documentId", e.target.value)} /></Field>
              <Field label="Teléfono"><input className="glass-input" value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Fecha nacimiento"><input type="date" className="glass-input" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} /></Field>
              <Field label="Dirección"><input className="glass-input" value={form.address} onChange={e => set("address", e.target.value)} /></Field>
            </Row>
          </FieldGroup>

          <FieldGroup label="Puesto y organigrama">
            <Row>
              <Field label="Puesto / cargo" required><input className="glass-input" value={form.position} onChange={e => set("position", e.target.value)} /></Field>
              <Field label="Departamento">
                <select className="glass-input" value={form.departmentId ?? ""} onChange={e => set("departmentId", e.target.value)}>
                  <option value="">Sin asignar</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            </Row>
            <Field label="Jefe directo">
              <select className="glass-input" value={form.managerId ?? ""} onChange={e => set("managerId", e.target.value)}>
                <option value="">Sin jefe directo</option>
                {managerOptions.map(e => <option key={e.id} value={e.id}>{e.name} {e.lastName ?? ""}</option>)}
              </select>
            </Field>
          </FieldGroup>

          <FieldGroup label="Contrato y salario">
            <Row>
              <Field label="Tipo de contrato">
                <select className="glass-input" value={form.contractType ?? ""} onChange={e => set("contractType", e.target.value as any)}>
                  <option value="">Sin definir</option>
                  <option value="FIJO">Fijo</option>
                  <option value="TEMPORAL">Temporal</option>
                </select>
              </Field>
              <Field label="Tipo de tarifa">
                <select className="glass-input" value={form.payRateType ?? ""} onChange={e => set("payRateType", e.target.value as any)}>
                  <option value="">Sin definir</option>
                  <option value="POR_HORA">Por hora</option>
                  <option value="POR_DIA">Por día</option>
                  <option value="MENSUAL_FIJO">Mensual fijo</option>
                </select>
              </Field>
            </Row>
            {form.payRateType && (
              <Field label={`Tarifa (${form.payRateType === "POR_HORA" ? "por hora" : form.payRateType === "POR_DIA" ? "por día" : "mensual"})`}>
                <input type="number" step="0.01" min="0" className="glass-input" value={form.payRate ?? ""} onChange={e => set("payRate", parseFloat(e.target.value) as any)} />
              </Field>
            )}
          </FieldGroup>

          <FieldGroup label="Acceso al fichaje">
            <Row>
              <Field label="Email de acceso"><input type="email" className="glass-input" value={form.email} onChange={e => set("email", e.target.value)} placeholder="empleado@ejemplo.com" /></Field>
              <Field label="Contraseña">
                <input type="password" className="glass-input" value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder={employee?.email ? "Dejar en blanco para no cambiar" : "Nueva contraseña"} />
              </Field>
            </Row>
            {form.email && !form.password && !employee?.email && (
              <p style={{ fontSize: "11px", color: "var(--amber)" }}>Falta la contraseña para activar el acceso.</p>
            )}
          </FieldGroup>

          <FieldGroup label="Horario">
            <Field label="Tipo de horario">
              <select className="glass-input" value={form.scheduleType ?? ""} onChange={e => set("scheduleType", e.target.value as any)}>
                <option value="">Sin definir</option>
                <option value="FIJO">Fijo</option>
                <option value="ROTATIVO">Rotativo</option>
                <option value="ABIERTO">Abierto</option>
              </select>
            </Field>
            {form.scheduleType === "FIJO" && (
              <>
                <div style={{ display: "flex", gap: "6px" }}>
                  {WEEKDAYS.map(({ key, label }) => {
                    const active = form.scheduleDetail?.days?.includes(key);
                    return (
                      <button key={key} type="button" onClick={() => toggleDay(key)} style={{
                        width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                        border: `1px solid ${active ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
                        background: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        color: active ? "#a5b4fc" : "var(--text-muted)",
                      }}>{label}</button>
                    );
                  })}
                </div>
                <Row>
                  <Field label="Hora inicio"><input type="time" className="glass-input" value={form.scheduleDetail?.startTime ?? ""} onChange={e => set("scheduleDetail", { ...form.scheduleDetail, startTime: e.target.value })} /></Field>
                  <Field label="Hora fin"><input type="time" className="glass-input" value={form.scheduleDetail?.endTime ?? ""} onChange={e => set("scheduleDetail", { ...form.scheduleDetail, endTime: e.target.value })} /></Field>
                </Row>
              </>
            )}
            {form.scheduleType === "ROTATIVO" && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Horario rotativo — sin calendario detallado por ahora.</p>
            )}
          </FieldGroup>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: "42px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-glow" style={{ flex: 1, height: "42px" }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "6px", borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: "10px" }}>{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
