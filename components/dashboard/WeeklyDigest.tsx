"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Scale, AlertTriangle, Activity, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getWeeklyDigest } from "@/lib/actions/lawyer-insights";

interface DigestData {
  totalClients: number;
  totalCases: number;
  activeCases: number;
  inactiveClients: number;
  weekUpdates: number;
}

export function WeeklyDigest() {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyDigest().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando digest...</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Clientes", value: data.totalClients, icon: Users, color: "text-brand-600" },
    { label: "Processos Ativos", value: data.activeCases, icon: Scale, color: "text-blue-600" },
    { label: "Atualizações (7 dias)", value: data.weekUpdates, icon: Activity, color: "text-green-600" },
    {
      label: "Clientes Inativos",
      value: data.inactiveClients,
      icon: AlertTriangle,
      color: data.inactiveClients > 0 ? "text-red-600" : "text-green-600",
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <BarChart3 className="h-5 w-5 text-brand-600" />
        Resumo Semanal
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className={`mx-auto mb-1 h-6 w-6 ${stat.color}`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
