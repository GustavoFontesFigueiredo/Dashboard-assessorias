import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { MonthlyReportSummary } from "@/lib/actions/client-clarity";

interface ReportsPreviewPanelProps {
  reports: MonthlyReportSummary[];
}

function formatReference(reference: string) {
  const [year, month] = reference.split("-").map(Number);
  if (!year || !month) return reference;
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function ReportsPreviewPanel({ reports }: ReportsPreviewPanelProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Relatórios</h2>
          <p className="text-sm text-gray-600">
            Histórico mensal da assessoria jurídica.
          </p>
        </div>
        <Link href="/portal/reports">
          <Button variant="outline">Ver todos</Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed p-6 text-sm text-gray-600">
          Nenhum relatório mensal foi publicado para sua empresa até o momento.
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-brand-700">
                <FileText className="h-5 w-5" />
              </div>
              <p className="font-semibold capitalize text-gray-950">
                {formatReference(report.referencia)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Publicado em {formatDate(report.created_at)}
              </p>
              {report.narrativa_ai && (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-600">
                  {report.narrativa_ai}
                </p>
              )}
              <div className="mt-auto pt-4">
                {report.arquivo_url ? (
                  <a href={report.arquivo_url} target="_blank" rel="noreferrer">
                    <Button className="w-full gap-2 bg-brand-gradient text-white hover:opacity-90">
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </Button>
                  </a>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    PDF indisponível
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
