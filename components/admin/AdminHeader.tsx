import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

/**
 * Header para páginas admin com breadcrumb, título, subtítulo e ações
 */
export function AdminHeader({
  title,
  breadcrumbs,
  actions,
  subtitle,
  className,
}: AdminHeaderProps) {
  return (
    <div className={cn("border-b border-border bg-white px-6 py-4", className)}>
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link
            href={"/internal/admin" as any}
            className="hover:text-foreground"
          >
            Admin
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              {crumb.href ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link
                  href={crumb.href as any}
                  className="hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Título + Ações */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Ações (botão novo, filtros, etc) */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
