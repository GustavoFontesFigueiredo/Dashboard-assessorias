"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCaseUpdates, deleteCaseUpdate } from "@/lib/actions/case-updates";
import { getCurrentUser } from "@/lib/actions/auth";

interface CaseUpdate {
  id: string;
  case_id: string;
  client_id: string;
  tipo: string;
  descricao_tecnica: string;
  narrativa_ai: string | null;
  dados_alteracao: Record<string, unknown>;
  created_at: string;
  author_name: string;
}

const tipoBadgeColors: Record<string, string> = {
  status_change: "bg-blue-100 text-blue-800",
  fase_change: "bg-purple-100 text-purple-800",
  valor_change: "bg-green-100 text-green-800",
  observacao: "bg-gray-100 text-gray-800",
  documento: "bg-orange-100 text-orange-800",
  audiencia: "bg-red-100 text-red-800",
};

const tipoLabels: Record<string, string> = {
  status_change: "Alteração de Status",
  fase_change: "Alteração de Fase",
  valor_change: "Alteração de Valor",
  observacao: "Observação",
  documento: "Documento",
  audiencia: "Audiência",
};

export function CaseTimeline({ caseId }: { caseId: string }) {
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listCaseUpdates(caseId);
    if (result.success && result.data) {
      setUpdates(result.data as CaseUpdate[]);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    load();
    // Verificar se o usuário é admin/controller
    getCurrentUser().then((user) => {
      if (user && ["admin", "controller"].includes(user.role)) {
        setCanDelete(true);
      }
    });
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta atualização?")) return;
    setDeletingId(id);
    const result = await deleteCaseUpdate(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Atualização excluída");
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    }
    setDeletingId(null);
  };

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Carregando atualizações...</p>;
  }

  if (updates.length === 0) {
    return <p className="py-8 text-center text-gray-500">Nenhuma atualização registrada</p>;
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 md:left-[140px]" />

      {updates.map((update) => {
        const date = new Date(update.created_at);
        const dateStr = date.toLocaleDateString("pt-BR");
        const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        return (
          <div key={update.id} className="relative flex gap-6 pb-6">
            {/* Date column */}
            <div className="w-[100px] shrink-0 text-right md:w-[120px]">
              <p className="text-sm font-medium text-gray-700">{dateStr}</p>
              <p className="text-xs text-gray-500">{timeStr}</p>
            </div>

            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-brand-600 shadow" />

            {/* Content card */}
            <Card className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      tipoBadgeColors[update.tipo] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tipoLabels[update.tipo] || update.tipo}
                  </span>
                  <span className="text-xs text-gray-500">por {update.author_name}</span>
                </div>

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                    onClick={() => handleDelete(update.id)}
                    disabled={deletingId === update.id}
                    title="Excluir atualização"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-600">{update.descricao_tecnica}</p>

              {update.narrativa_ai && (
                <div className="mt-3 rounded-md border-l-4 border-yellow-500 bg-amber-50 p-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
                    <span>&#10024;</span> Resumo para o cliente:
                  </p>
                  <p className="text-sm text-amber-900">{update.narrativa_ai}</p>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
