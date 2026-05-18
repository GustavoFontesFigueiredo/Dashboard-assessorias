import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface KPIData {
  custos: number;
  condenacoes_evitadas: number;
  valores_recebidos: number;
  roi: number;
}

interface Case {
  numero_processo: string;
  descricao?: string;
  fase: string;
  status: string;
  valor_pleiteado_contra: number;
  valor_condenado_contra: number;
  valor_condenacao_favoravel: number;
  valor_acordo_recebido: number;
}

interface UpdateItem {
  data: string;
  tipo: string;
  descricao: string;
}

interface Props {
  clientName: string;
  cnpj: string;
  referencia: string; // "maio de 2026"
  narrativa: string;
  kpis: KPIData;
  cases: Case[];
  updates: UpdateItem[];
}

const gold = "#C9963A";
const dark = "#1C2133";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  // Header
  headerBar: {
    backgroundColor: dark,
    padding: 20,
    marginHorizontal: -40,
    marginTop: -40,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: 11,
    color: gold,
    marginTop: 4,
  },
  headerInfo: {
    fontSize: 9,
    color: "#cccccc",
    marginTop: 2,
  },
  // Narrativa
  narrativaBox: {
    backgroundColor: "#FFF8E7",
    borderLeftWidth: 4,
    borderLeftColor: gold,
    padding: 15,
    marginBottom: 20,
    borderRadius: 2,
  },
  narrativaTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: dark,
    marginBottom: 8,
  },
  narrativaText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  // KPIs
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: dark,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: gold,
    paddingBottom: 4,
  },
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 3,
    borderTopWidth: 3,
    borderTopColor: gold,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 3,
    textTransform: "uppercase" as const,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: dark,
  },
  // Movimentações
  updateRow: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  updateDate: {
    width: 60,
    fontSize: 9,
    color: "#666666",
  },
  updateTipo: {
    width: 80,
    fontSize: 9,
    fontWeight: "bold",
    color: dark,
  },
  updateDesc: {
    flex: 1,
    fontSize: 9,
    color: "#444444",
  },
  // Processos
  caseRow: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    gap: 6,
  },
  caseNum: { width: "22%", fontSize: 9, fontWeight: "bold", color: dark },
  caseFase: { width: "13%", fontSize: 9, color: "#666666" },
  caseStatus: { width: "13%", fontSize: 9, color: "#666666" },
  caseVal: { width: "26%", fontSize: 9, textAlign: "right" as const, color: dark },
  caseValFav: { width: "26%", fontSize: 9, textAlign: "right" as const, color: "#2e7d32" },
  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 8,
    color: "#999999",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 8,
  },
});

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const fmtROI = (v: number) => {
  if (!isFinite(v) || v === 0) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
};

const tipoLabels: Record<string, string> = {
  status_change: "Status",
  fase_change: "Fase",
  valor_change: "Valor",
  observacao: "Obs.",
  documento: "Doc.",
  audiencia: "Audiência",
};

export function MonthlyReportPDF({
  clientName,
  cnpj,
  referencia,
  narrativa,
  kpis,
  cases,
  updates,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Relatório Mensal</Text>
          <Text style={styles.headerSub}>Fontes Figueiredo Advogados</Text>
          <Text style={styles.headerInfo}>
            {clientName} | CNPJ: {cnpj} | Referência: {referencia}
          </Text>
        </View>

        {/* Narrativa IA */}
        <View style={styles.narrativaBox}>
          <Text style={styles.narrativaTitle}>Resumo do Período</Text>
          <Text style={styles.narrativaText}>{narrativa}</Text>
        </View>

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Indicadores do Período</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Custos da Assessoria</Text>
            <Text style={styles.kpiValue}>{fmt(kpis.custos)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Condenações Evitadas</Text>
            <Text style={styles.kpiValue}>{fmt(kpis.condenacoes_evitadas)}</Text>
          </View>
        </View>
        <View style={{ ...styles.kpiGrid, marginBottom: 20 }}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Valores Recebidos</Text>
            <Text style={styles.kpiValue}>{fmt(kpis.valores_recebidos)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ROI</Text>
            <Text style={styles.kpiValue}>{fmtROI(kpis.roi)}</Text>
          </View>
        </View>

        {/* Movimentações do Mês */}
        {updates.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>
              Movimentações do Mês ({updates.length})
            </Text>
            {updates.map((u, i) => (
              <View key={i} style={styles.updateRow}>
                <Text style={styles.updateDate}>{u.data}</Text>
                <Text style={styles.updateTipo}>
                  {tipoLabels[u.tipo] || u.tipo}
                </Text>
                <Text style={styles.updateDesc}>{u.descricao}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Processos */}
        {cases.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>
              Processos ({cases.length})
            </Text>
            {/* Header */}
            <View
              style={{
                ...styles.caseRow,
                backgroundColor: "#f0f0f0",
                borderBottomWidth: 2,
                borderBottomColor: gold,
              }}
            >
              <Text style={{ ...styles.caseNum, fontWeight: "bold" }}>Processo</Text>
              <Text style={styles.caseFase}>Fase</Text>
              <Text style={styles.caseStatus}>Status</Text>
              <Text style={styles.caseVal}>Pleiteado</Text>
              <Text style={styles.caseValFav}>Favorável</Text>
            </View>
            {cases.map((c, i) => (
              <View key={i} style={styles.caseRow}>
                <Text style={styles.caseNum}>{c.numero_processo}</Text>
                <Text style={styles.caseFase}>{c.fase}</Text>
                <Text style={styles.caseStatus}>{c.status}</Text>
                <Text style={styles.caseVal}>
                  {fmt(c.valor_pleiteado_contra)}
                </Text>
                <Text style={styles.caseValFav}>
                  {fmt(c.valor_condenacao_favoravel)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Relatório gerado automaticamente por FFADV Assessorias |{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
