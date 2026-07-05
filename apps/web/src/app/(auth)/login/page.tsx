"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveToken, saveUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("gerente@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { accessToken, user } = await api.auth.login(email, password);
      saveToken(accessToken);
      saveUser(user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Animated background */}
      <div className="bg-scene">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div className="animate-fade-up delay-0" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "16px",
            boxShadow: "0 0 32px rgba(99,102,241,0.4)",
            marginBottom: "16px",
            fontSize: "22px", fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            color: "#fff",
          }}>S</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>SOPA</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Sistema Operativo Para Administradores</div>
        </div>

        {/* Card */}
        <div className="glass-lg animate-scale-in delay-1" style={{ padding: "32px" }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "var(--text-primary)" }}>
            Iniciar sesión
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input"
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glow"
              style={{ marginTop: "4px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px" }}
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Entrando...
                </>
              ) : "Entrar"}
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Credenciales demo
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { role: "Gerente", email: "gerente@demo.com", pwd: "demo1234" },
                { role: "Propietario", email: "dueno@demo.com", pwd: "demo1234" },
              ].map(({ role, email: e, pwd }) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmail(e); setPassword(pwd); }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                    cursor: "pointer", transition: "background 0.15s",
                    color: "var(--text-secondary)", fontSize: "12px",
                  }}
                  onMouseEnter={e2 => (e2.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                  onMouseLeave={e2 => (e2.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                >
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{role}</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text-muted)", fontSize: "11px" }}>{e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
