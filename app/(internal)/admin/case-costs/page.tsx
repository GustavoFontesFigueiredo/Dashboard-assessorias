"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { listCaseCosts, deleteCaseCost } from "@/lib/actions/case-costs";
import { listCases } from "@/lib/actions/cases";
import { listClients } from "@/lib/actions/clients";
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
import { CaseCostForm } from "@/components/admin/CaseCostForm";

interface CaseCost {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_competencia: string;
}

interface Client {
  id: string;
  razao_social: string;
}

interface Case {
  id: string;
  numero_processo: string;
}

const tipoColors: Record<string, string> = {
  honorario_fixo: "bg-blue-100 text-blue-800",
  honorario_variavel: "bg-green-100 text-green-800",
  custas: "bg-orange-100 text-orange-800",
  outro: "bg-gray-100 text-gray-800",
};

export default function CaseCostsPage() {
  const [costs, setCosts] = useState<CaseCost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [pagination, setPagination] = useState<{ total: number; pages: number } | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [_selectedCost, setSelectedCost] = useState<CaseCost | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadCosts();
      loadCases();
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

  const loadCosts = async () => {
    if (!selectedClientId) return;

    setLoading(true);
    try {
      const result = await listCaseCosts(selectedClientId, undefined, page, 20);
      if (result.success && result.data) {
        setCosts(result.data);
        setPagination(result.pagination);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar custos");
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    if (!selectedClientId) return;

    try {
      const result = await listCases(selectedClientId, 1, 100);
      if (result.success && result.data) {
        setCases(result.data);
      }
    } catch {
      console.error("Erro ao carregar processos:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este custo?")) {
      try {
        const result = await deleteCaseCost(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Custo deletado");
          await loadCosts();
        }
      } catch {
        toast.error("Erro ao deletar custo");
      }
    }
  };

  const columns: Column<CaseCost>[] = [
    {
      key: "tipo",
      label: "Tipo",
      width: "20%",
      render: (value) => (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            tipoColors[String(value)] || "bg-gray-100"
          }`}
        >
          {String(value).replace(/_/g, " ").charAt(0).toUpperCase() +
            String(value).slice(1).replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "descricao",
      label: "Descrição",
      width: "35%",
    },
    {
      key: "valor",
      label: "Valor",
      width: "20%",
      render: (value) => {
        const num = Number(value);
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(num);
      },
    },
    {
      key: "data_competencia",
      label: "Data de Competência",
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
        title="Custos de Processos"
        breadcrumbs={[{ label: "Custos de Processos" }]}
        subtitle="Gerenciamento de custos associados aos processos"
        actions={
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Custo</DialogTitle>
              </DialogHeader>
              {selectedClientId && (
                <CaseCostForm
                  clientId={selectedClientId}
                  cases={cases}
                  onSuccess={() => {
                    setOpenModal(false);
                    loadCosts();
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
        data={costs}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedCost(row);
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
