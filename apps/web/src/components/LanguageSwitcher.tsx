import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider.js';
import { LANGUAGES, type Language } from '../i18n/types.js';
import { FLAGS, LANGUAGE_LABELS } from './icons/Flags.js';

export function LanguageSwitcher() {
  const { t, language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const ActiveFlag = FLAGS[language];

  function choose(next: Language): void {
    setLanguage(next);
    setOpen(false);
  }

  return (
    <div className="language-switcher" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('topbar.language')}
        className="icon-button language-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <ActiveFlag />
        <span className="language-trigger-label">
          {LANGUAGE_LABELS[language]}
        </span>
        <ChevronDown size={15} strokeWidth={2.2} />
      </button>

      {open ? (
        <ul className="language-menu" role="listbox">
          {LANGUAGES.map((code) => {
            const Flag = FLAGS[code];
            const selected = code === language;

            return (
              <li key={code}>
                <button
                  aria-selected={selected}
                  className={`language-option${selected ? ' is-selected' : ''}`}
                  onClick={() => choose(code)}
                  role="option"
                  type="button"
                >
                  <Flag />
                  <span>{LANGUAGE_LABELS[code]}</span>
                  {selected ? (
                    <Check
                      className="language-check"
                      size={15}
                      strokeWidth={2.6}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
