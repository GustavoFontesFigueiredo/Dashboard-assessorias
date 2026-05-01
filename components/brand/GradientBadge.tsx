import { cn } from "@/lib/utils";

interface GradientBadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "gold" | "muted";
  className?: string;
}

export function GradientBadge({
  children,
  variant = "brand",
  className,
}: GradientBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variant === "brand" &&
          "bg-brand-gradient text-white",
        variant === "gold" &&
          "bg-accent-gradient text-brand-900",
        variant === "muted" &&
          "bg-brand-100 text-brand-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
