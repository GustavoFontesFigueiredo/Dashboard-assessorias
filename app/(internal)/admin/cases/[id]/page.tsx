import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/card";
import { CaseTimelineSection } from "@/components/timeline/CaseTimelineSection";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*, clients(razao_social)")
    .eq("id", id)
    .single();

  if (error || !caseData) notFound();

  const clientName =
    (caseData.clients as { razao_social: string } | null)?.razao_social || "Cliente";

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title={caseData.numero_processo}
        subtitle={caseData.descricao || clientName}
        breadcrumbs={[
          { label: "Processos", href: "/admin/cases" },
          { label: caseData.numero_processo },
        ]}
      />

      {/* Info card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {caseData.numero_processo}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              faseColors[caseData.fase] || "bg-gray-100"
            }`}
          >
            {caseData.fase.charAt(0).toUpperCase() + caseData.fase.slice(1)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusColors[caseData.status] || "bg-gray-100"
            }`}
          >
            {caseData.status.replace(/_/g, " ").charAt(0).toUpperCase() +
              caseData.status.slice(1).replace(/_/g, " ")}
          </span>
        </div>

        {caseData.descricao && (
          <p className="mt-2 text-sm text-gray-600">{caseData.descricao}</p>
        )}

        {/* Value cards */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Valor Pleiteado</p>
            <p className="text-sm font-semibold">
              {formatCurrency(caseData.valor_pleiteado_contra || 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Valor Condenado</p>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(caseData.valor_condenado_contra || 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Condenação Favorável</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(caseData.valor_condenacao_favoravel || 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-gray-500">Acordo Recebido</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(caseData.valor_acordo_recebido || 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline section */}
      <CaseTimelineSection caseId={id} />
    </div>
  );
}
