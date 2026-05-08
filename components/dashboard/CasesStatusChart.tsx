"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface CasesStatusChartProps {
  data: Array<{ status: string; count: number }>;
  title?: string;
}

const statusColors: Record<string, string> = {
  em_andamento: "#10B981",
  suspenso: "#F59E0B",
  resolvido: "#3B82F6",
  arquivado: "#9CA3AF",
};

const statusLabels: Record<string, string> = {
  em_andamento: "Em Andamento",
  suspenso: "Suspenso",
  resolvido: "Resolvido",
  arquivado: "Arquivado",
};

export function CasesStatusChart({
  data,
  title = "Status dos Processos",
}: CasesStatusChartProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ status, count }) =>
              `${statusLabels[status]}: ${count}`
            }
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.status}`}
                fill={statusColors[entry.status] || "#6B7280"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              value,
              statusLabels[name] || name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
