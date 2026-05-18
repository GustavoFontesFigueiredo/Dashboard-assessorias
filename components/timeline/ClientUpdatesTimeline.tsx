"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listClientUpdates } from "@/lib/actions/case-updates";

interface ClientUpdate {
  id: string;
  case_id: string;
  tipo: string;
  descricao_tecnica: string;
  narrativa_ai: string | null;
  created_at: string;
  author_name: string;
  processo: string;
  processo_descricao: string;
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

export function ClientUpdatesTimeline({ clientId }: { clientId: string }) {
  const [updates, setUpdates] = useState<ClientUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await listClientUpdates(clientId, 10);
      if (result.success && result.data) {
        setUpdates(result.data as ClientUpdate[]);
      }
      setLoading(false);
    };
    load();
  }, [clientId]);

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Carregando atualizações...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Últimas Atualizações</h2>

      {updates.length === 0 ? (
        <p className="py-8 text-center text-gray-500">Nenhuma atualização recente</p>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => {
            const date = new Date(update.created_at);
            const dateStr = date.toLocaleDateString("pt-BR");

            return (
              <Card key={update.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{dateStr}</span>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/portal/cases/${update.case_id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {update.processo}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      tipoBadgeColors[update.tipo] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tipoLabels[update.tipo] || update.tipo}
                  </span>
                </div>

                {update.narrativa_ai ? (
                  <div className="mt-2 rounded-md border-l-4 border-yellow-500 bg-amber-50 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
                      <span>&#10024;</span> Resumo:
                    </p>
                    <p className="text-sm text-amber-900">{update.narrativa_ai}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">{update.descricao_tecnica}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
