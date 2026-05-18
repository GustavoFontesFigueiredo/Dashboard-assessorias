"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAiDashboardSummary } from "@/lib/actions/ai-summary";

interface Props {
  clientId: string;
}

export function AiSummaryCard({ clientId }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    getAiDashboardSummary(clientId).then((res) => {
      if (res.success && res.summary) {
        setSummary(res.summary);
      }
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-amber-500 bg-amber-50 p-6">
        <div className="flex items-center gap-2 text-amber-800">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Gerando análise com IA...</span>
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">
          Análise do Assistente Jurídico
        </h3>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
        {summary}
      </p>
    </Card>
  );
}
