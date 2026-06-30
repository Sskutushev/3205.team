import type { ComponentType, SVGProps } from 'react';
import type { Language } from '../../i18n/types.js';

// Inline SVG flags rather than emoji: regional-indicator flag emoji do not
// render on Windows, so emoji would show as bare letters (US, ES, …).

type FlagProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: '0 0 20 14',
  width: 20,
  height: 14,
  role: 'img',
  'aria-hidden': true,
} as const;

function FlagUS(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="20" height="14" fill="#fff" rx="2" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#b22234" />
      ))}
      <rect width="9" height="7" fill="#3c3b6e" rx="1" />
    </svg>
  );
}

function FlagES(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="20" height="14" fill="#c60b1e" rx="2" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  );
}

function FlagRU(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="20" height="14" fill="#fff" rx="2" />
      <rect y="4.67" width="20" height="4.66" fill="#0039a6" />
      <rect y="9.33" width="20" height="4.67" fill="#d52b1e" />
    </svg>
  );
}

function FlagDE(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="20" height="14" fill="#000" rx="2" />
      <rect y="4.67" width="20" height="4.66" fill="#dd0000" />
      <rect y="9.33" width="20" height="4.67" fill="#ffce00" />
    </svg>
  );
}

function FlagCN(props: FlagProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect width="20" height="14" fill="#de2910" rx="2" />
      <path
        d="M4 2.2l.7 2.1H7l-1.8 1.3.7 2.1L4 6.4 2.1 7.7l.7-2.1L1 4.3h2.3z"
        fill="#ffde00"
      />
      <circle cx="8.5" cy="2" r="0.7" fill="#ffde00" />
      <circle cx="9.8" cy="3.4" r="0.7" fill="#ffde00" />
      <circle cx="9.8" cy="5.2" r="0.7" fill="#ffde00" />
      <circle cx="8.5" cy="6.4" r="0.7" fill="#ffde00" />
    </svg>
  );
}

export const FLAGS: Record<Language, ComponentType<FlagProps>> = {
  en: FlagUS,
  es: FlagES,
  ru: FlagRU,
  de: FlagDE,
  zh: FlagCN,
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  ru: 'Русский',
  de: 'Deutsch',
  zh: '中文',
};
