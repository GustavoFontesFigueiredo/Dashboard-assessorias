import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaseTimeline } from "@/components/timeline/CaseTimeline";

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

export default async function ClientCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's client_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  // Fetch case
  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !caseData) notFound();

  // Verify client owns this case
  if (profile?.client_id !== caseData.client_id) {
    redirect("/portal/cases");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/cases">
          <Button variant="outline" size="sm" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {caseData.numero_processo}
        </h1>
      </div>

      {/* Info card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
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

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {caseData.valor_pleiteado_contra > 0 && (
            <div>
              <p className="text-xs text-gray-500">Valor Pleiteado</p>
              <p className="text-sm font-semibold">
                {formatCurrency(caseData.valor_pleiteado_contra)}
              </p>
            </div>
          )}
          {caseData.valor_condenado_contra > 0 && (
            <div>
              <p className="text-xs text-gray-500">Valor Condenado</p>
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(caseData.valor_condenado_contra)}
              </p>
            </div>
          )}
          {caseData.valor_condenacao_favoravel > 0 && (
            <div>
              <p className="text-xs text-gray-500">Condenação Favorável</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(caseData.valor_condenacao_favoravel)}
              </p>
            </div>
          )}
          {caseData.valor_acordo_recebido > 0 && (
            <div>
              <p className="text-xs text-gray-500">Acordo Recebido</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(caseData.valor_acordo_recebido)}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Atualizações</h2>
        <CaseTimeline caseId={id} />
      </div>
    </div>
  );
}
