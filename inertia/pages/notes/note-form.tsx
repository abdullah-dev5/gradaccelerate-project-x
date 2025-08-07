<<<<<<< HEAD
import type React from "react"
import { motion } from "framer-motion"

interface NoteFormProps {
  data: {
    title: string
    content: string
  }
  setData: (field: string, value: string) => void
  submit: (e: React.FormEvent) => void
  processing: boolean
  handleKeyDown: (e: React.KeyboardEvent) => void
}

export default function NoteForm({ data, setData, submit, processing, handleKeyDown }: NoteFormProps) {
=======
import { useState, useRef } from 'react'
import { allLabels, Label } from '../../components/Label';
import KlipyGifPicker from './KlipyGifPicker'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { FileText, Eye, Pin, Image as ImageIcon, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'

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
  labels?: NoteLabelType[];
}

interface NoteFormProps {
  initialData?: NoteFormInitialData;
  onSuccess: (note: any) => void;
  onCancel?: () => void;
}
// Removed label logic from NoteFormProps

export default function NoteForm({ 
  initialData = { title: '', content: '', pinned: false },
  onSuccess,
  onCancel
}: NoteFormProps) {
// Removed label logic from function parameters

  const [isPreview, setIsPreview] = useState(false)
  const [data, setData] = useState({
    title: initialData.title,
    content: initialData.content,
    pinned: initialData.pinned,
    imageUrl: initialData.imageUrl || null,
    gifUrl: null as string | null,
    gifSlug: null as string | null,
    labels: initialData.labels || [],
  })
// Removed label logic from state initialization
    // label logic removed
    // label logic removed
  // label logic removed
  const [removeImageFlag, setRemoveImageFlag] = useState(false)

  // Klipy GIF picker state
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [klipyQuery, setKlipyQuery] = useState('')
  const [klipyPage, setKlipyPage] = useState(1)

  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
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
      setData(prev => ({ ...prev, labels: prev.labels.filter(l => l.id !== label.id) }));
    } else {
      setData(prev => ({ ...prev, labels: [...(prev.labels || []), label] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('content', data.content)
    formData.append('pinned', String(data.pinned))
    if (data.labels && data.labels.length > 0) {
      formData.append('labels', JSON.stringify(data.labels));
    }

    // Handle image upload
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0])
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl)
    }

    // Handle GIF fields
    if (data.gifUrl) {
      formData.append('gif_url', data.gifUrl)
    }
    if (data.gifSlug) {
      formData.append('gif_slug', data.gifSlug)
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
        // TEMP: Show full error details in alert for debugging
        alert('DEBUG ERROR: ' + JSON.stringify(errors))
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

  // label logic removed

  // Insert GIF markdown at cursor position and store gifUrl/gifSlug
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Accepts gifUrl and gifSlug
  const handleGifSelect = (gifUrl: string, gifSlug?: string) => {
    setShowGifPicker(false)
    setKlipyQuery('')
    setKlipyPage(1)
    // Remove /klipy command from content
    const klipyCmdRegex = /\n?\/klipy\s+\w+\n?/i;
    let cleanedContent = data.content.replace(klipyCmdRegex, '\n');
    // Insert ![gif](url) at cursor
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = cleanedContent.slice(0, start)
      const after = cleanedContent.slice(end)
      const newContent = `${before}\n![gif](${gifUrl})\n${after}`
      setData(prev => ({ ...prev, content: newContent, gifUrl, gifSlug: gifSlug || null }))
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + (`\n![gif](${gifUrl})\n`).length
      }, 0)
    } else {
      setData(prev => ({ ...prev, content: cleanedContent + `\n![gif](${gifUrl})\n`, gifUrl, gifSlug: gifSlug || null }))
    }
  }

>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)
  return (
    <motion.div
      className="bg-[#2C2C2E] rounded-xl p-6 backdrop-blur-lg border border-[#3A3A3C]"
      style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)" }}
    >
      <h2 className="text-xl font-semibold text-white mb-4">New Note</h2>
      <form onSubmit={submit}>
        <div className="mb-4">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            type="text"
            value={data.title}
            onChange={(e) => setData("title", e.target.value)}
            placeholder="Note title"
            className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none transition-all duration-200"
            required
          />
        </div>
<<<<<<< HEAD
=======

        {/* Labels UI (moved above image) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Labels</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allLabels.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleLabelToggle(label)}
                className={`transition-all ${data.labels?.some(l => l.id === label.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                style={{ border: 'none', background: 'none', padding: 0 }}
              >
                <Label
                  name={label.name}
                  color={label.color}
                  onRemove={data.labels?.some(l => l.id === label.id) ? () => handleLabelToggle(label) : undefined}
                />
              </button>
            ))}
          </div>
          {/* Show selected labels (if any) */}
          {data.labels && data.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.labels.map(label => (
                <Label
                  key={label.id}
                  name={label.name}
                  color={label.color}
                  onRemove={() => handleLabelToggle(label)}
                />
              ))}
            </div>
          )}
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

>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)
        <div className="mb-4">
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            value={data.content}
            onChange={(e) => setData("content", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note content"
            className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none min-h-[120px] transition-all duration-200"
            required
          />
<<<<<<< HEAD
=======
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
>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={processing}
          className="w-full bg-[#0A84FF] text-white px-4 py-3 rounded-lg hover:bg-[#0A74FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2 focus:ring-offset-[#2C2C2E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {processing ? "Adding..." : "Add Note"}
        </motion.button>
<<<<<<< HEAD
        <p className="text-center text-sm text-[#98989D] mt-2">
          Hit {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"} + Enter to add note
        </p>
=======

        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-[#98989D]">
            {isPreview ? "Markdown preview" : "Markdown supported"}
          </p>
          <p className="text-sm text-[#98989D]">
            {(typeof navigator !== 'undefined' && navigator.platform?.includes("Mac")) ? "⌘" : "Ctrl"} + Enter to save
          </p>
        </div>
>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)
      </form>
    </motion.div>
  )
} 