import { useState, useRef, useEffect } from 'react'
import { allLabels } from '../../components/Label';
import KlipyGifPicker from './KlipyGifPicker'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { FileText, Eye, Image as ImageIcon, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import { usePage } from '@inertiajs/react'

import { useNoteFormValidation } from '../../hooks/use_form_validation'
import { NoteFormData } from '../../validators/note_schemas'
import { useToast } from '../../hooks/useToast'

interface NoteLabelType {
  id: number;
  name: string;
  color?: string;
}

interface NoteFormInitialData {
  id?: number;
  title: string;
  content: string;
  pinned: boolean;
  imageUrl?: string | null;
  gif_url?: string | null;
  gif_slug?: string | null;
  labels?: NoteLabelType[];
}

interface NoteFormProps {
  initialData?: NoteFormInitialData;
  onSuccess: (note: any) => void;
  onCancel?: () => void;
}

export default function NoteForm({ 
  initialData = { title: '', content: '', pinned: false },
  onSuccess,
  onCancel
}: NoteFormProps) {
  const { showToast } = useToast()
  
  // Form validation hook
  const {
    validateField,
    validateForm,
    clearErrors,
    hasErrors,
    getFieldError
  } = useNoteFormValidation({
    validateOnChange: true,
    debounceMs: 500
  })

  const [isPreview, setIsPreview] = useState(false)
  const [data, setData] = useState<NoteFormData>({
    title: initialData.title,
    content: initialData.content,
    pinned: initialData.pinned,
    imageUrl: initialData.imageUrl || null,
    gif_url: initialData.gif_url || null,
    gif_slug: initialData.gif_slug || null,
    labels: initialData.labels || [],
  })

  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removeImageFlag, setRemoveImageFlag] = useState(false)

  // Klipy GIF picker state
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [klipyQuery, setKlipyQuery] = useState('')
  const [klipyPage, setKlipyPage] = useState(1)

  // ✅ FIXED: Get CSRF token from page props
  const { csrf } = usePage().props as any

  // Clear validation errors when form data changes
  useEffect(() => {
    if (initialData.id) {
      clearErrors()
    }
  }, [initialData.id, clearErrors])

  const handleChange = (field: keyof NoteFormData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validate field in real-time
    validateField(field, value)
    
    // Only check for /klipy in content field
    if (field === 'content') {
      const match = value.match(/\/klipy\s+(\w+)/i)
      if (match) {
        setKlipyQuery(match[1])
        setKlipyPage(1)
        setShowGifPicker(true)
      }
    }
  }

  const handleLabelToggle = (label: { id: number; name: string; color?: string }) => {
    const exists = data.labels?.some(l => l.id === label.id);
    if (exists) {
      const newLabels = (data.labels || []).filter(l => l.id !== label.id)
      handleChange('labels', newLabels)
    } else {
      const newLabels = [...(data.labels || []), label]
      handleChange('labels', newLabels)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate entire form before submission
    const validationErrors = validateForm(data)
    if (validationErrors.length > 0) {
      showToast('Please fix the validation errors before submitting', 'error')
      return
    }

    setIsSubmitting(true)
    clearErrors()
    
    try {
      // Prepare data for backend - ensure proper field mapping
      const submitData: any = {
        title: data.title,
        content: data.content,
        pinned: data.pinned,
        imageUrl: data.imageUrl, // Include the uploaded image URL
        gif_url: data.gif_url,
        gif_slug: data.gif_slug,
      }

      // ✅ FIXED: Only include removeImage flag for updates, not for new notes
      if (initialData.id) {
        submitData.removeImage = removeImageFlag
      }

      // ✅ FIXED: Only include labels if they are explicitly set (not just empty array)
      if (initialData.id) {
        // For updates, only send labels if they are different from initial data
        const currentLabels = (data.labels || []).map(label => ({
          id: label.id,
          name: label.name,
          color: label.color
        }))
        const initialLabels = (initialData.labels || []).map(label => ({
          id: label.id,
          name: label.name,
          color: label.color
        }))
        
        // Only include labels in submission if they have changed
        if (JSON.stringify(currentLabels) !== JSON.stringify(initialLabels)) {
          submitData.labels = currentLabels
        }
      } else {
        // For new notes, always include labels
        submitData.labels = (data.labels || []).map(label => ({
          id: label.id,
          name: label.name,
          color: label.color
        }))
      }
      
      // Debug: log what's being sent
      console.log('Form submission data:', submitData)
      console.log('Original data state:', data)
      
      if (initialData.id) {
        // Update existing note using Inertia router
        await router.put(`/notes/${initialData.id}`, submitData, {
          onSuccess: () => {
            showToast('Note updated successfully!', 'success')
            setRemoveImageFlag(false) // ✅ Reset the flag after successful update
            onSuccess({ id: initialData.id, ...submitData })
          },
          onError: (errors) => {
            console.error('Update errors:', errors)
            showToast('Failed to update note. Please try again.', 'error')
          }
        })
      } else {
        // Create new note using Inertia router
        await router.post('/notes', submitData, {
          onSuccess: () => {
            showToast('Note created successfully!', 'success')
            // Call onSuccess with a temporary note object
            onSuccess({ id: Date.now(), ...submitData })
          },
          onError: (errors) => {
            console.error('Creation errors:', errors)
            showToast('Failed to create note. Please try again.', 'error')
          }
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      showToast('Failed to save note. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ DEBUG: Test upload function to debug issues
  const testUpload = async (file: File) => {
    console.log('Testing upload with file:', file)
    
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch('/notes/test-upload', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      })
      
      const result = await response.json()
      console.log('Test upload result:', result)
      return result
    } catch (error) {
      console.error('Test upload error:', error)
      throw error
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      console.log('Uploading image:', {
        fileName: file.name,
        size: file.size,
        type: file.type,
      })
      
      // ✅ FIXED: Use fetch with proper authentication headers
      const response = await fetch('/notes/upload-image', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      })

      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Upload successful:', result)
        handleChange('imageUrl', result.imageUrl)
        setImagePreview(result.imageUrl)
        showToast('Image uploaded successfully!', 'success')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Upload failed:', errorData)
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('Image upload error:', error)
      showToast(`Failed to upload image: ${error.message}`, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ✅ DEBUG: Test upload first, then do real upload
      testUpload(file).then(() => {
        console.log('Test upload successful, proceeding with real upload')
        handleImageUpload(file)
      }).catch((error) => {
        console.error('Test upload failed:', error)
        showToast('Upload test failed - check console for details', 'error')
      })
    }
  }

  const handleRemoveImage = () => {
    setRemoveImageFlag(true)
    setImagePreview(null)
    handleChange('imageUrl', null)
  }

  const handleGifSelect = (gifUrl: string, gifSlug: string) => {
    handleChange('gif_url', gifUrl)
    handleChange('gif_slug', gifSlug)
    
    // ✅ FIXED: Remove the /klipy command from content after GIF selection
    const updatedContent = data.content.replace(/\/klipy\s+\w+/gi, '').trim()
    handleChange('content', updatedContent)
    
    setShowGifPicker(false)
    showToast('GIF added to note!', 'success')
  }

  const handleGifRemove = () => {
    handleChange('gif_url', null)
    handleChange('gif_slug', null)
    showToast('GIF removed from note', 'info')
  }

  // Error display component
  const ErrorMessage = ({ field }: { field: keyof NoteFormData }) => {
    const error = getFieldError(field as string)
    if (!error) return null
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-sm mt-1 flex items-center gap-1"
      >
        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
        {error}
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#98989D] mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full px-3 py-2 bg-[#1C1C1E] border text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
              getFieldError('title') ? 'border-red-400/50 focus:ring-red-400' : 'border-[#3A3A3C]'
            }`}
            placeholder="Enter note title..."
          />
          <ErrorMessage field="title" />
        </div>

        {/* Content Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-[#98989D]">
              Content
            </label>
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 text-sm text-[#98989D] hover:text-white transition-colors"
            >
              {isPreview ? <FileText size={16} /> : <Eye size={16} />}
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          
          {isPreview ? (
            <div className="border border-[#3A3A3C] rounded-xl p-4 bg-[#1C1C1E] min-h-[200px]">
              {data.content ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {data.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-[#98989D] italic">No content to preview</p>
              )}
            </div>
          ) : (
            <textarea
              id="content"
              value={data.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 bg-[#1C1C1E] border text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                getFieldError('content') ? 'border-red-400/50 focus:ring-red-400' : 'border-[#3A3A3C]'
              }`}
              placeholder="Write your note content here... (Markdown supported)"
            />
          )}
          <ErrorMessage field="content" />
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-[#98989D] mb-2">
            Image
          </label>
          <div className="space-y-3">
            {/* File Upload */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
          <button
            type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 border border-[#3A3A3C] rounded-xl shadow-sm text-sm font-medium text-white bg-[#1C1C1E] hover:bg-[#3A3A3C] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 transition-all duration-200"
              >
                <ImageIcon size={16} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>

              {/* GIF Picker */}
          <button
            type="button"
                onClick={() => setShowGifPicker(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#3A3A3C] rounded-xl shadow-sm text-sm font-medium text-white bg-[#1C1C1E] hover:bg-[#3A3A3C] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
                🎬 Add GIF
          </button>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Note attachment"
                  className="max-w-xs max-h-48 rounded-md border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* GIF Preview */}
            {data.gif_url && (
              <div className="relative inline-block">
                <img
                  src={data.gif_url}
                  alt="GIF"
                  className="max-w-xs max-h-48 rounded-md border"
                />
                <button
                  type="button"
                  onClick={handleGifRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}
        </div>
      </div>

        {/* Labels Section */}
        <div>
          <label className="block text-sm font-medium text-[#98989D] mb-2">
            Labels
          </label>
          <div className="flex flex-wrap gap-2">
            {allLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleLabelToggle(label)}
                className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                  data.labels?.some(l => l.id === label.id)
                    ? 'bg-blue-400/20 text-blue-400 border border-blue-400/40'
                    : 'bg-[#1C1C1E] text-[#98989D] border border-[#3A3A3C] hover:bg-[#3A3A3C] hover:text-white'
                }`}
              >
                {label.name}
              </button>
            ))}
          </div>
          <ErrorMessage field="labels" />
        </div>

        {/* Pinned Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="pinned"
            checked={data.pinned}
            onChange={(e) => handleChange('pinned', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="pinned" className="ml-2 block text-sm text-white">
            Pin this note
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#3A3A3C]">
            <button
              type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#3A3A3C] rounded-xl shadow-sm text-sm font-medium text-[#98989D] bg-[#1C1C1E] hover:bg-[#3A3A3C] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? 'Saving...' : initialData.id ? 'Update Note' : 'Create Note'}
            </button>
          </div>


      </form>

      {/* Klipy GIF Picker Modal */}
      {showGifPicker && (
        <KlipyGifPicker
          query={klipyQuery}
          page={klipyPage}
          onSelect={(gifUrl: string, gifSlug?: string) => gifSlug && handleGifSelect(gifUrl, gifSlug)}
          onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>
  )
}