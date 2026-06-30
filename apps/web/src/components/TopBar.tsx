import { Radar } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { ThemeToggle } from './ThemeToggle.js';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Radar size={20} strokeWidth={2.2} />
        </span>
        <span className="brand-name">{t('topbar.brand')}</span>
      </div>
      <div className="topbar-actions">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
