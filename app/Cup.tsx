// Petite tasse dessinée, avec trois volutes de vapeur qui montent doucement (CSS .steam).
export function Cup({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`cup ${className}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g className="steam" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 15c-2-2.5 2-4.5 0-7.5" />
        <path d="M23 14c-2-2.5 2-4.5 0-7.5" />
        <path d="M29 15c-2-2.5 2-4.5 0-7.5" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21h28v7a11 11 0 0 1-11 11h-6A11 11 0 0 1 9 28z" />
        <path d="M37 24h2.5a4 4 0 0 1 0 8H36" />
        <path d="M6 43h34" />
      </g>
    </svg>
  );
}

// Trace de tasse sur le papier : un détail de table de café derrière la note.
export function Ring({ className = "" }: { className?: string }) {
  return (
    <svg className={`ring ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="210 14 40 9 300" opacity=".55" />
      <circle cx="61" cy="59" r="41" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="90 30 160" opacity=".35" />
    </svg>
  );
}

// Petite étoile dessinée pour le coup de cœur (1er du classement).
export function Star({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.8l-5 2.8 1.2-5.5L4 9.3l5.6-.6z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  return "Bonsoir";
}
