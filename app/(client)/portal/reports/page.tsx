"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Loader2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth";
import { listMonthlyReports } from "@/lib/actions/monthly-reports";

interface Report {
  id: string;
  referencia: string;
  narrativa_ai: string | null;
  arquivo_url: string;
  arquivo_nome: string;
  created_at: string;
}

export default function ClientReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (user?.client_id) {
        const res = await listMonthlyReports(user.client_id);
        if (res.success && res.data) {
          setReports(res.data as Report[]);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatRef = (ref: string) => {
    const parts = ref.split("-").map(Number);
    const year = parts[0] ?? 2026;
    const month = parts[1] ?? 1;
    const d = new Date(year, month - 1, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios Mensais</h1>
        <p className="mt-1 text-gray-500">
          Acompanhe os relatórios gerados pela sua assessoria jurídica
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">
            Nenhum relatório disponível ainda
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Seus relatórios mensais aparecerão aqui quando forem gerados.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatRef(report.referencia)}
                </h3>
              </div>

              {report.narrativa_ai && (
                <p className="mb-4 flex-1 line-clamp-4 text-sm text-gray-600">
                  {report.narrativa_ai}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between border-t pt-3">
                <span className="text-xs text-gray-400">
                  {new Date(report.created_at).toLocaleDateString("pt-BR")}
                </span>
                {report.arquivo_url && (
                  <a href={report.arquivo_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-2 bg-brand-gradient text-white hover:opacity-90">
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
