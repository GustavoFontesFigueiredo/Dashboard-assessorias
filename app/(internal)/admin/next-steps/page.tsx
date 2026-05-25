"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { NextStepForm } from "@/components/admin/NextStepForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listClients } from "@/lib/actions/clients";
import { listCases } from "@/lib/actions/cases";
import { listAssignableUsers } from "@/lib/actions/users";
import {
  cancelClientNextStep,
  listClientNextSteps,
} from "@/lib/actions/client-next-steps";
import type { ClientNextStepInput } from "@/lib/validators/client-next-step";

interface Client {
  id: string;
  razao_social: string;
}

interface CaseOption {
  id: string;
  numero_processo: string;
}

interface OwnerOption {
  id: string;
  nome: string;
}

interface NextStepRow {
  id: string;
  client_id: string;
  case_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  owner_name: string | null;
  case_number: string | null;
  due_date: string | null;
  status: ClientNextStepInput["status"];
  visible_to_client: boolean;
  created_at: string;
}

const statusLabels: Record<ClientNextStepInput["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  aguardando_cliente: "Aguardando cliente",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusStyles: Record<ClientNextStepInput["status"], string> = {
  pendente: "bg-slate-100 text-slate-700",
  em_andamento: "bg-blue-100 text-blue-800",
  aguardando_cliente: "bg-amber-100 text-amber-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-gray-100 text-gray-600",
};

export default function NextStepsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [steps, setSteps] = useState<NextStepRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<NextStepRow | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId],
  );

  const loadClients = async () => {
    const result = await listClients(1, 100);
    if (result.success && result.data) {
      const data = result.data as Client[];
      setClients(data);
      setSelectedClientId((current) => current || data[0]?.id || "");
    } else {
      toast.error(result.error || "Erro ao carregar clientes");
    }
  };

  const loadOwners = async () => {
    const result = await listAssignableUsers();
    if ("data" in result && Array.isArray(result.data)) {
      setOwners(result.data as OwnerOption[]);
    }
  };

  const loadClientData = async () => {
    if (!selectedClientId) return;
    setLoading(true);

    const [casesResult, stepsResult] = await Promise.all([
      listCases(selectedClientId, 1, 100),
      listClientNextSteps(selectedClientId),
    ]);

    if (casesResult.success && casesResult.data) {
      setCases(casesResult.data as CaseOption[]);
    } else {
      toast.error(casesResult.error || "Erro ao carregar processos");
    }

    if (stepsResult.success && stepsResult.data) {
      setSteps(stepsResult.data as NextStepRow[]);
    } else {
      toast.error(stepsResult.error || "Erro ao carregar próximos passos");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadClients();
    loadOwners();
  }, []);

  useEffect(() => {
    loadClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const handleCancel = async (id: string) => {
    if (!confirm("Deseja cancelar este próximo passo?")) return;
    const result = await cancelClientNextStep(id);
    if (result.success) {
      toast.success("Próximo passo cancelado");
      await loadClientData();
    } else {
      toast.error(result.error || "Erro ao cancelar próximo passo");
    }
  };

  const columns: Column<NextStepRow>[] = [
    {
      key: "title",
      label: "Próximo passo",
      width: "30%",
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-950">{String(value)}</p>
          {row.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "case_number",
      label: "Processo",
      width: "16%",
      render: (value) => value ? String(value) : "—",
    },
    {
      key: "owner_name",
      label: "Responsável",
      width: "16%",
      render: (value) => value ? String(value) : "Equipe FFADV",
    },
    {
      key: "due_date",
      label: "Prazo",
      width: "12%",
      render: (value) =>
        typeof value === "string"
          ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR")
          : "—",
    },
    {
      key: "status",
      label: "Status",
      width: "14%",
      render: (value) => {
        const status = value as ClientNextStepInput["status"];
        return (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    {
      key: "visible_to_client",
      label: "Portal",
      width: "10%",
      render: (value) => value ? "Visível" : "Interno",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Próximos Passos"
        breadcrumbs={[{ label: "Próximos Passos" }]}
        subtitle="Organize a comunicação objetiva que aparecerá no portal do cliente"
        actions={
          <Dialog
            open={openModal}
            onOpenChange={(open) => {
              setOpenModal(open);
              if (!open) setSelectedStep(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2 bg-brand-gradient text-white hover:opacity-90"
                disabled={!selectedClientId}
              >
                <Plus className="h-4 w-4" />
                Novo Próximo Passo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedStep ? "Editar próximo passo" : "Criar próximo passo"}
                </DialogTitle>
              </DialogHeader>
              {selectedClientId && (
                <NextStepForm
                  clientId={selectedClientId}
                  cases={cases}
                  owners={owners}
                  initialData={
                    selectedStep
                      ? {
                          id: selectedStep.id,
                          clientId: selectedStep.client_id,
                          caseId: selectedStep.case_id,
                          title: selectedStep.title,
                          description: selectedStep.description,
                          ownerId: selectedStep.owner_id,
                          dueDate: selectedStep.due_date || "",
                          status: selectedStep.status,
                          visibleToClient: selectedStep.visible_to_client,
                        }
                      : undefined
                  }
                  onSuccess={() => {
                    setOpenModal(false);
                    setSelectedStep(null);
                    loadClientData();
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-lg bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cliente
        </label>
        <Select
          value={selectedClientId}
          onValueChange={setSelectedClientId}
        >
          <SelectTrigger className="w-full max-w-md">
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
        {selectedClient && (
          <p className="mt-2 text-xs text-gray-500">
            Os próximos passos visíveis aparecerão no portal de {selectedClient.razao_social}.
          </p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={steps}
        loading={loading}
        emptyMessage="Nenhum próximo passo cadastrado para este cliente"
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              title="Editar próximo passo"
              onClick={() => {
                setSelectedStep(row);
                setOpenModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {row.status !== "cancelado" && (
              <Button
                size="sm"
                variant="ghost"
                title="Cancelar próximo passo"
                onClick={() => handleCancel(row.id)}
              >
                <Ban className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
}
