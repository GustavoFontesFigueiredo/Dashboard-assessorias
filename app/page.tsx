import { BrandHeader } from "@/components/brand/BrandHeader";
import { GradientBadge } from "@/components/brand/GradientBadge";
import { KpiCard } from "@/components/brand/KpiCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <BrandHeader />

      <section className="container py-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fontes Figueiredo Advogados
          </h1>
          <GradientBadge variant="gold">v1 · em construção</GradientBadge>
        </div>
        <p className="text-muted-foreground max-w-xl">
          Dashboard de resultados da assessoria jurídica — custos, condenações
          evitadas, valores recebidos e ROI. Login disponível na próxima entrega.
        </p>
      </section>

      {/* Preview visual dos cards KPI */}
      <section className="container pb-16">
        <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
          Prévia dos cards — dados fictícios
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Custos da Assessoria"
            value="R$ 48.500"
            sub="Jan – Abr 2026"
            variant="default"
          />
          <KpiCard
            label="Condenações Evitadas"
            value="R$ 312.000"
            sub="valor pleiteado − condenado"
            variant="primary"
          />
          <KpiCard
            label="Valores Recebidos"
            value="R$ 95.200"
            sub="acordos + condenações favoráveis"
            variant="default"
          />
          <KpiCard
            label="ROI da Assessoria"
            value="8,4×"
            sub="(evitadas + recebidos) / custos"
            variant="accent"
          />
        </div>
      </section>
    </main>
  );
}
