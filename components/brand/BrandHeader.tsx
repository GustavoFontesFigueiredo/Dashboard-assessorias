import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { InternalNav } from "./InternalNav";

interface BrandHeaderProps {
  /** Navegação adicional renderizada à direita */
  actions?: React.ReactNode;
  className?: string;
  /** Se true, exibe o menu de navegação interno (dashboard, admin, etc.) */
  showNav?: boolean;
}

/**
 * Header principal da marca Fontes Figueiredo Advogados.
 * Aplica --brand-gradient (charcoal escuro) com acento dourado no subtítulo.
 */
export function BrandHeader({ actions, className, showNav = false }: BrandHeaderProps) {
  return (
    <header
      className={cn(
        "bg-brand-gradient text-white shadow-[0_1px_3px_rgba(0,0,0,.4)]",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
              Fontes Figueiredo
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300/80">
              Advogados
            </span>
          </span>
        </Link>

        {showNav && <InternalNav />}

        {actions && (
          <nav className="flex items-center gap-2">{actions}</nav>
        )}
      </div>
    </header>
  );
}
