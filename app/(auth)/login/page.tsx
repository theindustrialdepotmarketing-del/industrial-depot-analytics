"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { SessionProvider } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        router.push("/overview");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(30, 155, 215, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 155, 215, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(30, 155, 215, 0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem",
          position: "relative",
          animation: "fade-in 0.4s ease-out",
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #1e9bd7, transparent)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <Image
              src="/logo.png"
              alt="The Industrial Depot"
              width={80}
              height={80}
              style={{ objectFit: "contain", width: "80px", height: "80px" }}
            />
          </div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "#f1f5f9",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Industrial Depot
          </h1>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#1e9bd7",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: "0.25rem 0 0",
            }}
          >
            Analytics Dashboard
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--border-color)",
            marginBottom: "1.75rem",
          }}
        />

        <p
          style={{
            fontSize: "0.875rem",
            color: "#64748b",
            textAlign: "center",
            marginBottom: "1.75rem",
          }}
        >
          Acceso restringido al equipo administrativo
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.8rem",
              color: "#ef4444",
              animation: "fade-in 0.2s ease-out",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "0.5rem",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Correo electrónico
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#475569",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@theindustrialdepot.com"
                required
                autoComplete="email"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "0.5rem",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#475569",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                className="form-input"
                style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: "absolute",
                  right: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#475569",
                  display: "flex",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginTop: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Verificando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse-soft 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: "0.72rem", color: "#475569" }}>
            Conexión segura · TheIndustrialDepot.com
          </span>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginForm />
    </SessionProvider>
  );
}
