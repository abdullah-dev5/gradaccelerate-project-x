// Frontend validation schemas for notes
// These mirror the backend Vine.js validation patterns for consistency

export interface NoteValidationError {
  field: string
  message: string
}

export interface NoteFormData {
  title: string
  content: string
  pinned: boolean
  imageUrl?: string | null
  gif_url?: string | null
  gif_slug?: string | null
  labels?: { id: number; name: string; color?: string }[]
}

// Validation rules that mirror backend Vine.js patterns
export const noteValidationRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: /^.+$/, // At least one character
  },
  content: {
    required: false,
    maxLength: 10000,
  },
  gif_url: {
    required: false,
    pattern: /^https?:\/\/.+/, // Basic URL validation
  },
  gif_slug: {
    required: false,
    pattern: /^[a-zA-Z0-9-_]+$/, // Alphanumeric, hyphens, underscores
  },
  labels: {
    maxCount: 10, // Limit number of labels
  },
}

// Validation functions
export const validateNoteTitle = (title: string): NoteValidationError | null => {
  if (!title || title.trim().length === 0) {
    return {
      field: 'title',
      message: 'Title is required',
    }
  }

  if (title.trim().length < noteValidationRules.title.minLength) {
    return {
      field: 'title',
      message: `Title must be at least ${noteValidationRules.title.minLength} character long`,
    }
  }

  if (title.length > noteValidationRules.title.maxLength) {
    return {
      field: 'title',
      message: `Title cannot exceed ${noteValidationRules.title.maxLength} characters`,
    }
  }

  return null
}

export const validateNoteContent = (content: string): NoteValidationError | null => {
  if (!content) return null // Content is optional

  if (content.length > noteValidationRules.content.maxLength!) {
    return {
      field: 'content',
      message: `Content cannot exceed ${noteValidationRules.content.maxLength} characters`,
    }
  }

  return null
}

export const validateGifUrl = (url: string): NoteValidationError | null => {
  if (!url) return null // GIF URL is optional

  if (!noteValidationRules.gif_url.pattern!.test(url)) {
    return {
      field: 'gif_url',
      message: 'Please enter a valid URL',
    }
  }

  return null
}

export const validateGifSlug = (slug: string): NoteValidationError | null => {
  if (!slug) return null // GIF slug is optional

  if (!noteValidationRules.gif_slug.pattern!.test(slug)) {
    return {
      field: 'gif_slug',
      message: 'Slug can only contain letters, numbers, hyphens, and underscores',
    }
  }

  return null
}

export const validateLabels = (
  labels: { id: number; name: string; color?: string }[]
): NoteValidationError | null => {
  if (!labels || labels.length === 0) return null // Labels are optional

  if (labels.length > noteValidationRules.labels.maxCount!) {
    return {
      field: 'labels',
      message: `Cannot select more than ${noteValidationRules.labels.maxCount} labels`,
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
export const validateNoteForm = (data: NoteFormData): NoteValidationError[] => {
  const errors: NoteValidationError[] = []

  // Validate title
  const titleError = validateNoteTitle(data.title)
  if (titleError) errors.push(titleError)

  // Validate content
  const contentError = validateNoteContent(data.content)
  if (contentError) errors.push(contentError)

  // Validate GIF URL
  const gifUrlError = validateGifUrl(data.gif_url || '')
  if (gifUrlError) errors.push(gifUrlError)

  // Validate GIF slug
  const gifSlugError = validateGifSlug(data.gif_slug || '')
  if (gifSlugError) errors.push(gifSlugError)

  // Validate labels
  const labelsError = validateLabels(data.labels || [])
  if (labelsError) errors.push(labelsError)

  return errors
}

// Real-time validation helpers
export const validateField = (
  field: keyof NoteFormData,
  value: any
): NoteValidationError | null => {
  switch (field) {
    case 'title':
      return validateNoteTitle(value)
    case 'content':
      return validateNoteContent(value)
    case 'gif_url':
      return validateGifUrl(value)
    case 'gif_slug':
      return validateGifSlug(value)
    case 'labels':
      return validateLabels(value)
    default:
      return null
  }
}

// Check if form is valid
export const isNoteFormValid = (data: NoteFormData): boolean => {
  return validateNoteForm(data).length === 0
}

// Get field-specific error
export const getFieldError = (errors: NoteValidationError[], field: string): string | null => {
  const error = errors.find((err) => err.field === field)
  return error ? error.message : null
}
