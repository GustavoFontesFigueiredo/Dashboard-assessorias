import { AlertCircle, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import type { ClientNextStep, ClientNextStepStatus } from "@/lib/actions/client-clarity";

interface NextStepsPanelProps {
  steps: ClientNextStep[];
}

const statusLabels: Record<ClientNextStepStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  aguardando_cliente: "Aguardando cliente",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusStyles: Record<ClientNextStepStatus, string> = {
  pendente: "bg-slate-100 text-slate-700",
  em_andamento: "bg-blue-100 text-blue-800",
  aguardando_cliente: "bg-amber-100 text-amber-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-gray-100 text-gray-600",
};

function getDueLabel(dueDate: string | null) {
  if (!dueDate) return "Sem prazo definido";
  return `Prazo: ${formatDate(dueDate)}`;
}

export function NextStepsPanel({ steps }: NextStepsPanelProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Próximos passos</h2>
          <p className="text-sm text-gray-600">
            O que está sendo conduzido agora pela assessoria.
          </p>
        </div>
        <CalendarClock className="h-5 w-5 text-brand-600" />
      </div>

      {steps.length === 0 ? (
        <Card className="border-dashed p-6">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-gray-900">
                Nenhuma ação pendente publicada no momento.
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Quando houver uma providência relevante, ela aparecerá aqui com responsável e prazo.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {steps.map((step) => (
            <Card
              key={step.id}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-950">{step.title}</p>
                  {step.description && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[step.status]}`}
                >
                  {statusLabels[step.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {getDueLabel(step.due_date)}
                </span>
                <span>
                  Responsável: {step.owner_name || "equipe FFADV"}
                </span>
              </div>

              {step.status === "aguardando_cliente" && (
                <div className="mt-4 flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Este ponto depende de uma informação ou decisão da sua empresa.</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
