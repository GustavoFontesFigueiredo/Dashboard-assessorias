import { renderToStream } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { createElement as h } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/getSession";
import { canAccessClient } from "@/lib/auth/rbac";
import { ReportPDF } from "@/lib/pdf/report-template";
import {
  calculateKPIs,
  getCasesStatusSummary,
} from "@/lib/db/queries/kpis";
import { listCases } from "@/lib/actions/cases";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.clientId;

    // Autenticação
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Autorização: cliente vê apenas seu próprio, outros verificam permissão
    if (user.role === "cliente") {
      if (user.client_id !== clientId) {
        return NextResponse.json(
          { error: "Sem permissão para acessar este cliente" },
          { status: 403 }
        );
      }
    } else if (user.role === "advogado") {
      if (!(await canAccessClient(user.id, clientId))) {
        return NextResponse.json(
          { error: "Sem permissão para acessar este cliente" },
          { status: 403 }
        );
      }
    } else if (!["admin", "controller"].includes(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    } else {
      // Admin e Controller podem acessar todos
      if (!(await canAccessClient(user.id, clientId))) {
        return NextResponse.json(
          { error: "Sem permissão para acessar este cliente" },
          { status: 403 }
        );
      }
    }

    // Buscar dados do cliente
    const { data: clientData } = await supabase
      .from("clients")
      .select("razao_social")
      .eq("id", clientId)
      .single();

    if (!clientData) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Obter período da query string (padrão: últimos 30 dias)
    const periodParam = request.nextUrl.searchParams.get("period") || "mes";
    const now = new Date();
    const { startDate, periodLabel } = (() => {
      switch (periodParam) {
        case "trimestre": {
          const date = new Date(now);
          date.setMonth(date.getMonth() - 3);
          return { startDate: date, periodLabel: "Últimos 90 dias" };
        }
        case "ano": {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - 1);
          return { startDate: date, periodLabel: "Últimos 12 meses" };
        }
        case "mes":
        default: {
          const date = new Date(now);
          date.setMonth(date.getMonth() - 1);
          return { startDate: date, periodLabel: "Últimos 30 dias" };
        }
      }
    })();

    // Calcular KPIs
    const kpis = await calculateKPIs(clientId, startDate, now);

    // Buscar processos
    const casesResult = await listCases(clientId, 1, 100);
    const cases = casesResult.success && casesResult.data ? casesResult.data : [];

    // Gerar PDF (type assertion needed for PDF renderer compatibility)
    const doc = h(ReportPDF, {
      clientName: clientData.razao_social,
      period: periodLabel,
      kpis,
      cases,
    }) as any;

    const stream = await renderToStream(doc);

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    return new Promise<NextResponse>((resolve) => {
      stream.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        const buffer = Buffer.concat(chunks);

        // Retornar como PDF download
        resolve(
          new NextResponse(buffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="relatorio-${clientData.razao_social}-${now.toISOString().split("T")[0]}.pdf"`,
            },
          })
        );
      });

      stream.on("error", (error: Error) => {
        resolve(
          NextResponse.json(
            { error: `Erro ao gerar PDF: ${error.message}` },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("Erro ao gerar relatório PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório PDF" },
      { status: 500 }
    );
  }
}
