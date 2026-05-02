"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Símbolo da marca — Client Component para poder usar onError no Image.
 * Carrega logo-mark.svg quando disponível; caso contrário exibe monograma "FF".
 */
export function BrandMark() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <span
      aria-hidden
      className="relative grid h-10 w-10 shrink-0 place-items-center"
    >
      {!imgFailed && (
        <Image
          src="/brand/logo-mark.svg"
          alt="Fontes Figueiredo Advogados"
          width={40}
          height={40}
          className="h-10 w-10 object-contain brightness-0 invert"
          onError={() => setImgFailed(true)}
          priority
        />
      )}
      {/* Fallback — visível enquanto logo-mark.svg não existir */}
      {imgFailed && (
        <span className="grid h-10 w-10 place-items-center rounded bg-white/10 text-xs font-bold tracking-widest text-white select-none">
          FF
        </span>
      )}
    </span>
  );
}
