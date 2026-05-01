import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  /** Subtítulo opcional (ex: período ou variação) */
  sub?: string;
  /**
   * "primary"  → fundo charcoal (--brand-gradient) + texto branco
   * "accent"   → fundo dourado (--accent-gradient) + texto escuro
   * "default"  → fundo branco/muted com borda
   */
  variant?: "primary" | "accent" | "default";
  /** Ícone React (ex: Lucide) */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Card de KPI reutilizável.
 * variant="accent" usa o gradiente dourado para destacar ROI ou Condenações Evitadas.
 */
export function KpiCard({
  label,
  value,
  sub,
  variant = "default",
  icon,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-lg p-5 shadow-sm",
        variant === "primary" && "bg-brand-gradient text-white",
        variant === "accent" &&
          "bg-accent-gradient text-brand-900",
        variant === "default" &&
          "border border-border bg-white text-foreground",
        className,
      )}
    >
      {/* Linha superior: label + ícone */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            variant === "primary" && "text-white/70",
            variant === "accent" && "text-brand-700/80",
            variant === "default" && "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "opacity-60",
              variant === "primary" && "text-white",
              variant === "accent" && "text-brand-800",
              variant === "default" && "text-muted-foreground",
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p
        className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          variant === "primary" && "text-white",
          variant === "accent" && "text-brand-900",
        )}
      >
        {value}
      </p>

      {/* Sub-linha */}
      {sub && (
        <p
          className={cn(
            "text-xs",
            variant === "primary" && "text-white/60",
            variant === "accent" && "text-brand-700/70",
            variant === "default" && "text-muted-foreground",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
