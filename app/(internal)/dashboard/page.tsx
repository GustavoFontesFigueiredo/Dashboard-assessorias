"use client";

import type { SessionUser } from "@/lib/auth/getSession";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Shield, Target } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CostsChart } from "@/components/dashboard/CostsChart";
import { ReceiptsChart } from "@/components/dashboard/ReceiptsChart";
import { CasesStatusChart } from "@/components/dashboard/CasesStatusChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateKPIs,
  getCostosTimeSeries,
  getRecebimentosTimeSeries,
  getCasesStatusSummary,
} from "@/lib/db/queries/kpis";
import { listClients } from "@/lib/actions/clients";
import { getCurrentUser } from "@/lib/actions/auth";
import { getLawyerAssignments } from "@/lib/actions/assignments";
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton";
import { InactivityAlerts } from "@/components/dashboard/InactivityAlerts";
import { WeeklyDigest } from "@/components/dashboard/WeeklyDigest";
import { LawyerInsightPanel } from "@/components/dashboard/LawyerInsightPanel";

interface Client {
  id: string;
  razao_social: string;
}

interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

type PeriodType = "mes" | "trimestre" | "ano";

export default function DashboardPage() {
  const [_user, setUser] = useState<SessionUser | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [period, setPeriod] = useState<PeriodType>("mes");
  const [kpis, setKpis] = useState<KPIData>({
    custos: 0,
    condenacoes_evitadas: 0,
    valores_recebidos: 0,
    roi: 0,
  });
  const [costosData, setCostosData] = useState<Array<{ mes: string; valor: number }>>([]);
  const [recebimentosData, setRecebimentosData] = useState<
    Array<{ mes: string; valor: number }>
  >([]);
  const [casesStatus, setCasesStatus] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Carregar usuário e clientes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }

        let clientsToShow: Client[] = [];

        // Se for advogado, carregar apenas clientes atribuídos
        if (currentUser?.role === "advogado") {
          const assignedIds = await getLawyerAssignments(currentUser.id);
          const allClients = await listClients(1, 100);
          if (allClients.success && allClients.data && Array.isArray(assignedIds)) {
            clientsToShow = allClients.data.filter((c: Client) =>
              assignedIds.includes(c.id)
            );
          }
        } else {
          // Admin e Controller veem todos
          const result = await listClients(1, 100);
          if (result.success && result.data) {
            clientsToShow = result.data;
          }
        }

        setClients(clientsToShow);
        if (clientsToShow && clientsToShow.length > 0) {
          setSelectedClientId(clientsToShow[0]?.id || "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    loadInitialData();
  }, []);

  // Carregar KPIs quando mudar cliente ou período
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedClientId) return;

      setLoading(true);
      try {
        const now = new Date();
        const startDate = getStartDate(now, period);

        // Carregar KPIs
        const kpiData = await calculateKPIs(selectedClientId, startDate, now);
        setKpis(kpiData);

        // Carregar séries temporais
        const costosTimeSeries = await getCostosTimeSeries(
          selectedClientId,
          startDate,
          now
        );
        setCostosData(costosTimeSeries);

        const recebimentosTimeSeries = await getRecebimentosTimeSeries(
          selectedClientId,
          startDate,
          now
        );
        setRecebimentosData(recebimentosTimeSeries);

        // Carregar status dos casos
        const casesStatusSummary = await getCasesStatusSummary(
          selectedClientId
        );
        setCasesStatus(casesStatusSummary);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedClientId, period]);

  const getStartDate = (now: Date, periodType: PeriodType): Date => {
    const date = new Date(now);
    switch (periodType) {
      case "mes":
        date.setMonth(date.getMonth() - 1);
        break;
      case "trimestre":
        date.setMonth(date.getMonth() - 3);
        break;
      case "ano":
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatROI = (value: number) => {
    if (!isFinite(value)) return "∞";
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-6">
      <AdminHeader
        title="Dashboard"
        breadcrumbs={[{ label: "Dashboard" }]}
        subtitle="Visão geral dos KPIs da assessoria"
      />

      {/* Filtros */}
      <div className="rounded-lg bg-white p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">Cliente</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-gray-700">Período</label>
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Últimos 30 dias</SelectItem>
                <SelectItem value="trimestre">Últimos 90 dias</SelectItem>
                <SelectItem value="ano">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Custos da Assessoria"
              value={formatCurrency(kpis.custos)}
              icon={<DollarSign className="h-6 w-6 text-white" />}
              variant="primary"
            />
            <KpiCard
              title="Condenações Evitadas"
              value={formatCurrency(kpis.condenacoes_evitadas)}
              icon={<Shield className="h-6 w-6 text-white" />}
              variant="primary"
            />
            <KpiCard
              title="Valores Recebidos"
              value={formatCurrency(kpis.valores_recebidos)}
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              variant="success"
            />
            <KpiCard
              title="ROI"
              value={formatROI(kpis.roi)}
              subtitle="Retorno sobre investimento"
              icon={<Target className="h-6 w-6 text-white" />}
              variant="primary"
            />
          </div>

          {/* Digest + Alertas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WeeklyDigest />
            <InactivityAlerts />
          </div>

          {/* Insight IA do cliente selecionado */}
          {selectedClientId && (
            <LawyerInsightPanel
              clientId={selectedClientId}
              clientName={clients.find((c) => c.id === selectedClientId)?.razao_social || ""}
            />
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CostsChart data={costosData} />
            <ReceiptsChart data={recebimentosData} />
          </div>

          {/* Status dos Casos */}
          <div className="grid grid-cols-1 gap-6">
            {casesStatus.length > 0 ? (
              <CasesStatusChart data={casesStatus} />
            ) : (
              <div className="rounded-lg bg-white p-6 text-center text-gray-500">
                Nenhum processo registrado para este cliente
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="rounded-lg bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Resumo</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Total Economizado:</strong> {formatCurrency(kpis.condenacoes_evitadas + kpis.valores_recebidos)}
                  </p>
                  <p>
                    <strong>Período:</strong>{" "}
                    {period === "mes"
                      ? "Últimos 30 dias"
                      : period === "trimestre"
                        ? "Últimos 90 dias"
                        : "Últimos 12 meses"}
                  </p>
                </div>
              </div>
              <PdfDownloadButton
                clientId={selectedClientId}
                period={period}
                label="Baixar PDF"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
