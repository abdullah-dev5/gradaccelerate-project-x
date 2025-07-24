import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Calendar, User, Share2, Eye, Lock } from 'lucide-react'
import { useState } from 'react'

interface SharedNote {
  id: number
  title: string
  content: string
  processedContent: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string | null
  shareUuid: string
  isShared: boolean
  labels?: Array<{
    id: number
    name: string
    color: string | null
  }>
  user: {
    fullName: string
    email: string
  }
}

interface SharedNotePageProps {
  note: SharedNote
  isReadOnly: boolean
}

export default function SharedNote({ note }: SharedNotePageProps) {
  const [showRawContent, setShowRawContent] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Head title={`Shared: ${note.title}`} />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg mb-6 p-6 border border-purple-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Shared Note</h1>
                  <p className="text-sm text-gray-500">This note has been shared publicly</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                <Lock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Read Only</span>
              </div>
            </div>

            {/* Shared by info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Shared by: <strong>{note.user.fullName || note.user.email}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(note.createdAt)}</span>
              </div>
              {note.updatedAt && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated: {formatDate(note.updatedAt)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Note Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8 border border-purple-100"
          >
            {/* Note Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
              
              {/* Labels */}
              {note.labels && note.labels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.labels.map((label) => (
                    <span
                      key={label.id}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: label.color || '#6366f1' }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note Image */}
            {note.imageUrl && (
              <div className="mb-6">
                <img
                  src={note.imageUrl}
                  alt="Note attachment"
                  className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                />
              </div>
            )}

            {/* Content Toggle */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Content</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRawContent(!showRawContent)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>{showRawContent ? 'Show Formatted' : 'Show Raw'}</span>
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="prose prose-slate max-w-none">
              {showRawContent ? (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm text-gray-700 whitespace-pre-wrap border">
                  {note.content}
                </pre>
              ) : (
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: note.processedContent }}
                />
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <p className="text-sm text-gray-600">
                This note was shared using a secure, unique link. 
                <br />
                <span className="font-medium">Note ID:</span> {note.shareUuid}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
