import { useState, useRef } from 'react'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { FileText, Eye, Pin, Image as ImageIcon, Tag, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'

interface NoteFormProps {
  initialData?: {
    id?: number
    title: string
    content: string
    pinned: boolean
    imageUrl?: string | null
    labels?: Array<{
      id: number
      name: string
      color: string | null
    }>
  }
  onSuccess: (note: any) => void
  onCancel?: () => void
  labels: Array<{ // Changed from optional to required
    id: number
    name: string
    color: string | null
  }>
}

export default function NoteForm({ 
  initialData = { title: '', content: '', pinned: false },
  onSuccess,
  onCancel,
  labels // Removed the default empty array
}: NoteFormProps) {

  const [isPreview, setIsPreview] = useState(false)
  const [data, setData] = useState({
    title: initialData.title,
    content: initialData.content,
    pinned: initialData.pinned,
    imageUrl: initialData.imageUrl || null,
    labelIds: initialData.labels?.map(l => l.id) || []
  })
  const [removeImageFlag, setRemoveImageFlag] = useState(false)

  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('content', data.content)
    formData.append('pinned', String(data.pinned))
    
    // Updated labelIds handling - append each ID individually
    if (data.labelIds.length > 0) {
      data.labelIds.forEach(id => {
        formData.append('labelIds[]', id.toString())
      })
    }

    // Handle image upload
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0])
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl)
    }

    // Handle image removal for existing notes
    if (removeImageFlag && initialData.id) {
      formData.append('removeImage', 'true')
    }

    const url = initialData.id ? `/notes/${initialData.id}/edit` : '/notes'
    const method = initialData.id ? 'put' : 'post'

    router[method](url, formData, {
      preserveScroll: true,
      onSuccess: () => {
        onSuccess({} as any) // Trigger form close
        // No need to manually visit - the redirect will handle this
      },
      onError: (errors: any) => {
        console.error('Validation errors:', errors)
        setError(Object.values(errors)[0] as string || 'Failed to save note')
        setIsSubmitting(false)
      },
      onFinish: () => {
        setIsSubmitting(false)
      }
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    
    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setRemoveImageFlag(false) // Reset remove flag when new image is selected
      
      // Actual upload will happen during form submission
    } catch (error) {
      console.error('Error handling image:', error)
      setError('Failed to process image')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    handleChange('imageUrl', null)
    setImagePreview(null)
    setRemoveImageFlag(true) // Flag that image should be removed from the note
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const toggleLabel = (labelId: number) => {
    handleChange('labelIds', 
      data.labelIds.includes(labelId)
        ? data.labelIds.filter(id => id !== labelId)
        : [...data.labelIds, labelId]
    )
  }

  return (
    <motion.div
      className="bg-[#2C2C2E] rounded-xl p-6 backdrop-blur-lg border border-[#3A3A3C]"
      style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          {initialData.id ? 'Edit Note' : 'New Note'}
        </h2>
        <div className="flex items-center gap-2">
          {/* Pin toggle */}
          <button
            type="button"
            onClick={() => handleChange('pinned', !data.pinned)}
            className={`p-2 rounded-full ${data.pinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-[#98989D] hover:bg-[#3A3A3C]'}`}
            aria-label={data.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={18} />
          </button>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-full ${isPreview ? 'text-[#0A84FF] bg-[#0A84FF]/10' : 'text-[#98989D] hover:bg-[#3A3A3C]'}`}
            aria-label={isPreview ? "Switch to editor" : "Switch to preview"}
          >
            {isPreview ? <FileText size={18} /> : <Eye size={18} />}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-full text-[#98989D] hover:bg-[#3A3A3C]"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            type="text"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Note title"
            className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none transition-all duration-200"
            required
          />
        </div>

        {imagePreview && (
          <div className="mb-4 relative group">
            <img
              src={imagePreview}
              alt="Note preview"
              className="w-full h-48 object-cover rounded-lg"
              onError={() => setImagePreview(null)}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-[#2C2C2E]/90 rounded-full text-white hover:bg-[#3A3A3C] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-4">
          {isPreview ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-3 bg-[#3A3A3C] text-white rounded-lg min-h-[120px] prose prose-invert prose-sm max-w-none"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: ({node, ...props}) => (
                    <a className="text-[#0A84FF] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  code: ({node, ...props}) => (
                    <code className="bg-[#2C2C2E] px-1 py-0.5 rounded" {...props} />
                  )
                }}
              >
                {data.content || '*Nothing to preview*'}
              </ReactMarkdown>
            </motion.div>
          ) : (
            <motion.textarea
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              value={data.content}
              onChange={(e) => handleChange('content', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your note in Markdown..."
              className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none min-h-[120px] transition-all duration-200"
              required
            />
          )}
        </div>

        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            id="note-image-upload"
          />
          <label
            htmlFor="note-image-upload"
            className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              isUploading 
                ? 'bg-[#3A3A3C] text-[#98989D]' 
                : 'bg-[#3A3A3C] text-[#98989D] hover:bg-[#4A4A4C]'
            }`}
          >
            <ImageIcon size={16} className="mr-2" />
            {isUploading ? 'Uploading...' : 'Add Image'}
          </label>

          {labels.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center text-[#98989D] mb-2">
                <Tag size={16} className="mr-2" />
                <span>Labels</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      data.labelIds.includes(label.id) 
                        ? 'opacity-100' 
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: label.color ? `${label.color}20` : '#3A3A3C',
                      color: label.color || '#98989D',
                      border: label.color ? `1px solid ${label.color}30` : '1px solid #3A3A3C'
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isUploading || isSubmitting}
          className="w-full bg-[#0A84FF] text-white px-4 py-3 rounded-lg hover:bg-[#0A74FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2 focus:ring-offset-[#2C2C2E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isUploading || isSubmitting 
            ? "Saving..." 
            : initialData.id 
              ? "Update Note" 
              : "Save Note"}
        </motion.button>

        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-[#98989D]">
            {isPreview ? "Markdown preview" : "Markdown supported"}
          </p>
          <p className="text-sm text-[#98989D]">
            {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"} + Enter to save
          </p>
        </div>
      </form>
    </motion.div>
  )
}