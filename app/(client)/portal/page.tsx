"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExecutiveSummaryPanel } from "@/components/client/ExecutiveSummaryPanel";
import { NextStepsPanel } from "@/components/client/NextStepsPanel";
import { NarratedUpdatesPanel } from "@/components/client/NarratedUpdatesPanel";
import { ValueEvidencePanel } from "@/components/client/ValueEvidencePanel";
import { ReportsPreviewPanel } from "@/components/client/ReportsPreviewPanel";
import {
  getClientClaritySnapshot,
  type ClientClaritySnapshot,
} from "@/lib/actions/client-clarity";

export default function ClientPortalPage() {
  const [snapshot, setSnapshot] = useState<ClientClaritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);

    const result = await getClientClaritySnapshot();
    if (result.success && result.data) {
      setSnapshot(result.data);
    } else {
      setError(result.error || "Não foi possível carregar o portal do cliente.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-brand-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Carregando sua central de clareza...</span>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h1 className="font-semibold text-gray-950">
                Não foi possível carregar o portal
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {error || "Tente novamente em alguns instantes."}
              </p>
              <Button className="mt-4" onClick={loadSnapshot}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <ExecutiveSummaryPanel
        clientName={snapshot.client.razao_social}
        responsibleName={snapshot.client.responsavel_nome}
        summary={snapshot.executiveSummary.text}
        source={snapshot.executiveSummary.source}
        generatedAt={snapshot.executiveSummary.generated_at}
      />

      <NextStepsPanel steps={snapshot.nextSteps} />

      <NarratedUpdatesPanel updates={snapshot.updates} />

      <ValueEvidencePanel
        kpis={snapshot.valueEvidence}
        visibility={snapshot.client.kpi_visibility}
      />

      <ReportsPreviewPanel reports={snapshot.reports} />
    </div>
  );
}
