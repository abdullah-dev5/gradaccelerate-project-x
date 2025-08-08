import { Head, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Pin, PinOff, Trash2, Share2, Copy, ExternalLink, X } from 'lucide-react'
import { useState } from 'react'

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  pinned?: boolean
  imageUrl: string | null
  shareUuid?: string | null
  labels?: Array<{
    id: number
    name: string
    color: string | null
  }>
}

export default function Show({ note }: { note: Note }) {
  const [isPinned, setIsPinned] = useState(note.pinned || false)
  const [shareUrl, setShareUrl] = useState<string | null>(note.shareUuid ? `/notes/shared/${note.shareUuid}` : null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)

  const handlePin = async () => {
    try {
      const response = await fetch(`/notes/${note.id}/toggle-pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        setIsPinned(!isPinned)
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const handleGenerateShare = async () => {
    setIsGeneratingShare(true)
    try {
      const response = await fetch(`/notes/${note.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setShareUrl(data.shareUrl)
        setShowShareModal(true)
      } else {
        alert('Failed to generate share link')
      }
    } catch (error) {
      console.error('Error generating share link:', error)
      alert('Failed to generate share link')
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const handleRevokeShare = async () => {
    try {
      const response = await fetch(`/notes/${note.id}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        setShareUrl(null)
        setShowShareModal(false)
      } else {
        alert('Failed to revoke share link')
      }
    } catch (error) {
      console.error('Error revoking share link:', error)
      alert('Failed to revoke share link')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + text)
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Failed to copy link')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/notes/${note.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // Explicitly NOT including 'X-Inertia' header to get JSON response
          }
        })

        if (response.ok) {
          // Use Inertia router to navigate back to notes page
          router.visit('/notes')
        } else {
          const errorData = await response.json()
          console.error('Error deleting note:', errorData)
          alert('Failed to delete note. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Failed to delete note. Please try again.')
      }
    }
  }

  return (
    <>
      <Head title={note.title} />
      <div className="min-h-screen bg-[#1C1C1E] text-white">
        <div className="max-w-4xl mx-auto p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div className="flex items-center gap-3">
              <Link 
                href="/notes" 
                className="p-2 hover:bg-[#2C2C2E] rounded-full transition-colors duration-200"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-3xl font-bold">Note Details</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handlePin}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isPinned 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-[#2C2C2E] hover:bg-[#3A3A3C]'
                }`}
              >
                {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
              </button>

              <button
                onClick={shareUrl ? () => setShowShareModal(true) : handleGenerateShare}
                disabled={isGeneratingShare}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  shareUrl 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-[#2C2C2E] hover:bg-[#3A3A3C]'
                } ${isGeneratingShare ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Share2 size={20} />
              </button>
              
              <Link
                href={`/notes/${note.id}/edit`}
                className="p-2 bg-[#0A84FF] hover:bg-[#0A74FF] rounded-full transition-colors duration-200"
              >
                <Edit size={20} />
              </Link>
              
              <button
                onClick={handleDelete}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors duration-200"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2C2C2E] rounded-xl p-6"
          >
            {/* Labels */}
            {note.labels && note.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {note.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-3 py-1 text-xs rounded-full border"
                    style={{
                      backgroundColor: label.color || '#374151',
                      borderColor: label.color || '#6B7280',
                      color: '#ffffff'
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold mb-4 text-white">
              {note.title}
            </h2>

            {/* Image */}
            {note.imageUrl && (
              <div className="mb-6">
                <img
                  src={note.imageUrl}
                  alt="Note attachment"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-gray-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>

            {/* Meta information */}
            <div className="mt-6 pt-4 border-t border-[#3A3A3C] text-sm text-gray-400">
              <p>Created: {new Date(note.createdAt).toLocaleDateString()}</p>
              {note.updatedAt && (
                <p>Updated: {new Date(note.updatedAt).toLocaleDateString()}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Share Modal */}
        {showShareModal && shareUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#2C2C2E] rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Share Note</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-[#3A3A3C] rounded transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-4">
                Anyone with this link can view your note. They won't be able to edit it.
              </p>

              <div className="bg-[#1C1C1E] rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-mono truncate mr-2">
                    {window.location.origin + shareUrl}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(shareUrl)}
                      className="p-1 hover:bg-[#3A3A3C] rounded transition-colors"
                      title="Copy link"
                    >
                      <Copy size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => window.open(window.location.origin + shareUrl, '_blank')}
                      className="p-1 hover:bg-[#3A3A3C] rounded transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="flex-1 bg-[#0A84FF] hover:bg-[#0A74FF] text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={handleRevokeShare}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Revoke
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  )
}
