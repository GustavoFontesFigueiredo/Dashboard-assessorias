import { DollarSign, Shield, Target, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatBRL } from "@/lib/formatters";
import type { KPIData } from "@/lib/db/queries/kpis";
import type { KpiVisibility } from "@/lib/actions/client-clarity";

interface ValueEvidencePanelProps {
  kpis: KPIData;
  visibility: KpiVisibility;
}

function visible(visibility: KpiVisibility, key: keyof KpiVisibility) {
  return visibility[key] !== false;
}

function formatROI(value: number) {
  if (!Number.isFinite(value)) return "∞";
  return `${(value * 100).toFixed(1)}%`;
}

export function ValueEvidencePanel({ kpis, visibility }: ValueEvidencePanelProps) {
  const items = [
    visible(visibility, "custos") && (
      <KpiCard
        key="custos"
        title="Investimento na assessoria"
        value={formatBRL(kpis.custos)}
        icon={<DollarSign className="h-6 w-6 text-white" />}
        variant="primary"
      />
    ),
    visible(visibility, "evitadas") && (
      <KpiCard
        key="evitadas"
        title="Condenações evitadas"
        value={formatBRL(kpis.condenacoes_evitadas)}
        icon={<Shield className="h-6 w-6 text-white" />}
        variant="primary"
      />
    ),
    visible(visibility, "recebidos") && (
      <KpiCard
        key="recebidos"
        title="Valores recebidos"
        value={formatBRL(kpis.valores_recebidos)}
        icon={<TrendingUp className="h-6 w-6 text-white" />}
        variant="success"
      />
    ),
    visible(visibility, "roi") && (
      <KpiCard
        key="roi"
        title="ROI demonstrado"
        value={formatROI(kpis.roi)}
        subtitle="Retorno sobre investimento"
        icon={<Target className="h-6 w-6 text-white" />}
        variant="primary"
      />
    ),
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-950">Valor demonstrado</h2>
        <p className="text-sm text-gray-600">
          Indicadores financeiros autorizados para acompanhamento.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items}
      </div>
    </section>
  );
}
