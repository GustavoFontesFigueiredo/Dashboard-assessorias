"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Shield, Target, FileText } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CostsChart } from "@/components/dashboard/CostsChart";
import { ReceiptsChart } from "@/components/dashboard/ReceiptsChart";
import { CasesStatusChart } from "@/components/dashboard/CasesStatusChart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  calculateKPIs,
  getCostosTimeSeries,
  getRecebimentosTimeSeries,
  getCasesStatusSummary,
} from "@/lib/db/queries/kpis";
import { getCurrentUser } from "@/lib/actions/auth";
import { listClients } from "@/lib/actions/clients";
import { PdfDownloadButton } from "@/components/pdf/PdfDownloadButton";

interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

interface Client {
  id: string;
  razao_social: string;
  kpi_visibility?: {
    custos: boolean;
    evitadas: boolean;
    recebidos: boolean;
    roi: boolean;
  };
}

type PeriodType = "mes" | "trimestre" | "ano";

export default function ClientPortalPage() {
  const [_user, setUser] = useState<import("@/lib/auth/getSession").SessionUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
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

  // Carregar usuário e cliente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);

          // Carregar dados do próprio cliente
          if (currentUser.client_id) {
            const clientResult = await listClients(1, 100);
            if (clientResult.success && clientResult.data) {
              const foundClient = clientResult.data.find(
                (c: Client) => c.id === currentUser.client_id
              );
              setClient(foundClient || null);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    loadInitialData();
  }, []);

  // Carregar KPIs quando período muda
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!client?.id) return;

      setLoading(true);
      try {
        const now = new Date();
        const startDate = getStartDate(now, period);

        // Carregar KPIs
        const kpiData = await calculateKPIs(client.id, startDate, now);
        setKpis(kpiData);

        // Carregar séries temporais
        const costosTimeSeries = await getCostosTimeSeries(
          client.id,
          startDate,
          now
        );
        setCostosData(costosTimeSeries);

        const recebimentosTimeSeries = await getRecebimentosTimeSeries(
          client.id,
          startDate,
          now
        );
        setRecebimentosData(recebimentosTimeSeries);

        // Carregar status dos casos
        const casesStatusSummary = await getCasesStatusSummary(client.id);
        setCasesStatus(casesStatusSummary);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

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

  const isKPIVisible = (key: "custos" | "evitadas" | "recebidos" | "roi") => {
    if (!client?.kpi_visibility) return true;
    return client.kpi_visibility[key] !== false;
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Relatório da Assessoria Jurídica
        </h1>
        {client && (
          <p className="mt-2 text-lg text-gray-600">
            Empresa: <strong>{client.razao_social}</strong>
          </p>
        )}
      </div>

      {/* Período e Ações */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Período</label>
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
            <SelectTrigger className="mt-2 w-48">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Últimos 30 dias</SelectItem>
              <SelectItem value="trimestre">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/portal/cases">
          <Button className="gap-2 bg-brand-gradient text-white hover:opacity-90">
            <FileText className="h-4 w-4" />
            Ver Processos
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* KPIs visíveis */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isKPIVisible("custos") && (
              <KpiCard
                title="Custos da Assessoria"
                value={formatCurrency(kpis.custos)}
                icon={<DollarSign className="h-6 w-6 text-white" />}
                variant="primary"
              />
            )}
            {isKPIVisible("evitadas") && (
              <KpiCard
                title="Condenações Evitadas"
                value={formatCurrency(kpis.condenacoes_evitadas)}
                icon={<Shield className="h-6 w-6 text-white" />}
                variant="primary"
              />
            )}
            {isKPIVisible("recebidos") && (
              <KpiCard
                title="Valores Recebidos"
                value={formatCurrency(kpis.valores_recebidos)}
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                variant="success"
              />
            )}
            {isKPIVisible("roi") && (
              <KpiCard
                title="ROI"
                value={formatROI(kpis.roi)}
                subtitle="Retorno sobre investimento"
                icon={<Target className="h-6 w-6 text-white" />}
                variant="primary"
              />
            )}
          </div>

          {/* Gráficos */}
          {(isKPIVisible("custos") || isKPIVisible("recebidos")) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {isKPIVisible("custos") && <CostsChart data={costosData} />}
              {isKPIVisible("recebidos") && <ReceiptsChart data={recebimentosData} />}
            </div>
          )}

          {/* Status dos Casos */}
          {casesStatus.length > 0 ? (
            <CasesStatusChart data={casesStatus} />
          ) : (
            <Card className="p-6 text-center text-gray-500">
              Nenhum processo registrado
            </Card>
          )}

          {/* Resumo */}
          <Card className="space-y-4 bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white">
            <h3 className="text-lg font-semibold">Resumo do Período</h3>
            <p className="text-sm">
              <strong>Total Economizado:</strong>{" "}
              {formatCurrency(kpis.condenacoes_evitadas + kpis.valores_recebidos)}
            </p>
            <p className="text-sm">
              <strong>Período:</strong>{" "}
              {period === "mes"
                ? "Últimos 30 dias"
                : period === "trimestre"
                  ? "Últimos 90 dias"
                  : "Últimos 12 meses"}
            </p>
            <div className="mt-4 flex gap-2">
              <PdfDownloadButton
                clientId={client?.id ?? ""}
                period={period}
                className="bg-white text-brand-700 hover:bg-gray-100"
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
