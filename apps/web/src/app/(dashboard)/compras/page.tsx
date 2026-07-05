"use client";

import { useEffect, useState } from "react";
import { api, InventoryItem, PurchaseOrder, Supplier } from "@/lib/api";

type Line = { inventoryItemId: string; quantity: string };

export default function ComprasPage() {
  const [orders,    setOrders]    = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items,     setItems]     = useState<InventoryItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ inventoryItemId: "", quantity: "" }]);

  async function load() {
    const [o, s, i] = await Promise.all([
      api.purchaseOrders.list(),
      api.suppliers.list(),
      api.inventory.list(),
    ]);
    setOrders(o);
    setSuppliers(s);
    setItems(i);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setSupplierId(suppliers[0]?.id ?? "");
    setLines([{ inventoryItemId: items[0]?.id ?? "", quantity: "" }]);
    setCreating(true);
  }

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter(l => l.inventoryItemId && parseFloat(l.quantity) > 0);
    if (!supplierId || validLines.length === 0) return;

    await api.purchaseOrders.create({
      supplierId,
      items: validLines.map(l => {
        const item = items.find(i => i.id === l.inventoryItemId)!;
        return { name: item.name, unit: item.unit, quantity: parseFloat(l.quantity), inventoryItemId: item.id };
      }),
    });
    setCreating(false);
    load();
  }

  async function receive(id: string) {
    await api.purchaseOrders.receive(id);
    load();
  }

  async function cancel(id: string) {
    await api.purchaseOrders.cancel(id);
    load();
  }

  async function remove(id: string) {
    await api.purchaseOrders.remove(id);
    load();
  }

  const pending = orders.filter(o => o.status === "PENDING").length;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 28px" }}>
      {/* Header */}
      <div className="animate-fade-up delay-0" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Compras</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{pending} pedido{pending !== 1 ? "s" : ""} pendiente{pending !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openCreate} disabled={suppliers.length === 0 || items.length === 0} className="btn-glow"
          style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px", paddingLeft: "14px", paddingRight: "16px", opacity: (suppliers.length === 0 || items.length === 0) ? 0.5 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
          Nuevo pedido
        </button>
      </div>

      {suppliers.length === 0 && !loading && (
        <div style={{ fontSize: "12px", color: "var(--amber)", marginBottom: "16px" }}>
          Añade un proveedor en la sección Proveedores antes de crear un pedido.
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="glass animate-scale-in" style={{ padding: "16px", marginBottom: "16px", borderColor: "rgba(99,102,241,0.25)" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="glass-input">
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {lines.map((line, idx) => (
              <div key={idx} style={{ display: "flex", gap: "10px" }}>
                <select value={line.inventoryItemId} onChange={e => updateLine(idx, { inventoryItemId: e.target.value })}
                  className="glass-input" style={{ flex: 2 }}>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <input type="number" step="0.1" min="0" value={line.quantity} onChange={e => updateLine(idx, { quantity: e.target.value })}
                  placeholder="Cantidad" className="glass-input" style={{ flex: 1 }} />
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 4px" }}>
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1 1 13"/></svg>
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={() => setLines(prev => [...prev, { inventoryItemId: items[0]?.id ?? "", quantity: "" }])}
              style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", color: "var(--accent-soft)", fontSize: "12px", fontFamily: "inherit", padding: 0 }}>
              + Añadir línea
            </button>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreating(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-glow" style={{ padding: "8px 20px" }}>Crear pedido</button>
            </div>
          </form>
        </div>
      )}

      {/* Order list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>🛒</div>
          <p style={{ fontSize: "13px" }}>Sin pedidos de compra</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {orders.map((order, i) => (
            <div key={order.id} className={`glass animate-fade-up delay-${Math.min(i, 5)}`}
              style={{ padding: "16px", opacity: order.status === "PENDING" ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{order.supplier.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {new Date(order.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: order.status === "PENDING" ? "12px" : 0 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                    <span>{item.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>

              {order.status === "PENDING" && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <button onClick={() => cancel(order.id)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                    Cancelar
                  </button>
                  <button onClick={() => receive(order.id)} className="btn-glow" style={{ padding: "6px 14px", fontSize: "12px" }}>
                    Marcar recibido
                  </button>
                </div>
              )}
              {order.status !== "PENDING" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => remove(order.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px", fontFamily: "inherit", padding: "4px" }}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  if (status === "RECEIVED") return <span className="badge-low" style={{ color: "var(--green)" }}>Recibido</span>;
  if (status === "CANCELLED") return <span className="badge-low">Cancelado</span>;
  return <span className="badge-medium">Pendiente</span>;
}
