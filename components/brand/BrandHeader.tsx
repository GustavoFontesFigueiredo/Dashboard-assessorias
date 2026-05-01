import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandHeaderProps {
  /** Navegação adicional renderizada à direita */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Header principal da marca Fontes Figueiredo Advogados.
 * Aplica --brand-gradient (charcoal escuro) com acento dourado no marcador.
 * Quando logo.svg estiver em public/brand/, Image passa a renderizar o SVG.
 */
export function BrandHeader({ actions, className }: BrandHeaderProps) {
  const hasLogo =
    typeof window === "undefined"
      ? false
      : document.querySelector('link[href="/brand/logo.svg"]') !== null;

  return (
    <header
      className={cn(
        "bg-brand-gradient text-white shadow-[0_1px_3px_rgba(0,0,0,.4)]",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logotipo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.12em] uppercase text-white">
              Fontes Figueiredo
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-gold-300/80">
              Advogados
            </span>
          </span>
        </Link>

        {/* Ações / nav injetadas pela rota */}
        {actions && (
          <nav className="flex items-center gap-2">{actions}</nav>
        )}
      </div>
    </header>
  );
}

/**
 * Símbolo da marca: usa logo.svg quando disponível; fallback é o
 * monograma FF no estilo do logotipo.
 */
function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative grid h-10 w-10 shrink-0 place-items-center"
    >
      {/* Tenta carregar o SVG oficial; se não existir, exibe o fallback */}
      <Image
        src="/brand/logo-mark.svg"
        alt="Fontes Figueiredo Advogados"
        width={40}
        height={40}
        className="h-10 w-10 object-contain brightness-0 invert"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        priority
      />
      {/* Fallback textual — visível enquanto logo-mark.svg não existir */}
      <span className="absolute inset-0 grid place-items-center rounded bg-white/10 text-xs font-bold tracking-widest text-white select-none">
        FF
      </span>
    </span>
  );
}
