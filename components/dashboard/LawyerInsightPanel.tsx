"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClientInsight } from "@/lib/actions/lawyer-insights";

interface Props {
  clientId: string;
  clientName: string;
}

export function LawyerInsightPanel({ clientId, clientName }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    if (insight) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    setExpanded(true);
    const res = await getClientInsight(clientId);
    if (res.success && res.data) {
      setInsight(res.data.insight);
    } else {
      setInsight("Não foi possível gerar o insight no momento. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <Card className="border-l-4 border-l-brand-500 p-4">
      <button
        onClick={handleGenerate}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Insight IA — {clientName}
            </p>
            <p className="text-xs text-gray-500">
              {insight ? "Clique para expandir/recolher" : "Clique para gerar análise"}
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        ) : expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && insight && (
        <div className="mt-3 rounded-md bg-brand-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {insight}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation();
              setLoading(true);
              const res = await getClientInsight(clientId);
              if (res.success && res.data) setInsight(res.data.insight);
              setLoading(false);
            }}
            className="mt-2 text-xs text-brand-600"
            disabled={loading}
          >
            {loading ? "Regenerando..." : "Regenerar insight"}
          </Button>
        </div>
      )}
    </Card>
  );
}
