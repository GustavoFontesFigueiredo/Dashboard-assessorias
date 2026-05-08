"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, ToggleRight, ToggleLeft } from "lucide-react";
import { toast } from "sonner";
import { listUsers, toggleUserActive } from "@/lib/actions/users";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/admin/UserForm";

interface User {
  id: string;
  nome: string;
  role: string;
  ativo: boolean;
  created_at: string;
}

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  controller: "bg-blue-100 text-blue-800",
  advogado: "bg-green-100 text-green-800",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | undefined>(undefined);
  const [openModal, setOpenModal] = useState(false);
  const [_selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await listUsers(page, 20, roleFilter || undefined);
    if (result.success) {
      setUsers(result.data);
      setPagination(result.pagination);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string) => {
    const result = await toggleUserActive(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status do usuário alterado");
      await loadUsers();
    }
  };

  const columns: Column<User>[] = [
    {
      key: "nome",
      label: "Nome",
      width: "35%",
    },
    {
      key: "role",
      label: "Papel",
      width: "20%",
      render: (value) => (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${roleColors[String(value)] || "bg-gray-100"}`}>
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
    {
      key: "ativo",
      label: "Status",
      width: "20%",
      render: (value) => (
        <span className={value ? "text-green-600 font-semibold" : "text-gray-400"}>
          {value ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Criado em",
      width: "20%",
      render: (value) => {
        if (typeof value === "string") {
          return new Date(value).toLocaleDateString("pt-BR");
        }
        return "—";
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Usuários"
        breadcrumbs={[{ label: "Usuários" }]}
        subtitle="Gerenciamento de usuários internos"
        actions={
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <UserForm
                onSuccess={() => {
                  setOpenModal(false);
                  loadUsers();
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filtro */}
      <div className="rounded-lg bg-white p-4">
        <Select value={roleFilter} onValueChange={(value) => {
          setRoleFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="controller">Controller</SelectItem>
            <SelectItem value="advogado">Advogado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedUser(row);
                setOpenModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleToggleActive(row.id)}
            >
              {row.ativo ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        )}
      />
    </div>
  );
}
