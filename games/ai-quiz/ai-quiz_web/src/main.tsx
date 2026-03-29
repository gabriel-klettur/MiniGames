import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { QuizProvider } from './contexts/QuizContext';
import AppShell from './components/AppShell';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <QuizProvider>
        <AppShell />
      </QuizProvider>
    </I18nProvider>
  </StrictMode>,
);
