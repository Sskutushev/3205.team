import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { I18nProvider } from './i18n/I18nProvider.js';
import { ThemeProvider } from './theme/ThemeProvider.js';

const container = document.getElementById('root');

if (container === null) {
  throw new Error('Root container not found.');
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
