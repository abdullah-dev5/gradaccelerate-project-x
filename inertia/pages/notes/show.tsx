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
  gif_url?: string | null
  gif_slug?: string | null
  shareUuid?: string | null
}

export default function Show({ note }: { note: Note }) {
  const [isPinned, setIsPinned] = useState(note.pinned || false)
  const [shareUrl, setShareUrl] = useState<string | null>(note.shareUuid ? `/notes/shared/${note.shareUuid}` : null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)

  // Helper function for SweetAlert2 toasts
  const showToast = async (title: string, text?: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const { default: Swal } = await import('sweetalert2')
    await Swal.fire({
      title,
      text,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#2C2C2E',
      color: '#ffffff',
      customClass: {
        popup: 'dark-popup',
        title: 'dark-title'
      }
    })
  }

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
      // Get CSRF token from Inertia's meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      
      const response = await fetch(`/notes/${note.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.shareUrl) {
          setShareUrl(data.shareUrl)
          setShowShareModal(true)
        }
      } else {
        const errorData = await response.json()
        console.error('Error generating share link:', errorData)
        showToast('Failed to generate share link', undefined, 'error')
      }
    } catch (error) {
      console.error('Error generating share link:', error)
      showToast('Failed to generate share link', undefined, 'error')
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const handleRevokeShare = async () => {
    try {
      // Get CSRF token from Inertia's meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      
      const response = await fetch(`/notes/${note.id}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken || ''
        }
      })

      if (response.ok) {
        setShareUrl(null)
        setShowShareModal(false)
      } else {
        const errorData = await response.json()
        console.error('Error revoking share link:', errorData)
        showToast('Failed to revoke share link', undefined, 'error')
      }
    } catch (error) {
      console.error('Error revoking share link:', error)
      showToast('Failed to revoke share link', undefined, 'error')
    }
  }


  const copyToClipboard = async (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.origin + text)
        showToast('Link copied to clipboard!', undefined, 'success')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        showToast('Failed to copy link', undefined, 'error')
      }
    } else {
      showToast('Clipboard not supported in this environment.', undefined, 'warning')
    }
  }

  const handleDelete = async () => {
    try {
      // ✅ FIXED: Use SweetAlert2 instead of browser confirm
      const { default: Swal } = await import('sweetalert2')
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete this note. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#6b7280', // gray-500
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        background: '#2C2C2E',
        color: '#ffffff',
        customClass: {
          popup: 'dark-popup',
          title: 'dark-title',
          confirmButton: 'dark-confirm-button',
          cancelButton: 'dark-cancel-button'
        }
      })

      if (result.isConfirmed) {
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
          showToast('Failed to delete note. Please try again.', undefined, 'error')
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      showToast('Failed to delete note. Please try again.', undefined, 'error')
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

            {/* GIF */}
            {note.gif_url && (
              <div className="mb-6 flex justify-center">
                <img
                  src={note.gif_url}
                  alt="GIF"
                  className="rounded-lg max-h-80 border border-[#3A3A3C]/50"
                  loading="lazy"
                  style={{ maxWidth: '100%' }}
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
