"use client";

import { useEffect, useRef, useState } from "react";
import { api, InventoryItem } from "@/lib/api";

export default function InventarioPage() {
  const [items,    setItems]    = useState<InventoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ name: "", unit: "uds", quantity: "", minQuantity: "" });

  async function load() {
    const data = await api.inventory.list();
    setItems(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.inventory.create({
      name: form.name,
      unit: form.unit,
      quantity: parseFloat(form.quantity) || 0,
      minQuantity: parseFloat(form.minQuantity) || 0,
    });
    setForm({ name: "", unit: "uds", quantity: "", minQuantity: "" });
    setCreating(false);
    load();
  }

  const itemsRef = useRef<InventoryItem[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function adjust(id: string, delta: number) {
    // optimistic UI; debounced save collapses rapid clicks into one PATCH
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i));
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      const q = itemsRef.current.find(i => i.id === id)?.quantity;
      if (q !== undefined) api.inventory.update(id, { quantity: q });
    }, 400);
  }

  async function remove(id: string) {
    await api.inventory.remove(id);
    load();
  }

  const lowCount = items.filter(i => i.quantity <= i.minQuantity).length;
  const fmtQty = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(1);

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-up delay-0 page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Inventario</h1>
          <p style={{ fontSize: "13px", color: lowCount > 0 ? "var(--amber)" : "var(--text-muted)", marginTop: "4px" }}>
            {lowCount > 0 ? `${lowCount} producto${lowCount > 1 ? "s" : ""} bajo mínimo` : `${items.length} productos, stock correcto`}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-glow" style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Nuevo producto
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text" autoFocus
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre del producto"
              className="glass-input"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="glass-input" style={{ flex: 1 }}>
                <option value="uds">Unidades</option>
                <option value="kg">Kilos</option>
                <option value="L">Litros</option>
              </select>
              <input type="number" step="0.1" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                placeholder="Cantidad actual" className="glass-input" style={{ flex: 1 }} />
              <input type="number" step="0.1" min="0" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })}
                placeholder="Mínimo" className="glass-input" style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreating(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-glow" style={{ padding: "8px 20px" }}>Añadir</button>
            </div>
          </form>
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>📦</div>
          <p style={{ fontSize: "13px" }}>Sin productos en el inventario</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => {
            const low = item.quantity <= item.minQuantity;
            return (
              <div key={item.id} className={`glass inv-row animate-fade-up delay-${Math.min(i, 5)}`}
                style={{
                  padding: "14px 16px",
                  ...(low ? { borderColor: "rgba(245,158,11,0.3)" } : {}),
                }}>
                {/* Low-stock indicator */}
                <div style={{
                  width: "8px", height: "8px", flexShrink: 0, borderRadius: "50%",
                  background: low ? "var(--amber)" : "var(--green)",
                  boxShadow: low ? "0 0 8px rgba(245,158,11,0.5)" : "0 0 8px rgba(16,185,129,0.4)",
                }} />

                {/* Body */}
                <div className="inv-body">
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: low ? "var(--amber)" : "var(--text-muted)", marginTop: "2px" }}>
                    {low ? `Bajo mínimo (${fmtQty(item.minQuantity)} ${item.unit})` : `Mínimo: ${fmtQty(item.minQuantity)} ${item.unit}`}
                  </div>
                </div>

                {/* Quantity stepper */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <StepBtn label="−" onClick={() => adjust(item.id, -1)} />
                  <div style={{ minWidth: "72px", textAlign: "center" }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "17px", fontWeight: 700, color: low ? "var(--amber)" : "var(--text-primary)" }}>
                      {fmtQty(item.quantity)}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>{item.unit}</span>
                  </div>
                  <StepBtn label="+" onClick={() => adjust(item.id, 1)} />
                </div>

                {/* Delete */}
                <button onClick={() => remove(item.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", borderRadius: "6px", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 3 2 3 12 3"/><path d="M10 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "28px", height: "28px", borderRadius: "8px", cursor: "pointer",
      background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
      color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s", fontFamily: "inherit",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
      {label}
    </button>
  );
}
