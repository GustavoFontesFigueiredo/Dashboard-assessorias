"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ReceiptsChartProps {
  data: Array<{ mes: string; valor: number }>;
  title?: string;
}

export function ReceiptsChart({
  data,
  title = "Recebimentos ao Longo do Tempo",
}: ReceiptsChartProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis
            tickFormatter={(value) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(value))
            }
          />
          <Legend />
          <Bar
            dataKey="valor"
            fill="#1C9A7C"
            name="Recebimentos (BRL)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
