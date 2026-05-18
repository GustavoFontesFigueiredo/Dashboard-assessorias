"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, CheckCircle, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateMonthlyReport,
  listClientsReportStatus,
  listMonthlyReports,
  deleteMonthlyReport,
} from "@/lib/actions/monthly-reports";

interface ClientStatus {
  id: string;
  razao_social: string;
  cnpj: string;
  has_report: boolean;
}

interface Report {
  id: string;
  referencia: string;
  narrativa_ai: string | null;
  arquivo_url: string;
  arquivo_nome: string;
  created_at: string;
}

export default function AdminReportsPage() {
  const [clients, setClients] = useState<ClientStatus[]>([]);
  const [currentRef, setCurrentRef] = useState("");
  const [selectedRef, setSelectedRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Para visualizar relatórios de um cliente
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Gerar opções de meses (últimos 12 meses)
  const monthOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  })();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    const res = await listClientsReportStatus();
    if (res.success && res.data) {
      setClients(res.data);
      setCurrentRef(res.currentRef || "");
      if (!selectedRef) setSelectedRef(res.currentRef || "");
    }
    setLoading(false);
  };

  const handleGenerate = async (clientId: string) => {
    if (!selectedRef) return;
    setGeneratingId(clientId);
    const result = await generateMonthlyReport(clientId, selectedRef);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Relatório gerado com sucesso!");
      loadStatus();
    }
    setGeneratingId(null);
  };

  const handleGenerateAll = async () => {
    if (!selectedRef) return;
    const pending = clients.filter((c) => !c.has_report);
    if (pending.length === 0) {
      toast.info("Todos os relatórios já foram gerados");
      return;
    }
    for (const client of pending) {
      setGeneratingId(client.id);
      const result = await generateMonthlyReport(client.id, selectedRef);
      if (result.error) {
        toast.error(`${client.razao_social}: ${result.error}`);
      } else {
        toast.success(`${client.razao_social}: relatório gerado`);
      }
    }
    setGeneratingId(null);
    loadStatus();
  };

  const handleViewReports = async (clientId: string) => {
    setSelectedClient(clientId);
    setLoadingReports(true);
    const res = await listMonthlyReports(clientId);
    if (res.success && res.data) {
      setReports(res.data as Report[]);
    }
    setLoadingReports(false);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Tem certeza que deseja excluir este relatório?")) return;
    const result = await deleteMonthlyReport(reportId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Relatório excluído");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      loadStatus();
    }
  };

  const selectedClientName = clients.find((c) => c.id === selectedClient)?.razao_social;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Mensais</h1>
          <p className="mt-1 text-gray-500">
            Gere relatórios com narrativa IA para seus clientes
          </p>
        </div>
      </div>

      {/* Seletor de mês + Gerar Todos */}
      <Card className="flex items-center gap-4 p-4">
        <label className="text-sm font-medium text-gray-700">Mês de referência:</label>
        <Select value={selectedRef} onValueChange={setSelectedRef}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerateAll}
          disabled={!!generatingId}
          className="ml-auto gap-2 bg-brand-gradient text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Gerar Todos Pendentes
        </Button>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {client.has_report && selectedRef === currentRef ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{client.razao_social}</p>
                  <p className="text-xs text-gray-500">{client.cnpj}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewReports(client.id)}
                >
                  Ver Histórico
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGenerate(client.id)}
                  disabled={generatingId === client.id}
                  className="gap-2 bg-brand-gradient text-white hover:opacity-90"
                >
                  {generatingId === client.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Gerar {selectedRef}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de histórico de relatórios */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Relatórios — {selectedClientName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                Fechar
              </Button>
            </div>

            {loadingReports ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : reports.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Nenhum relatório gerado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Referência: {report.referencia}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Gerado em:{" "}
                          {new Date(report.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {report.narrativa_ai && (
                          <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                            {report.narrativa_ai}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {report.arquivo_url && (
                          <a href={report.arquivo_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1">
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
