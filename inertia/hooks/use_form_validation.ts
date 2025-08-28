import { useState, useCallback, useEffect } from 'react'
import { NoteValidationError, validateField as validateNoteField } from '../validators/note_schemas'
import { TodoValidationError, validateField as validateTodoField } from '../validators/todo_schemas'

export type ValidationError = NoteValidationError | TodoValidationError

export interface UseFormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
}

export interface UseFormValidationReturn<T> {
  errors: ValidationError[]
  validateField: (field: keyof T, value: any) => ValidationError | null
  validateForm: (data: T) => ValidationError[]
  clearErrors: () => void
  clearFieldError: (field: string) => void
  hasErrors: boolean
  getFieldError: (field: string) => string | null
}

export function useFormValidation<T extends Record<string, any>>(
  validationType: 'note' | 'todo',
  options: UseFormValidationOptions = {}
): UseFormValidationReturn<T> {
  const { validateOnChange = true, validateOnBlur = true, debounceMs = 300 } = options

  const [errors, setErrors] = useState<ValidationError[]>([])
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({})

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => prev.filter((error) => error.field !== field))
  }, [])

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: any): ValidationError | null => {
      let error: ValidationError | null = null

      if (validationType === 'note') {
        error = validateNoteField(field as any, value)
      } else if (validationType === 'todo') {
        error = validateTodoField(field as any, value)
      }

      if (error) {
        setErrors((prev) => {
          const existingErrorIndex = prev.findIndex((e) => e.field === field)
          if (existingErrorIndex >= 0) {
            const newErrors = [...prev]
            newErrors[existingErrorIndex] = error!
            return newErrors
          } else {
            return [...prev, error!]
          }
        })
      } else {
        clearFieldError(field as string)
      }

      return error
    },
    [validationType, clearFieldError]
  )

  // Validate entire form
  const validateForm = useCallback(
    (data: T): ValidationError[] => {
      const newErrors: ValidationError[] = []

      Object.entries(data).forEach(([field, value]) => {
        const error = validateField(field as keyof T, value)
        if (error) {
          newErrors.push(error)
        }
      })

      setErrors(newErrors)
      return newErrors
    },
    [validateField]
  )

  // Debounced validation for real-time feedback
  const debouncedValidateField = useCallback(
    (field: keyof T, value: any) => {
      // Clear existing timer for this field
      if (debounceTimers[field as string]) {
        clearTimeout(debounceTimers[field as string])
      }

      // Set new timer
      const timer = setTimeout(() => {
        validateField(field, value)
        setDebounceTimers((prev) => {
          const { [field as string]: unused, ...rest } = prev
          return rest
        })
      }, debounceMs)

      setDebounceTimers((prev) => ({
        ...prev,
        [field as string]: timer,
      }))
    },
    [validateField, debounceMs, debounceTimers]
  )

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => {
        clearTimeout(timer)
      })
    }
  }, [debounceTimers])

  // Helper functions
  const hasErrors = errors.length > 0

  const getFieldError = useCallback(
    (field: string): string | null => {
      const error = errors.find((err) => err.field === field)
      return error ? error.message : null
    },
    [errors]
  )

  return {
    errors,
    validateField: validateOnChange ? debouncedValidateField : validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors,
    getFieldError,
  }
}

// Specialized hooks for specific form types
export function useNoteFormValidation(options?: UseFormValidationOptions) {
  return useFormValidation<any>('note', options)
}

export function useTodoFormValidation(options?: UseFormValidationOptions) {
  return useFormValidation<any>('todo', options)
}
