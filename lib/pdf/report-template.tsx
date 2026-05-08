import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

interface Case {
  numero_processo: string;
  fase: string;
  status: string;
  valor_pleiteado_contra: number;
  valor_condenado_contra: number;
  valor_condenacao_favoravel: number;
  valor_acordo_recebido: number;
}

interface ReportProps {
  clientName: string;
  period: string;
  kpis: KPIData;
  cases: Case[];
  logoUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1C2133",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C2133",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 5,
  },
  kpiSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1C2133",
    marginBottom: 10,
  },
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#C9963A",
  },
  kpiLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1C2133",
  },
  casesSection: {
    marginTop: 25,
  },
  casesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1C2133",
    marginBottom: 10,
  },
  caseRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
    marginBottom: 4,
    gap: 10,
  },
  caseNumber: {
    width: "20%",
    fontWeight: "bold",
    color: "#1C2133",
  },
  casePhase: {
    width: "15%",
    color: "#666666",
  },
  caseStatus: {
    width: "15%",
    color: "#666666",
  },
  caseValue: {
    width: "25%",
    textAlign: "right" as const,
    fontWeight: "bold",
    color: "#1C2133",
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    textAlign: "center" as const,
    fontSize: 9,
    color: "#999999",
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  summaryTitle: {
    fontWeight: "bold",
    color: "#1C2133",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 4,
  },
});

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

export function ReportPDF({
  clientName,
  period,
  kpis,
  cases,
  logoUrl,
}: ReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Relatório da Assessoria Jurídica</Text>
            <Text style={styles.subtitle}>Empresa: {clientName}</Text>
            <Text style={styles.subtitle}>Período: {period}</Text>
          </View>
          {logoUrl && (
            <Image
              src={logoUrl}
              style={styles.logo}
            />
          )}
        </View>

        {/* KPIs */}
        <View style={styles.kpiSection}>
          <Text style={styles.kpiTitle}>Indicadores-Chave de Desempenho (KPIs)</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Custos da Assessoria</Text>
              <Text style={styles.kpiValue}>{formatCurrency(kpis.custos)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Condenações Evitadas</Text>
              <Text style={styles.kpiValue}>
                {formatCurrency(kpis.condenacoes_evitadas)}
              </Text>
            </View>
          </View>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Valores Recebidos</Text>
              <Text style={styles.kpiValue}>
                {formatCurrency(kpis.valores_recebidos)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ROI (Retorno sobre Investimento)</Text>
              <Text style={styles.kpiValue}>{formatROI(kpis.roi)}</Text>
            </View>
          </View>
        </View>

        {/* Resumo */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumo Financeiro</Text>
          <Text style={styles.summaryText}>
            Total Economizado: {formatCurrency(kpis.condenacoes_evitadas + kpis.valores_recebidos)}
          </Text>
          <Text style={styles.summaryText}>
            Período Analisado: {period}
          </Text>
        </View>

        {/* Processos */}
        {cases.length > 0 && (
          <View style={styles.casesSection}>
            <Text style={styles.casesTitle}>Processos ({cases.length})</Text>

            {/* Cabeçalho da tabela */}
            <View
              style={{
                ...styles.caseRow,
                backgroundColor: "#f0f0f0",
                fontWeight: "bold",
                borderBottomWidth: 2,
              }}
            >
              <Text style={styles.caseNumber}>Processo</Text>
              <Text style={styles.casePhase}>Fase</Text>
              <Text style={styles.caseStatus}>Status</Text>
              <Text style={styles.caseValue}>Valor Pleiteado</Text>
            </View>

            {/* Linhas de processos */}
            {cases.map((caseItem, index) => (
              <View key={index} style={styles.caseRow}>
                <Text style={styles.caseNumber}>
                  {caseItem.numero_processo}
                </Text>
                <Text style={styles.casePhase}>{caseItem.fase}</Text>
                <Text style={styles.caseStatus}>{caseItem.status}</Text>
                <Text style={styles.caseValue}>
                  {formatCurrency(caseItem.valor_pleiteado_contra)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>Relatório gerado automaticamente pela plataforma FFADV Assessorias</Text>
          <Text>
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
