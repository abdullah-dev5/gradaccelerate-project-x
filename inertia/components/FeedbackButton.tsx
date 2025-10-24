import React, { useState, useEffect } from 'react'
import { frontendErrorReporter } from '../services/errorReporter'

interface FeedbackButtonProps {
  className?: string
  children?: React.ReactNode
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  className = '', 
  children 
}) => {
  const [feedback, setFeedback] = useState<any>(null)

  useEffect(() => {
    // Get feedback instance from Sentry
    const getFeedback = async () => {
      try {
        const sentry = await import('@sentry/react')
        setFeedback(sentry.getFeedback())
      } catch (error) {
        console.error('Failed to get Sentry feedback:', error)
      }
    }
    
    getFeedback()
  }, [])

  const handleFeedbackClick = async () => {
    if (!feedback) return

    try {
      const form = await feedback.createForm()
      form.appendToDom()
      form.open()
    } catch (error) {
      console.error('Failed to open feedback form:', error)
    }
  }

  return (
    <button
      onClick={handleFeedbackClick}
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      {children || 'Report a Bug'}
    </button>
  )
}

export default FeedbackButton
