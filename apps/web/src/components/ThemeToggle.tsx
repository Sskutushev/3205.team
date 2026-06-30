import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label =
    theme === 'dark' ? t('topbar.theme.toLight') : t('topbar.theme.toDark');

  return (
    <button
      aria-label={label}
      className="icon-button"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={2.2} />
      ) : (
        <Moon size={18} strokeWidth={2.2} />
      )}
    </button>
  );
}
