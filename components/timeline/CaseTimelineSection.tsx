"use client";

import { useState } from "react";
import { CaseTimeline } from "./CaseTimeline";
import { AddUpdateForm } from "./AddUpdateForm";

/**
 * Wrapper client que conecta AddUpdateForm → CaseTimeline.
 * Quando uma atualização é criada, incrementa refreshKey para recarregar a timeline.
 */
export function CaseTimelineSection({ caseId }: { caseId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
        <AddUpdateForm
          caseId={caseId}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <CaseTimeline caseId={caseId} key={refreshKey} />
    </div>
  );
}
