import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Eye, Pin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface NoteFormProps {
  data: {
    title: string
    content: string
    pinned: boolean
  }
  setData: (field: string, value: any) => void
  submit: (e: React.FormEvent) => void
  processing: boolean
  handleKeyDown: (e: React.KeyboardEvent) => void
}

export default function NoteForm({ 
  data, 
  setData, 
  submit, 
  processing, 
  handleKeyDown 
}: NoteFormProps) {
  const [isPreview, setIsPreview] = useState(false)

  return (
    <motion.div
      className="bg-[#2C2C2E] rounded-xl p-6 backdrop-blur-lg border border-[#3A3A3C]"
      style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">New Note</h2>
        <div className="flex items-center gap-2">
          {/* Pin toggle */}
          <button
            type="button"
            onClick={() => setData('pinned', !data.pinned)}
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
        </div>
      </div>

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
          {isPreview ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-3 bg-[#3A3A3C] text-white rounded-lg min-h-[120px] prose prose-invert prose-sm max-w-none"
            >
              <ReactMarkdown components={{
                a: ({node, ...props}) => (
                  <a className="text-[#0A84FF] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                code: ({node, ...props}) => (
                  <code className="bg-[#2C2C2E] px-1 py-0.5 rounded" {...props} />
                )
              }}>
                {data.content || '*Nothing to preview*'}
              </ReactMarkdown>
            </motion.div>
          ) : (
            <motion.textarea
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              value={data.content}
              onChange={(e) => setData("content", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your note in Markdown..."
              className="w-full px-4 py-3 bg-[#3A3A3C] text-white placeholder-[#98989D] rounded-lg border-none focus:ring-2 focus:ring-[#0A84FF] focus:outline-none min-h-[120px] transition-all duration-200"
              required
            />
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={processing}
          className="w-full bg-[#0A84FF] text-white px-4 py-3 rounded-lg hover:bg-[#0A74FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2 focus:ring-offset-[#2C2C2E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {processing ? "Saving..." : "Save Note"}
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