/**
 * Símbolo da marca — renderizado como SVG inline para que currentColor
 * herde corretamente a cor do elemento pai (text-white no header escuro).
 */
export function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative grid h-10 w-10 shrink-0 place-items-center"
    >
      <svg
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
        fill="currentColor"
        aria-hidden="true"
      >
        {/* Coluna / pilar central — representa solidez e justiça */}
        <rect x="112" y="30" width="32" height="130" rx="4" />
        {/* Capitel superior */}
        <rect x="80" y="24" width="96" height="18" rx="4" />
        {/* Base */}
        <rect x="72" y="160" width="112" height="16" rx="4" />
        {/* Pedestal */}
        <rect x="56" y="176" width="144" height="14" rx="4" />
        {/* Balança — braço horizontal */}
        <rect x="68" y="90" width="120" height="10" rx="5" />
        {/* Prato esquerdo */}
        <ellipse cx="90" cy="120" rx="26" ry="8" />
        <rect x="86" y="98" width="8" height="24" rx="3" />
        {/* Prato direito */}
        <ellipse cx="166" cy="120" rx="26" ry="8" />
        <rect x="162" y="98" width="8" height="24" rx="3" />
      </svg>
    </span>
  );
}
