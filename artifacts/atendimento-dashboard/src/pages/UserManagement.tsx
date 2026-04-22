import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Trash2, Users, ShieldCheck, User, Loader2, X, Eye, EyeOff, LayoutDashboard, CheckCircle2, Radio, Users as UsersIcon, Activity, Phone, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  active: number;
  permissions: string[];
  created_at: string;
}

const TAB_OPTIONS = [
  { path: "/", label: "Visão Geral", icon: LayoutDashboard },
  { path: "/atendimentos", label: "Atendimentos", icon: CheckCircle2 },
  { path: "/canais", label: "Canais", icon: Radio },
  { path: "/agentes", label: "Agentes", icon: UsersIcon },
  { path: "/acompanhamento", label: "Acompanhamento", icon: Activity },
  { path: "/ramais", label: "Monitorar Ramais", icon: Phone },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function useAuthFetch() {
  const { token } = useAuth();
  return (url: string, opts: RequestInit = {}) =>
    fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });
}

export function UserManagement() {
  const { user: me } = useAuth();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>(TAB_OPTIONS.map((t) => t.path));
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const ALL_TABS = ["/", "/atendimentos", "/canais", "/agentes", "/acompanhamento", "/ramais"];

  function togglePerm(path: string) {
    setFormPermissions((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }

  function toggleEditPerm(path: string) {
    setEditPerms((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }

  function startEdit(u: UserRow) {
    setEditId(u.id);
    setEditError(null);
    const perms = u.permissions && u.permissions.length > 0 ? u.permissions : ALL_TABS;
    setEditPerms(perms);
    setDeleteId(null);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await authFetch("/api/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.users as UserRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, permissions: formPermissions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormPermissions(TAB_OPTIONS.map((t) => t.path)); setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: string[] }) => {
      const res = await authFetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditId(null);
      setEditError(null);
    },
    onError: (e: Error) => setEditError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteId(null);
    },
  });

  const users = data || [];
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalUsers = users.filter((u) => u.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gerenciar Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle de acesso ao dashboard</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="h-9 gap-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-600/20"
        >
          <UserPlus size={14} />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              <p className="text-2xl font-extrabold text-foreground">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Admins</p>
              <p className="text-2xl font-extrabold text-foreground">{totalAdmins}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Usuários</p>
              <p className="text-2xl font-extrabold text-foreground">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New user form */}
      {showForm && (
        <Card className="rounded-2xl border-blue-500/30 shadow-sm bg-blue-500/[0.03]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserPlus size={14} className="text-blue-500" />
                Adicionar Novo Usuário
              </CardTitle>
              <button onClick={() => { setShowForm(false); setFormError(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormError(null); }}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => { setFormEmail(e.target.value); setFormError(null); }}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => { setFormPassword(e.target.value); setFormError(null); }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 pr-9 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Abas visíveis</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFormPermissions(TAB_OPTIONS.map((t) => t.path))} className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold">Selecionar tudo</button>
                    <span className="text-muted-foreground/40 text-[10px]">|</span>
                    <button type="button" onClick={() => setFormPermissions([])} className="text-[10px] text-muted-foreground hover:text-foreground font-semibold">Limpar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TAB_OPTIONS.map(({ path, label, icon: Icon }) => {
                    const checked = formPermissions.includes(path);
                    return (
                      <button
                        key={path}
                        type="button"
                        onClick={() => togglePerm(path)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                          checked
                            ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          checked ? "bg-blue-500 border-blue-500" : "border-muted-foreground/30"
                        )}>
                          {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <Icon size={13} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-medium">{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setFormError(null); }} className="text-xs">Cancelar</Button>
              <Button
                size="sm"
                disabled={createMutation.isPending || !formName || !formEmail || !formPassword}
                onClick={() => createMutation.mutate()}
                className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0"
              >
                {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Criar Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
        <CardHeader className="pb-2 space-y-0">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            Usuários Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="text-muted-foreground font-semibold text-xs">Nome</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Email</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Abas com Acesso</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Criado em</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <React.Fragment key={u.id}>
                      <TableRow className={cn("text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/40 transition-colors", editId === u.id && "bg-blue-500/[0.03]")}>
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                              u.role === "admin" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            )}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{u.name}</span>
                            {u.id === me?.id && (
                              <Badge variant="outline" className="text-[9px] border-emerald-500/50 text-emerald-600 dark:text-emerald-400 py-0">você</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-[11px]">{u.email}</TableCell>
                        <TableCell>
                          {u.role === "admin" ? (
                            <Badge variant="outline" className="text-[10px] font-semibold gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                              <ShieldCheck size={10} /> Todas as abas
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {TAB_OPTIONS.filter((t) => u.permissions?.includes(t.path)).map(({ path, label }) => (
                                <Badge key={path} variant="outline" className="text-[9px] font-medium border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 py-0">{label}</Badge>
                              ))}
                              {(!u.permissions || u.permissions.length === 0) && (
                                <span className="text-[10px] text-muted-foreground italic">Sem acesso</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {u.role !== "admin" && u.id !== me?.id && editId !== u.id && (
                              <button
                                onClick={() => startEdit(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                                title="Editar permissões"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {editId === u.id && (
                              <button
                                onClick={() => setEditId(null)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                title="Cancelar"
                              >
                                <X size={13} />
                              </button>
                            )}
                            {u.id !== me?.id && editId !== u.id && (
                              deleteId === u.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => deleteMutation.mutate(u.id)}
                                    disabled={deleteMutation.isPending}
                                    className="text-[10px] font-semibold text-red-500 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20"
                                  >
                                    {deleteMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : "Confirmar"}
                                  </button>
                                  <button onClick={() => setDeleteId(null)} className="text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteId(u.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                  title="Remover usuário"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {editId === u.id && (
                        <TableRow key={`edit-${u.id}`} className="border-border/30 dark:border-white/[0.04] bg-blue-500/[0.03]">
                          <TableCell colSpan={5} className="pb-4 pt-1 px-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-foreground">Editar abas visíveis para <span className="text-blue-500">{u.name}</span></p>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setEditPerms(TAB_OPTIONS.map((t) => t.path))} className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold">Selecionar tudo</button>
                                  <span className="text-muted-foreground/40 text-[10px]">|</span>
                                  <button type="button" onClick={() => setEditPerms([])} className="text-[10px] text-muted-foreground hover:text-foreground font-semibold">Limpar</button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {TAB_OPTIONS.map(({ path, label, icon: Icon }) => {
                                  const checked = editPerms.includes(path);
                                  return (
                                    <button
                                      key={path}
                                      type="button"
                                      onClick={() => toggleEditPerm(path)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                                        checked
                                          ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                                          : "bg-background border-border text-muted-foreground hover:border-border/80"
                                      )}
                                    >
                                      <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                        checked ? "bg-blue-500 border-blue-500" : "border-muted-foreground/30"
                                      )}>
                                        {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                      </div>
                                      <Icon size={13} />
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                              {editError && (
                                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                  <p className="text-xs text-red-400 font-medium">{editError}</p>
                                </div>
                              )}
                              <div className="flex justify-end gap-2 pt-1">
                                <Button variant="outline" size="sm" onClick={() => setEditId(null)} className="text-xs h-7">Cancelar</Button>
                                <Button
                                  size="sm"
                                  disabled={updateMutation.isPending}
                                  onClick={() => updateMutation.mutate({ id: u.id, permissions: editPerms })}
                                  className="text-xs h-7 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0"
                                >
                                  {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">Nenhum usuário encontrado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
