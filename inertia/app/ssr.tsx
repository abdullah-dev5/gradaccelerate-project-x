import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { FeedbackButton } from '../components/FeedbackButton'
import { useReminderNotifications } from '../hooks/useReminderNotifications'
// Avoid initializing browser-only services during SSR
// import { frontendErrorReporter } from '../services/errorReporter'

// ReminderListener component (same as client-side for consistency)
const ReminderListener: React.FC = () => {
  const { user } = useAuth()
  useReminderNotifications(user?.id)
  return null
}

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
              <ReminderListener />
              <App {...props} />
            </ErrorBoundary>
            <FeedbackButton className="fixed bottom-4 right-4 z-50" />
          </AuthProvider>
        </ToastProvider>
      )
    },
  })
}