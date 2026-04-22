import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect after login based on permissions
  useEffect(() => {
    if (user) {
      const canSeeMonitoramento = user.role === "admin" || user.permissions?.includes("/monitoramento-geral");
      if (canSeeMonitoramento) {
        setLocation("/monitoramento-geral");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Redirect will happen via useEffect above when user state updates
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060e24] relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/5 blur-3xl" />
      </div>

      {/* Grid lines decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(210 100% 70%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 100% 70%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          <div className="px-8 py-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-8 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <img
                    src="/Icone_Logo.png"
                    alt="IP Telecom"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#060e24] flex items-center justify-center">
                  <ShieldCheck size={10} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-white tracking-tight">IP Telecom</h1>
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-medium mt-0.5">Analytics Dashboard</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="seu@email.com.br"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/[0.06] border text-white placeholder:text-white/25 outline-none transition-all duration-200",
                      "focus:bg-white/[0.08] focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20",
                      error ? "border-red-500/60" : "border-white/10"
                    )}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white/[0.06] border text-white placeholder:text-white/25 outline-none transition-all duration-200",
                      "focus:bg-white/[0.08] focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20",
                      error ? "border-red-500/60" : "border-white/10"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25",
                  "hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30",
                  "active:scale-[0.98]",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/[0.06] bg-white/[0.02]">
            <p className="text-center text-[10px] text-white/25 font-medium">
              IP Telecom Analytics © {new Date().getFullYear()} — Acesso restrito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
