"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { listCases, deleteCase } from "@/lib/actions/cases";
import { listClients } from "@/lib/actions/clients";
import { listAssignableUsers } from "@/lib/actions/users";
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
import { CaseForm } from "@/components/admin/CaseForm";

interface Case {
  id: string;
  numero_processo: string;
  fase: string;
  status: string;
  valor_pleiteado_contra: number;
  valor_condenado_contra: number;
  created_at: string;
}

interface Client {
  id: string;
  razao_social: string;
}

interface Lawyer {
  id: string;
  nome: string;
}

const faseColors: Record<string, string> = {
  conhecimento: "bg-blue-100 text-blue-800",
  recurso: "bg-yellow-100 text-yellow-800",
  execucao: "bg-purple-100 text-purple-800",
  encerrado: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  em_andamento: "bg-green-100 text-green-800",
  suspenso: "bg-orange-100 text-orange-800",
  resolvido: "bg-blue-100 text-blue-800",
  arquivado: "bg-gray-100 text-gray-800",
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pagination, setPagination] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [_selectedCase, setSelectedCase] = useState<Case | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadCases();
      loadLawyers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedClientId]);

  const loadClients = async () => {
    try {
      const result = await listClients(1, 100);
      if (result.success && result.data) {
        const clients = result.data as { id: string; razao_social: string }[];
        setClients(clients);
        // Set first client as default
        if (clients.length > 0) {
          setSelectedClientId(clients[0].id);
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar clientes");
    }
  };

  const loadCases = async () => {
    if (!selectedClientId) return;

    setLoading(true);
    try {
      const result = await listCases(selectedClientId, page, 20);
      if (result.success && result.data) {
        setCases(result.data);
        setPagination(result.pagination);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar processos");
    } finally {
      setLoading(false);
    }
  };

  const loadLawyers = async () => {
    try {
      const result = await listAssignableUsers();
      if ("data" in result && Array.isArray(result.data)) {
        setLawyers(
          result.data.map((u: { id: string; nome: string }) => ({
            id: u.id,
            nome: u.nome,
          }))
        );
      }
    } catch {
      console.error("Erro ao carregar advogados");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este processo?")) {
      try {
        const result = await deleteCase(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Processo deletado");
          await loadCases();
        }
      } catch {
        toast.error("Erro ao deletar processo");
      }
    }
  };

  const columns: Column<Case>[] = [
    {
      key: "numero_processo",
      label: "Número do Processo",
      width: "25%",
    },
    {
      key: "fase",
      label: "Fase",
      width: "15%",
      render: (value) => (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            faseColors[String(value)] || "bg-gray-100"
          }`}
        >
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "15%",
      render: (value) => (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[String(value)] || "bg-gray-100"
          }`}
        >
          {String(value).replace(/_/g, " ").charAt(0).toUpperCase() +
            String(value).slice(1).replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "valor_pleiteado_contra",
      label: "Valor Pleiteado",
      width: "15%",
      render: (value) => {
        const num = Number(value);
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(num);
      },
    },
    {
      key: "created_at",
      label: "Criado em",
      width: "15%",
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
        title="Processos"
        breadcrumbs={[{ label: "Processos" }]}
        subtitle="Gerenciamento de processos jurídicos"
        actions={
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Processo</DialogTitle>
              </DialogHeader>
              {selectedClientId && (
                <CaseForm
                  clientId={selectedClientId}
                  lawyers={lawyers}
                  onSuccess={() => {
                    setOpenModal(false);
                    loadCases();
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filtro */}
      <div className="rounded-lg bg-white p-4">
        <Select value={selectedClientId} onValueChange={(value) => {
          setSelectedClientId(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={cases}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedCase(row);
                setOpenModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
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
