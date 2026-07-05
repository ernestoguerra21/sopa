"use client";

import { useState } from "react";
import { api, Department, Employee } from "@/lib/api";

export function Organigrama({ employees, departments, onChange }: {
  employees: Employee[];
  departments: Department[];
  onChange: () => void;
}) {
  const [view, setView] = useState<"dept" | "tree">("dept");
  const [newDept, setNewDept] = useState("");

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!newDept.trim()) return;
    await api.departments.create({ name: newDept });
    setNewDept("");
    onChange();
  }

  async function removeDepartment(id: string) {
    await api.departments.remove(id);
    onChange();
  }

  const unassigned = employees.filter(e => !e.departmentId);
  const roots = employees.filter(e => !e.managerId);
  const byManager = (id: string) => employees.filter(e => e.managerId === id);

  return (
    <div>
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px", border: "1px solid var(--border)", width: "fit-content" }}>
        {(["dept", "tree"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
            background: view === v ? "rgba(255,255,255,0.08)" : "transparent",
            color: view === v ? "var(--text-primary)" : "var(--text-muted)",
          }}>
            {v === "dept" ? "Por departamento" : "Jerárquico"}
          </button>
        ))}
      </div>

      {view === "dept" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <form onSubmit={addDepartment} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
            <input className="glass-input" style={{ maxWidth: "260px" }} placeholder="Nuevo departamento..." value={newDept} onChange={e => setNewDept(e.target.value)} />
            <button type="submit" className="btn-glow" style={{ padding: "0 18px" }}>Añadir</button>
          </form>

          {departments.map(dept => (
            <div key={dept.id} className="glass" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{dept.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{dept._count?.employees ?? 0} empleados</span>
                  <button onClick={() => removeDepartment(dept.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    <IconTrash />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {employees.filter(e => e.departmentId === dept.id).map(e => <EmployeeChip key={e.id} employee={e} />)}
                {employees.filter(e => e.departmentId === dept.id).length === 0 && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin empleados asignados</span>
                )}
              </div>
            </div>
          ))}

          {departments.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Crea el primer departamento para empezar a organizar el equipo.</p>
          )}

          {unassigned.length > 0 && (
            <div className="glass" style={{ padding: "14px 16px", borderStyle: "dashed" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>Sin departamento</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {unassigned.map(e => <EmployeeChip key={e.id} employee={e} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {roots.length === 0
            ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sin jerarquía definida — asigna un jefe directo a los empleados.</p>
            : roots.map(e => <TreeNode key={e.id} employee={e} byManager={byManager} depth={0} />)
          }
        </div>
      )}
    </div>
  );
}

function TreeNode({ employee, byManager, depth }: { employee: Employee; byManager: (id: string) => Employee[]; depth: number }) {
  const children = byManager(employee.id);
  return (
    <div>
      <div style={{ marginLeft: depth * 24, display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
        {depth > 0 && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>└</span>}
        <EmployeeChip employee={employee} />
      </div>
      {children.map(c => <TreeNode key={c.id} employee={c} byManager={byManager} depth={depth + 1} />)}
    </div>
  );
}

function EmployeeChip({ employee }: { employee: Employee }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "99px",
      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
      opacity: employee.status === "INACTIVE" ? 0.5 : 1,
    }}>
      <span className={employee.status === "ACTIVE" ? "dot-green" : "dot-amber"} />
      <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{employee.name}</span>
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>· {employee.position}</span>
    </div>
  );
}

function IconTrash() {
  return <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
  </svg>;
}
