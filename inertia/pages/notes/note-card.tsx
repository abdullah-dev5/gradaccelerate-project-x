import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { Pin } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  pinned: boolean
}

interface NoteCardProps {
  note: Note
  viewType: 'grid' | 'list'
  onPinToggle?: (id: number) => void
}

export default function NoteCard({ note, viewType, onPinToggle }: NoteCardProps) {
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt || note.createdAt), {
    addSuffix: true
  })

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onPinToggle) onPinToggle(note.id)
  }

  return (
    <motion.div
      className={`relative overflow-hidden backdrop-blur-sm bg-[#2C2C2E]/80 border ${
        note.pinned ? 'border-yellow-400/30' : 'border-[#3A3A3C]'
      } ${viewType === 'grid' ? 'rounded-xl' : 'rounded-lg'}`}
      style={{
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={handlePinClick}
        className={`absolute top-3 right-2 z-10 p-1 rounded-full ${
          note.pinned
            ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
            : 'text-[#98989D] hover:text-yellow-400 hover:bg-yellow-400/10'
        } transition-colors`}
        aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
      >
        <Pin size={16} className={note.pinned ? '' : 'opacity-60'} />
      </button>

      <div className={`p-8 ${viewType === 'list' ? 'flex items-center gap-4' : ''}`}>
        <div className={viewType === 'list' ? 'flex-1' : ''}>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-medium text-white">{note.title}</h2>
            <span className="text-xs text-[#98989D]">{timeAgo}</span>
          </div>

          <div
            className={`text-[#98989D] text-sm ${
              viewType === 'grid' ? 'line-clamp-3' : 'line-clamp-1'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Text formatting
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-white/90" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-white/85" {...props} />
                ),
                del: ({ node, ...props }) => (
                  <del className="line-through text-[#98989D]/60" {...props} />
                ),

                // Headings
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-3 text-white" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold mt-5 mb-2.5 text-white" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-medium mt-4 mb-2 text-white" {...props} />
                ),

                // Paragraphs and blocks
                p: ({ node, ...props }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-yellow-400/50 pl-4 italic my-3 text-white/80"
                    {...props}
                  />
                ),

                // Lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="mb-1 pl-1" {...props} />
                ),

                // Code
                code: ({ node, className, children, ...props }) => {
                  // @ts-expect-error: 'inline' is not in the official types, but react-markdown passes it
                  const isInline = props.inline;
                  if (isInline) {
                    return (
                      <code
                        className="bg-[#3A3A3C] rounded px-1.5 py-0.5 text-sm font-mono text-yellow-300"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={`${className} bg-[#1C1C1E] block p-3 rounded-md my-2 text-sm font-mono overflow-x-auto`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-[#1C1C1E] p-3 rounded-md overflow-x-auto my-3"
                    {...props}
                  />
                ),

                // Links
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),

                // Horizontal rule
                hr: ({ node, ...props }) => (
                  <hr className="my-4 border-[#3A3A3C]/50" {...props} />
                ),

                // Images
                img: ({ node, ...props }) => (
                  <img
                    className="rounded-lg my-3 max-w-full h-auto border border-[#3A3A3C]/50"
                    loading="lazy"
                    {...props}
                  />
                ),

                // Tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border-collapse" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="border border-[#3A3A3C] px-4 py-2 text-left bg-[#3A3A3C]/50 font-semibold"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="border border-[#3A3A3C] px-4 py-2"
                    {...props}
                  />
                )
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {viewType === 'grid' && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#2C2C2E] to-transparent" />
      )}
    </motion.div>
  )
}