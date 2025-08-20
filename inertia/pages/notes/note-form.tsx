<<<<<<< HEAD
import type React from "react"
import { motion } from "framer-motion"
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
import { usePage } from '@inertiajs/react'

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
>>>>>>> 97fc310 (refactor: implement hybrid authentication and fix note creation flow)

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
<<<<<<< HEAD
=======
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

  // ✅ FIXED: Get CSRF token from page props
  const { csrf } = usePage().props as any

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
    
    // ✅ FIXED: Handle labels properly - temporarily simplified to avoid validation issues
    // TODO: Fix labels handling after core note creation works
    // if (data.labels && data.labels.length > 0) {
    //   // Send each label individually to avoid JSON parsing issues
    //   data.labels.forEach((label, index) => {
    //     formData.append(`labels[${index}][id]`, label.id.toString())
    //     formData.append(`labels[${index}][name]`, label.name)
    //     if (label.color) {
    //       formData.append(`labels[${index}][color]`, label.color)
    //   }
    // })
    // } else {
    //   // If no labels, send empty array to avoid validation issues
    //   formData.append('labels', '[]')
    // }

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

    // ✅ FIXED: Use proper Inertia form submission with authentication
    router[method](url, formData, {
      preserveScroll: true,
      // ✅ FIXED: Let Inertia handle CSRF automatically
      onSuccess: (page: any) => {
        console.log('Note saved successfully:', page)
        onSuccess({} as any) // Trigger form close
        // The redirect will handle navigation
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
>>>>>>> 97fc310 (refactor: implement hybrid authentication and fix note creation flow)

export default function NoteForm({ data, setData, submit, processing, handleKeyDown }: NoteFormProps) {
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
        <div className="mb-4">
<<<<<<< HEAD
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            value={data.content}
            onChange={(e) => setData("content", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note content"
            className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none min-h-[120px] transition-all duration-200"
            required
=======
          <label className="block text-sm font-medium mb-2">Labels</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allLabels.map(label => (
              <div
                key={label.id}
                onClick={() => handleLabelToggle(label)}
                className={`transition-all cursor-pointer ${data.labels?.some(l => l.id === label.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                style={{ border: 'none', background: 'none', padding: 0 }}
              >
                <Label
                  name={label.name}
                  color={label.color}
                  onRemove={data.labels?.some(l => l.id === label.id) ? () => handleLabelToggle(label) : undefined}
                />
              </div>
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
              ref={textareaRef}
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
>>>>>>> 97fc310 (refactor: implement hybrid authentication and fix note creation flow)
          />
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
        <p className="text-center text-sm text-[#98989D] mt-2">
          Hit {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"} + Enter to add note
        </p>
      </form>
    </motion.div>
  )
} 