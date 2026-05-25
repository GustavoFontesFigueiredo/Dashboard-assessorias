import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import type { ClientNarratedUpdate } from "@/lib/actions/client-clarity";

interface NarratedUpdatesPanelProps {
  updates: ClientNarratedUpdate[];
}

const tipoLabels: Record<string, string> = {
  status_change: "Status",
  fase_change: "Fase",
  valor_change: "Valor",
  observacao: "Observação",
  documento: "Documento",
  audiencia: "Audiência",
};

export function NarratedUpdatesPanel({ updates }: NarratedUpdatesPanelProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-950">Últimas atualizações</h2>
        <p className="text-sm text-gray-600">
          Registros recentes traduzidos para linguagem objetiva.
        </p>
      </div>

      {updates.length === 0 ? (
        <Card className="border-dashed p-6 text-sm text-gray-600">
          Nenhuma atualização foi publicada no portal até o momento.
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <Card key={update.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{formatDate(update.created_at)}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                  {tipoLabels[update.tipo] || "Atualização"}
                </span>
                <Link
                  href={`/portal/cases/${update.case_id}`}
                  className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {update.processo}
                </Link>
              </div>

              {update.narrativa_ai ? (
                <div className="mt-3 rounded-md border-l-4 border-amber-500 bg-amber-50 p-4">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-amber-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    O que isso significa
                  </p>
                  <p className="text-sm leading-relaxed text-amber-950">
                    {update.narrativa_ai}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {update.descricao_tecnica}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
