"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getInactivityAlerts } from "@/lib/actions/lawyer-insights";

interface Alert {
  clientId: string;
  clientName: string;
  totalCases: number;
  activeCases: number;
  daysSinceLastUpdate: number;
  inactive: boolean;
  lastUpdateDate: string | null;
}

export function InactivityAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInactivityAlerts().then((res) => {
      if (res.success && res.data) {
        setAlerts(res.data as Alert[]);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verificando clientes...</span>
        </div>
      </Card>
    );
  }

  const inactiveAlerts = alerts.filter((a) => a.inactive);
  const activeAlerts = alerts.filter((a) => !a.inactive);

  if (alerts.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Clock className="h-5 w-5 text-brand-600" />
        Status dos Clientes
      </h3>

      {inactiveAlerts.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {inactiveAlerts.length} cliente(s) sem atualização há mais de 30 dias
          </p>
          <div className="space-y-2">
            {inactiveAlerts.map((alert) => (
              <div
                key={alert.clientId}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-red-900">{alert.clientName}</p>
                  <p className="text-xs text-red-600">
                    {alert.activeCases} processo(s) ativo(s) · Última atualização:{" "}
                    {alert.lastUpdateDate || "nunca"}
                  </p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                  {alert.daysSinceLastUpdate === 999
                    ? "Sem atualizações"
                    : `${alert.daysSinceLastUpdate} dias`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAlerts.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-green-700">
            <CheckCircle className="h-4 w-4" />
            {activeAlerts.length} cliente(s) em dia
          </p>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.clientId}
                className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{alert.clientName}</p>
                  <p className="text-xs text-gray-500">
                    {alert.activeCases} ativo(s) · Atualizado em {alert.lastUpdateDate}
                  </p>
                </div>
                <span className="text-xs text-green-600">
                  {alert.daysSinceLastUpdate} dia(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
