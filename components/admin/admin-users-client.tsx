"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
}

export function AdminUsersClient({ users: initial }: { users: User[] }) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Completá todos los campos", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: form.name, email: form.email, password: form.password }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setUsers(u => [...u, { ...data.user, is_admin: false }]);
      setForm({ name: "", email: "", password: "" });
      toast({ title: `Usuario ${form.name} creado` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Nombre", "Email"], ...users.map(u => [u.display_name, u.email])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "usuarios.csv";
    a.click();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios ({users.length})</h1>
        <button onClick={exportCSV} className="text-sm text-gray-500 hover:text-gray-800 underline">
          Exportar CSV
        </button>
      </div>

      {/* Create user form */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Crear jugador</h2>
        <input type="text" placeholder="Nombre" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="password" placeholder="Contraseña" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={createUser} disabled={saving}
          className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Creando..." : "Crear jugador"}
        </button>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-xl border px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{u.display_name}</span>
              {u.is_admin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">admin</span>}
              <p className="text-xs text-gray-400">{u.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
