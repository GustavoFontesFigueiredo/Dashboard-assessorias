import { Sparkles, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import type { SummarySource } from "@/lib/actions/client-clarity";

interface ExecutiveSummaryPanelProps {
  clientName: string;
  responsibleName: string | null;
  summary: string;
  source: SummarySource;
  generatedAt: string | null;
}

const sourceLabels: Record<SummarySource, string> = {
  ai: "Resumo assistido por IA",
  fallback: "Resumo automático",
  manual: "Resumo revisado",
};

export function ExecutiveSummaryPanel({
  clientName,
  responsibleName,
  summary,
  source,
  generatedAt,
}: ExecutiveSummaryPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg bg-brand-gradient text-white shadow-sm">
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_280px] md:p-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85">
            <Sparkles className="h-3.5 w-3.5" />
            Central de clareza
          </div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            {clientName}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/88">
            {summary}
          </p>
        </div>

        <Card className="border-white/10 bg-white/10 p-5 text-white shadow-none">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-white/15">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-white/60">
            Advogado responsável
          </p>
          <p className="mt-1 text-lg font-semibold">
            {responsibleName || "Responsável em definição"}
          </p>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs text-white/60">{sourceLabels[source]}</p>
            {generatedAt && (
              <p className="mt-1 text-xs text-white/75">
                Atualizado em {formatDate(generatedAt)}
              </p>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
