import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, setToken } from "../lib/api";

export function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const resp = mode === "login" ? await login(email, password) : await register(email, password);
      setToken(resp.token);
      nav("/", { replace: true });
    } catch (e: any) {
      setError(String(e?.message || "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{mode === "login" ? "Login" : "Create account"}</h3>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </div>

        <div style={{ height: 12 }} />

        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label>Password (min 8 chars)</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        <button className="btn" disabled={busy} type="submit">
          {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
        </button>

        {error && <div className="error">Error: {error}</div>}
      </form>
    </div>
  );
}

