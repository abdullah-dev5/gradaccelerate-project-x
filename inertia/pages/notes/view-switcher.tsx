<<<<<<< HEAD
import { motion } from 'framer-motion'
import { LayoutGridIcon, ListIcon } from 'lucide-react'
=======
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGridIcon, ListIcon, ArrowUpDownIcon, ClockIcon, EditIcon, SearchIcon, XIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)

type ViewType = 'grid' | 'list'

interface ViewSwitcherProps {
  currentView: ViewType
  onChange: (view: ViewType) => void
<<<<<<< HEAD
}

export default function ViewSwitcher({ currentView, onChange }: ViewSwitcherProps) {
  return (
    <div className="bg-[#2C2C2E] rounded-lg p-1 flex gap-1">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange('grid')}
        className={`p-2 rounded ${
          currentView === 'grid' 
            ? 'bg-[#3A3A3C] text-white' 
            : 'text-[#98989D] hover:text-white'
        }`}
      >
        <LayoutGridIcon size={18} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange('list')}
        className={`p-2 rounded ${
          currentView === 'list' 
            ? 'bg-[#3A3A3C] text-white' 
            : 'text-[#98989D] hover:text-white'
        }`}
      >
        <ListIcon size={18} />
      </motion.button>
=======
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
  sortOrder: SortOrder
  setSortOrder: (sortOrder: SortOrder) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export default function ViewSwitcher({ 
  currentView, 
  onChange,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery
}: ViewSwitcherProps) {
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleSortByChange = (type: SortBy) => {
    setSortBy(type)
    setIsSortOpen(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearchOpen(false)
  }



  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative">
        {isSearchOpen ? (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center bg-[#2C2C2E] rounded-lg overflow-hidden"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent text-white px-3 py-2 w-40 focus:outline-none text-sm"
            />
            <button
              onClick={clearSearch}
              className="p-2 text-[#98989D] hover:text-white"
            >
              <XIcon size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSearchOpen(true)}
            className="bg-[#2C2C2E] rounded-lg p-2 text-[#98989D] hover:text-white"
          >
            <SearchIcon size={16} />
          </motion.button>
        )}
      </div>



      {/* Sorting controls */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="bg-[#2C2C2E] rounded-lg p-2 text-[#98989D] hover:text-white flex items-center gap-1"
        >
          <ArrowUpDownIcon size={16} />
          <span className="text-xs hidden sm:inline">
            {sortBy === 'createdAt' ? 'Created' : sortBy === 'updatedAt' ? 'Updated' : 'Title'}
          </span>
          <span className="text-xs hidden sm:inline">
            ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
          </span>
        </motion.button>

        <AnimatePresence>
          {isSortOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-[#2C2C2E] rounded-lg shadow-lg z-10 overflow-hidden"
            >
              <div className="py-1">
                <button
                  onClick={() => handleSortByChange('title')}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    sortBy === 'title' 
                      ? 'bg-[#3A3A3C] text-white' 
                      : 'text-[#98989D] hover:bg-[#3A3A3C] hover:text-white'
                  }`}
                >
                  <span className="w-4 text-center">T</span>
                  <span>Title</span>
                </button>
                <button
                  onClick={() => handleSortByChange('createdAt')}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    sortBy === 'createdAt' 
                      ? 'bg-[#3A3A3C] text-white' 
                      : 'text-[#98989D] hover:bg-[#3A3A3C] hover:text-white'
                  }`}
                >
                  <ClockIcon size={14} />
                  <span>Created Date</span>
                </button>
                <button
                  onClick={() => handleSortByChange('updatedAt')}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    sortBy === 'updatedAt' 
                      ? 'bg-[#3A3A3C] text-white' 
                      : 'text-[#98989D] hover:bg-[#3A3A3C] hover:text-white'
                  }`}
                >
                  <EditIcon size={14} />
                  <span>Updated Date</span>
                </button>
              </div>
              <div className="border-t border-[#3A3A3C] py-1">
                <button
                  onClick={toggleSortOrder}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#98989D] hover:bg-[#3A3A3C] hover:text-white"
                >
                  <ArrowUpDownIcon size={14} />
                  <span>Toggle Order</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View toggle */}
      <div className="bg-[#2C2C2E] rounded-lg p-1 flex gap-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange('grid')}
          className={`p-2 rounded ${
            currentView === 'grid' 
              ? 'bg-[#3A3A3C] text-white' 
              : 'text-[#98989D] hover:text-white'
          }`}
        >
          <LayoutGridIcon size={18} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange('list')}
          className={`p-2 rounded ${
            currentView === 'list' 
              ? 'bg-[#3A3A3C] text-white' 
              : 'text-[#98989D] hover:text-white'
          }`}
        >
          <ListIcon size={18} />
        </motion.button>
      </div>
>>>>>>> 0a002d7 ( feat: refactor note label system and inertia responses for todos/notes)
    </div>
  )
} 