import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import ErrorBoundary from '../components/ErrorBoundary'
// Avoid initializing browser-only services during SSR
// import { frontendErrorReporter } from '../services/errorReporter'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
      return pages[`../pages/${name}.tsx`]
    },
    setup: ({ App, props }) => {
      return (
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <App {...props} />
            </ErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      )
    },
  })
}