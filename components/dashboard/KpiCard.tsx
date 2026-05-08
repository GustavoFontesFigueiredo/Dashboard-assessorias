import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning";
}

const variantStyles = {
  primary: "bg-brand-gradient text-white",
  secondary: "bg-gray-50 border border-gray-200",
  success: "bg-green-50 border border-green-200",
  warning: "bg-orange-50 border border-orange-200",
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
}: KpiCardProps) {
  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              variant === "primary" ? "text-white/80" : "text-gray-600"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              variant === "primary" ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`mt-1 text-xs ${
                variant === "primary" ? "text-white/70" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              variant === "primary"
                ? "bg-white/20"
                : "bg-gray-200"
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
