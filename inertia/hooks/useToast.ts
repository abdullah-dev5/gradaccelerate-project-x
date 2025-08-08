import { useState, useCallback } from 'react'
import { ToastType } from '../components/Toast'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }

        setToasts(prev => [...prev, newToast])

        return id
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const success = useCallback((title: string, message?: string) => {
        return addToast({ type: 'success', title, message })
    }, [addToast])

    const error = useCallback((title: string, message?: string) => {
        return addToast({ type: 'error', title, message })
    }, [addToast])

    const warning = useCallback((title: string, message?: string) => {
        return addToast({ type: 'warning', title, message })
    }, [addToast])

    const info = useCallback((title: string, message?: string) => {
        return addToast({ type: 'info', title, message })
    }, [addToast])

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info
    }
}
