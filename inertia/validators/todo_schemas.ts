// Frontend validation schemas for todos
// These mirror the backend Vine.js validation patterns for consistency

export interface TodoValidationError {
  field: string
  message: string
}

export interface TodoFormData {
  title: string
  description?: string | null
  isCompleted: boolean
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  labels?: { id: number; name: string; color?: string }[]
}

// Validation rules that mirror backend Vine.js patterns
export const todoValidationRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: /^.+$/, // At least one character
  },
  description: {
    required: false,
    maxLength: 1000,
  },
  priority: {
    required: false,
    allowedValues: ['low', 'medium', 'high'] as const,
  },
  status: {
    required: false,
    allowedValues: ['pending', 'in_progress', 'completed'] as const,
  },
  labels: {
    maxCount: 5, // Limit number of labels for todos
  },
}

// Validation functions
export const validateTodoTitle = (title: string): TodoValidationError | null => {
  if (!title || title.trim().length === 0) {
    return {
      field: 'title',
      message: 'Title is required',
    }
  }

  if (title.trim().length < todoValidationRules.title.minLength) {
    return {
      field: 'title',
      message: `Title must be at least ${todoValidationRules.title.minLength} character long`,
    }
  }

  if (title.length > todoValidationRules.title.maxLength) {
    return {
      field: 'title',
      message: `Title cannot exceed ${todoValidationRules.title.maxLength} characters`,
    }
  }

  return null
}

export const validateTodoDescription = (description: string | null): TodoValidationError | null => {
  if (!description) return null // Description is optional

  if (description.length > todoValidationRules.description.maxLength!) {
    return {
      field: 'description',
      message: `Description cannot exceed ${todoValidationRules.description.maxLength} characters`,
    }
  }

  return null
}

export const validateTodoPriority = (priority: string): TodoValidationError | null => {
  if (!priority) return null // Priority is optional

  if (!todoValidationRules.priority.allowedValues.includes(priority as any)) {
    return {
      field: 'priority',
      message: `Priority must be one of: ${todoValidationRules.priority.allowedValues.join(', ')}`,
    }
  }

  return null
}

export const validateTodoStatus = (status: string): TodoValidationError | null => {
  if (!status) return null // Status is optional

  if (!todoValidationRules.status.allowedValues.includes(status as any)) {
    return {
      field: 'status',
      message: `Status must be one of: ${todoValidationRules.status.allowedValues.join(', ')}`,
    }
  }

  return null
}

export const validateTodoLabels = (
  labels: { id: number; name: string; color?: string }[]
): TodoValidationError | null => {
  if (!labels || labels.length === 0) return null // Labels are optional

  if (labels.length > todoValidationRules.labels.maxCount!) {
    return {
      field: 'labels',
      message: `Cannot select more than ${todoValidationRules.labels.maxCount} labels`,
    }
  }

  // Validate individual label structure
  for (const label of labels) {
    if (!label.id || !label.name) {
      return {
        field: 'labels',
        message: 'Invalid label data',
      }
    }

    if (label.color && !/^#[0-9A-F]{6}$/i.test(label.color)) {
      return {
        field: 'labels',
        message: 'Invalid label color format',
      }
    }
  }

  return null
}

// Main validation function
export const validateTodoForm = (data: TodoFormData): TodoValidationError[] => {
  const errors: TodoValidationError[] = []

  // Validate title
  const titleError = validateTodoTitle(data.title)
  if (titleError) errors.push(titleError)

  // Validate description
  const descriptionError = validateTodoDescription(data.description)
  if (descriptionError) errors.push(descriptionError)

  // Validate priority
  const priorityError = validateTodoPriority(data.priority)
  if (priorityError) errors.push(priorityError)

  // Validate status
  const statusError = validateTodoStatus(data.status)
  if (statusError) errors.push(statusError)

  // Validate labels
  const labelsError = validateTodoLabels(data.labels || [])
  if (labelsError) errors.push(labelsError)

  return errors
}

// Real-time validation helpers
export const validateField = (
  field: keyof TodoFormData,
  value: any
): TodoValidationError | null => {
  switch (field) {
    case 'title':
      return validateTodoTitle(value)
    case 'description':
      return validateTodoDescription(value)
    case 'priority':
      return validateTodoPriority(value)
    case 'status':
      return validateTodoStatus(value)
    case 'labels':
      return validateTodoLabels(value)
    default:
      return null
  }
}

// Check if form is valid
export const isTodoFormValid = (data: TodoFormData): boolean => {
  return validateTodoForm(data).length === 0
}

// Get field-specific error
export const getFieldError = (errors: TodoValidationError[], field: string): string | null => {
  const error = errors.find((err) => err.field === field)
  return error ? error.message : null
}

// Priority and status validation helpers
export const isValidPriority = (priority: string): priority is 'low' | 'medium' | 'high' => {
  return todoValidationRules.priority.allowedValues.includes(priority as any)
}

export const isValidStatus = (
  status: string
): status is 'pending' | 'in_progress' | 'completed' => {
  return todoValidationRules.status.allowedValues.includes(status as any)
}
