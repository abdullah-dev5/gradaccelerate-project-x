/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css';
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { FeedbackButton } from '../components/FeedbackButton'
import { frontendErrorReporter } from '../services/errorReporter'
import { useReminderNotifications } from '../hooks/useReminderNotifications'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx'),
    )
  },

  setup({ el, App, props }) {
    // Initialize frontend error reporter (no-op when DSN missing)
    void frontendErrorReporter.init()
    
    const ReminderListener: React.FC = () => {
      const { user } = useAuth()
      useReminderNotifications(user?.id)
      return null
    }

    hydrateRoot(el, (
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <ReminderListener />
            <App {...props} />
          </ErrorBoundary>
          <FeedbackButton className="fixed bottom-4 right-4 z-50" />
        </AuthProvider>
      </ToastProvider>
    ))
    
  },
});