"use client";

import axios from "axios";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Edit3,
  KeyRound,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/date-time";
import { useCurrentUserProfile, type UserRole } from "@/features/user-profile";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
  userToFormValues,
} from "../services/userManagementApi";
import type { ManagedUser, OperatorOption, UserFormValues, UserListMeta } from "../types";

const roles: UserRole[] = ["ADMIN", "MANAGER", "ENGINEER", "TECHNICIAN"];
const emptyMeta: UserListMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };
const emptyForm: UserFormValues = {
  employeeNumber: "",
  name: "",
  email: "",
  username: "",
  password: "",
  role: "ENGINEER",
  operatorId: "",
  unit: "",
  active: true,
};

const DEFAULT_OPERATORS: OperatorOption[] = [
  { id: "GARUDA", code: "GA", name: "Garuda Indonesia" },
  { id: "CITILINK", code: "QG", name: "Citilink" },
];

function buildOperatorOptions(
  discoveredList: Array<{ id: string; code?: string | null; name?: string | null }>,
  currentValue?: string,
): OperatorOption[] {
  const optionsMap = new Map<string, OperatorOption>();

  const getMatcher = (code?: string | null, name?: string | null) => {
    const c = (code || "").toUpperCase().trim();
    const n = (name || "").toUpperCase().trim();
    if (c === "GA" || n.includes("GARUDA")) return "GARUDA";
    if (c === "QG" || n.includes("CITILINK")) return "CITILINK";
    return c || n;
  };

  const matchedKeys = new Set<string>();

  for (const item of discoveredList) {
    if (!item.id && !item.code) continue;
    const id = item.id || item.code || "";
    const code = item.code || item.id || "";
    const name = item.name || item.code || item.id || "";
    const matchKey = getMatcher(code, name);
    if (matchKey) matchedKeys.add(matchKey);
    optionsMap.set(id, { id, code, name });
  }

  for (const def of DEFAULT_OPERATORS) {
    const matchKey = getMatcher(def.code, def.name);
    if (!matchedKeys.has(matchKey) && !optionsMap.has(def.id)) {
      optionsMap.set(def.id, def);
    }
  }

  if (currentValue && currentValue.trim() && !optionsMap.has(currentValue)) {
    optionsMap.set(currentValue, {
      id: currentValue,
      code: currentValue,
      name: currentValue,
    });
  }

  return Array.from(optionsMap.values());
}


type FormErrors = Partial<Record<keyof UserFormValues, string>>;

function apiMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data.message ?? error.response?.data.error ?? fallback;
  }
  return fallback;
}

function roleClass(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "bg-violet-700 text-white";
    case "MANAGER":
      return "bg-blue-700 text-white";
    case "ENGINEER":
      return "bg-cyan-700 text-white";
    default:
      return "bg-slate-700 text-white";
  }
}

function validateForm(values: UserFormValues, editing: boolean) {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Nama wajib diisi.";
  if (!values.email.trim()) errors.email = "Email wajib diisi.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Format email tidak valid.";
  if (!values.username.trim()) errors.username = "Username wajib diisi.";
  if (!editing && values.password.length < 8) {
    errors.password = "Password minimal 8 karakter.";
  }
  return errors;
}

function inputClass(hasError = false) {
  return `h-10 w-full rounded-xl border bg-background px-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 ${
    hasError
      ? "border-red-600 focus:border-red-600 focus:ring-red-500/15"
      : "border-border focus:border-blue-600 focus:ring-blue-500/15"
  }`;
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse p-6" role="status">
      <div className="h-28 rounded-2xl border border-border bg-card" />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-24 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-5 h-[480px] rounded-2xl border border-border bg-card" />
      <span className="sr-only">Memuat User Management...</span>
    </div>
  );
}

export default function UserManagementPage() {
  const profileQuery = useCurrentUserProfile();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [meta, setMeta] = useState<UserListMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [operatorId, setOperatorId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ManagedUser | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [directoryOperators, setDirectoryOperators] = useState<OperatorOption[]>([]);

  const isAdmin = profileQuery.data?.role === "ADMIN";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    if (!isAdmin) return;
    setIsLoading(true);
    setListError(null);
    try {
      const response = await getUsers({ page, limit: 20, role, operatorId, search }, signal);
      setUsers(Array.isArray(response.data) ? response.data : []);
      setMeta(response.meta ?? emptyMeta);
    } catch (error) {
      if (!axios.isCancel(error)) {
        setUsers([]);
        setListError(apiMessage(error, "Daftar user tidak dapat dimuat."));
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [isAdmin, operatorId, page, role, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadUsers(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadUsers, reloadVersion]);

  useEffect(() => {
    let active = true;
    getUsers({ page: 1, limit: 100 })
      .then((res) => {
        if (!active) return;
        const ops: OperatorOption[] = [];
        for (const user of res.data) {
          if (user.operator?.id) {
            ops.push({
              id: user.operator.id,
              code: user.operator.code || user.operator.id,
              name: user.operator.name || user.operator.code || user.operator.id,
            });
          } else if (user.operatorId) {
            ops.push({
              id: user.operatorId,
              code: user.operatorId,
              name: user.operatorId,
            });
          }
        }
        if (ops.length > 0) {
          setDirectoryOperators(ops);
        }
      })
      .catch(() => {
        // Silently fallback to page users and default operators
      });
    return () => {
      active = false;
    };
  }, []);

  const operatorOptions = useMemo(() => {
    const discovered: Array<{ id: string; code?: string | null; name?: string | null }> = [
      ...directoryOperators,
      ...users.map((u) => ({
        id: u.operator?.id || u.operatorId || "",
        code: u.operator?.code || "",
        name: u.operator?.name || "",
      })),
      ...(profileQuery.data?.operator ? [profileQuery.data.operator] : []),
      ...(editingUser?.operator ? [editingUser.operator] : []),
    ];

    return buildOperatorOptions(discovered, form.operatorId);
  }, [directoryOperators, users, profileQuery.data?.operator, editingUser?.operator, form.operatorId]);

  const pageStats = useMemo(() => ({
    active: users.filter((user) => user.active).length,
    operators: new Set(users.map((user) => user.operatorId).filter(Boolean)).size,
  }), [users]);


  function openCreateDialog() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  async function openEditDialog(user: ManagedUser) {
    setEditingUser(user);
    setForm({ ...userToFormValues(user), password: "" });
    setFormErrors({});
    setDialogOpen(true);
    setIsLoadingUserDetail(true);
    try {
      const latestUser = await getUser(user.id);
      setEditingUser(latestUser);
      setForm({ ...userToFormValues(latestUser), password: "" });
    } catch (error) {
      toast.error(apiMessage(error, "Detail user terbaru tidak dapat dimuat."));
    } finally {
      setIsLoadingUserDetail(false);
    }
  }

  function updateField<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSave() {
    const errors = validateForm(form, Boolean(editingUser));
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Lengkapi field user yang ditandai.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const payload = {
          ...(form.employeeNumber.trim()
            ? { employeeNumber: form.employeeNumber.trim() }
            : {}),
          name: form.name,
          email: form.email,
          username: form.username,
          role: form.role,
          operatorId: form.operatorId,
          unit: form.unit,
        };
        await updateUser(editingUser.id, payload);
        toast.success("Data user berhasil diperbarui.");
      } else {
        await createUser(form);
        toast.success("User baru berhasil dibuat.");
      }
      setDialogOpen(false);
      setReloadVersion((version) => version + 1);
    } catch (error) {
      toast.error(apiMessage(error, editingUser ? "User gagal diperbarui." : "User gagal dibuat."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget || statusTarget.id === profileQuery.data?.id) return;

    setIsUpdatingStatus(true);
    try {
      await updateUserStatus(statusTarget.id, !statusTarget.active);
      toast.success(
        statusTarget.active
          ? "User berhasil dinonaktifkan."
          : "User berhasil diaktifkan.",
      );
      setStatusTarget(null);
      setReloadVersion((version) => version + 1);
    } catch (error) {
      toast.error(apiMessage(error, "Status user gagal diperbarui."));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function openResetPasswordDialog(user: ManagedUser) {
    setResetTarget(user);
    setResetPassword("");
    setResetPasswordConfirmation("");
    setResetPasswordError(null);
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    if (resetPassword.length < 8) {
      setResetPasswordError("Password baru minimal 8 karakter.");
      return;
    }
    if (resetPassword !== resetPasswordConfirmation) {
      setResetPasswordError("Konfirmasi password tidak sama.");
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);
    try {
      await resetUserPassword(resetTarget.id, resetPassword);
      toast.success("Password user berhasil direset.");
      setResetTarget(null);
      setResetPassword("");
      setResetPasswordConfirmation("");
    } catch (error) {
      setResetPasswordError(apiMessage(error, "Password user gagal direset."));
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleteTarget.id === profileQuery.data?.id) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success("User berhasil dihapus.");
      setDeleteTarget(null);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadVersion((version) => version + 1);
    } catch (error) {
      toast.error(apiMessage(error, "User gagal dihapus."));
    } finally {
      setIsDeleting(false);
    }
  }

  if (profileQuery.isLoading) return <LoadingState />;

  if (profileQuery.error || !profileQuery.data || !isAdmin) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl items-center justify-center p-6">
        <section className="w-full rounded-2xl border border-red-500/30 bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto text-red-700" size={36} />
          <h1 className="mt-4 text-lg font-bold text-foreground">Akses administrator diperlukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            User Management hanya dapat diakses oleh akun dengan role ADMIN.
          </p>
        </section>
      </div>
    );
  }

  const currentUserId = profileQuery.data.id;

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1600px] p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <UserRoundCog size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Administration</p>
            <h1 className="mt-1 text-xl font-bold text-foreground">User Management</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Kelola akun, role, operator, unit, dan status akses user ORBIT.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus size={15} /> Add User
        </button>
      </header>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: meta.total, detail: "Seluruh record backend", icon: UsersRound, color: "bg-blue-700" },
          { label: "Active on page", value: pageStats.active, detail: `${users.length} user dimuat pada halaman ini`, icon: CircleCheck, color: "bg-emerald-700" },
          { label: "Operators on page", value: pageStats.operators, detail: "Operator unik pada hasil saat ini", icon: Building2, color: "bg-violet-700" },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${item.color}`}><item.icon size={17} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{isLoading ? "…" : item.value}</p>
                <p className="text-[10px] font-semibold text-foreground">{item.label}</p>
              </div>
            </div>
            <p className="mt-3 text-[9px] text-muted-foreground">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <label className="relative min-w-[260px] flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama, email, atau employee no."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
              />
            </label>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserRole | "ALL");
                setPage(1);
              }}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-blue-600"
            >
              <option value="ALL">All roles</option>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input
              value={operatorId}
              onChange={(event) => {
                setOperatorId(event.target.value);
                setPage(1);
              }}
              placeholder="Filter Operator ID"
              aria-label="Filter berdasarkan operator ID"
              className="h-10 min-w-[180px] rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {listError && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">Daftar user gagal dimuat</p>
              <p className="mt-1 text-[10px] leading-5">{listError}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] text-left text-xs">
            <thead className="bg-muted/70 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Operator / Unit</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground"><LoaderCircle className="mx-auto mb-2 animate-spin" size={22} />Memuat user...</td></tr>
              )}
              {!isLoading && !listError && users.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground"><UsersRound className="mx-auto mb-2" size={25} />Tidak ada user yang sesuai filter.</td></tr>
              )}
              {!isLoading && users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xs font-bold text-white">
                          {(user.name || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{user.name || user.username}</p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-[10px] font-semibold text-foreground">{user.employeeNumber || "—"}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">@{user.username}</p>
                    </td>
                    <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${roleClass(user.role)}`}>{user.role}</span></td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{user.operator?.code ?? "—"}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">{user.unit || user.operator?.name || "Unassigned"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${user.active ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
                        {user.active ? <CircleCheck size={11} /> : <CircleX size={11} />}{user.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[10px] text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => void openEditDialog(user)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-600/30 px-2.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"><Edit3 size={12} /> Edit</button>
                        <button type="button" onClick={() => openResetPasswordDialog(user)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-600/30 px-2.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20"><KeyRound size={12} /> Reset</button>
                        <button
                          type="button"
                          onClick={() => setStatusTarget(user)}
                          disabled={isCurrentUser}
                          title={isCurrentUser ? "Status akun yang sedang digunakan tidak dapat diubah." : user.active ? "Nonaktifkan user" : "Aktifkan user"}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-35 ${user.active ? "border-amber-600/30 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
                        >
                          <Power size={12} /> {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          disabled={isCurrentUser}
                          title={isCurrentUser ? "Akun yang sedang digunakan tidak dapat dihapus." : "Hapus user"}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-600/30 px-2.5 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-[10px] text-muted-foreground">
          <span>{meta.total} user · Page {meta.page || page} of {Math.max(1, meta.totalPages)}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 font-semibold text-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft size={13} /> Previous</button>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= Math.max(1, meta.totalPages) || isLoading} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 font-semibold text-foreground hover:bg-muted disabled:opacity-40">Next <ChevronRight size={13} /></button>
          </div>
        </footer>
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => !isSaving && setDialogOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Perbarui metadata dan hak akses user." : "Buat akun baru yang dapat mengakses ORBIT."}
            </DialogDescription>
          </DialogHeader>
          {isLoadingUserDetail && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-700">
              <LoaderCircle size={14} className="animate-spin" /> Memuat detail user terbaru...
            </div>
          )}
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <FormField label="Full Name" error={formErrors.name} required>
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass(Boolean(formErrors.name))} placeholder="Nama lengkap" />
            </FormField>
            <FormField label="Employee Number" error={formErrors.employeeNumber}>
              <input value={form.employeeNumber} onChange={(event) => updateField("employeeNumber", event.target.value)} className={inputClass()} placeholder="GA-ENG-001" />
            </FormField>
            <FormField label="Email" error={formErrors.email} required>
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass(Boolean(formErrors.email))} placeholder="user@gmf.co.id" />
            </FormField>
            <FormField label="Username" error={formErrors.username} required>
              <input value={form.username} onChange={(event) => updateField("username", event.target.value)} className={inputClass(Boolean(formErrors.username))} placeholder="username" />
            </FormField>
            {!editingUser && (
              <FormField label="Initial Password" error={formErrors.password} required>
                <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} className={inputClass(Boolean(formErrors.password))} placeholder="Minimal 8 karakter" />
              </FormField>
            )}
            <FormField label="Role" error={formErrors.role} required>
              <select value={form.role} onChange={(event) => updateField("role", event.target.value as UserRole)} className={inputClass()}>
                {roles.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Operator ID" error={formErrors.operatorId}>
              <select
                value={form.operatorId}
                onChange={(event) => updateField("operatorId", event.target.value)}
                className={inputClass(Boolean(formErrors.operatorId))}
              >
                <option value="">Pilih Operator (Opsional)</option>
                {operatorOptions.map((op) => {
                  const code = op.code?.trim();
                  const name = op.name?.trim();
                  const label = name && code && name.toUpperCase() !== code.toUpperCase()
                    ? `${name} (${code})`
                    : name || code || op.id;

                  return (
                    <option key={op.id} value={op.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </FormField>
            <FormField label="Unit" error={formErrors.unit}>
              <input value={form.unit} onChange={(event) => updateField("unit", event.target.value)} className={inputClass()} placeholder="Contoh: TEA-2" />
            </FormField>
            {!editingUser && (
              <label className="flex min-h-10 items-center gap-3 rounded-xl border border-border px-3 sm:col-span-2">
                <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} className="h-4 w-4 accent-blue-700" />
                <span className="text-xs font-semibold text-foreground">User account is active</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setDialogOpen(false)} disabled={isSaving} className="h-10 rounded-xl border border-border px-4 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
            <button type="button" onClick={handleSave} disabled={isSaving || isLoadingUserDetail} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              {isSaving && <LoaderCircle size={14} className="animate-spin" />}{editingUser ? "Save Changes" : "Create User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open && !isResettingPassword) setResetTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Tetapkan password sementara baru untuk <strong>{resetTarget?.name || resetTarget?.username}</strong>. Password tidak akan ditampilkan kembali setelah disimpan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="New Password" required error={resetPasswordError ?? undefined}>
              <input
                type="password"
                value={resetPassword}
                onChange={(event) => {
                  setResetPassword(event.target.value);
                  setResetPasswordError(null);
                }}
                className={inputClass(Boolean(resetPasswordError))}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirm New Password" required>
              <input
                type="password"
                value={resetPasswordConfirmation}
                onChange={(event) => {
                  setResetPasswordConfirmation(event.target.value);
                  setResetPasswordError(null);
                }}
                className={inputClass(Boolean(resetPasswordError))}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </FormField>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setResetTarget(null)} disabled={isResettingPassword} className="h-10 rounded-xl border border-border px-4 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
            <button type="button" onClick={() => void handleResetPassword()} disabled={isResettingPassword} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60">
              {isResettingPassword && <LoaderCircle size={14} className="animate-spin" />} Reset Password
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && !isUpdatingStatus && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.active ? "Deactivate this user?" : "Activate this user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.active
                ? `Akun ${statusTarget.name || statusTarget.username} tidak dapat menggunakan ORBIT setelah dinonaktifkan. Histori workflow tetap tersimpan.`
                : `Akun ${statusTarget?.name || statusTarget?.username} akan mendapatkan akses kembali sesuai role yang dimiliki.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); void handleStatusChange(); }}
              disabled={isUpdatingStatus}
              className={statusTarget?.active ? "bg-amber-700 text-white hover:bg-amber-800" : "bg-emerald-700 text-white hover:bg-emerald-800"}
            >
              {isUpdatingStatus && <LoaderCircle size={14} className="animate-spin" />}
              {statusTarget?.active ? "Deactivate User" : "Activate User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <strong>{deleteTarget?.name || deleteTarget?.username}</strong> akan dihapus. Tindakan ini dapat memengaruhi assignment dan audit history yang terhubung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={isDeleting} className="bg-red-700 text-white hover:bg-red-800">
              {isDeleting && <LoaderCircle size={14} className="animate-spin" />} Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.main>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold text-foreground">
        {label}{required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[9px] font-medium text-red-700">{error}</span>}
    </label>
  );
}
