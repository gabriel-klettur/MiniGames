import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QuizProvider } from './contexts/QuizContext';
import AppShell from './components/AppShell';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuizProvider>
      <AppShell />
    </QuizProvider>
  </StrictMode>,
);
