import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './store/AppStore'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { ToastProvider } from './components/shared/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Application Error" showResetButton={true}>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
