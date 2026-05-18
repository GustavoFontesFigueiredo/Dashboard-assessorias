"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { listClients, deleteClient } from "@/lib/actions/clients";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/admin/ClientForm";
import { PortalUserForm } from "@/components/admin/PortalUserForm";

interface Client {
  id: string;
  razao_social: string;
  cnpj?: string;
  ativo: boolean;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pagination, setPagination] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [_selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [portalModal, setPortalModal] = useState(false);
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const loadClients = async () => {
    setLoading(true);
    const result = await listClients(page, 20, search || undefined);
    if (result.success) {
      setClients(result.data);
      setPagination(result.pagination);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este cliente?")) {
      const result = await deleteClient(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cliente deletado");
        await loadClients();
      }
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "razao_social",
      label: "Razão Social",
      width: "40%",
    },
    {
      key: "cnpj",
      label: "CNPJ",
      width: "25%",
      render: (value) => value || "—",
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
        title="Clientes"
        breadcrumbs={[{ label: "Clientes" }]}
        subtitle="Gerenciamento de empresas-cliente"
        actions={
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm
                onSuccess={() => {
                  setOpenModal(false);
                  loadClients();
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filtro */}
      <div className="rounded-lg bg-white p-4">
        <Input
          placeholder="Buscar por razão social ou CNPJ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Modal — Criar acesso ao portal */}
      <Dialog open={portalModal} onOpenChange={setPortalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar acesso ao portal</DialogTitle>
          </DialogHeader>
          {portalClient && (
            <PortalUserForm
              clientId={portalClient.id}
              clientName={portalClient.razao_social}
              onSuccess={() => {/* mantém aberto para mostrar a senha */}}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              title="Criar acesso ao portal"
              onClick={() => {
                setPortalClient(row);
                setPortalModal(true);
              }}
            >
              <UserPlus className="h-4 w-4 text-brand-700" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Editar cliente"
              onClick={() => {
                setSelectedClient(row);
                setOpenModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Excluir cliente"
              onClick={() => handleDelete(row.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
