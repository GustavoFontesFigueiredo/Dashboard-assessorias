"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface CostsChartProps {
  data: Array<{ mes: string; valor: number }>;
  title?: string;
}

export function CostsChart({
  data,
  title = "Custos ao Longo do Tempo",
}: CostsChartProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#C9963A"
            dot={{ fill: "#C9963A", r: 4 }}
            activeDot={{ r: 6 }}
            name="Custos (BRL)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
