import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGridIcon, ListIcon, ArrowUpDownIcon, ClockIcon, EditIcon } from 'lucide-react'
import { useState } from 'react'

type ViewType = 'grid' | 'list'
type SortBy = 'createdAt' | 'updatedAt'
type SortOrder = 'asc' | 'desc'

interface ViewSwitcherProps {
  currentView: ViewType
  onChange: (view: ViewType) => void
  sortBy?: SortBy
  setSortBy?: (sortBy: SortBy) => void
  sortOrder?: SortOrder
  setSortOrder?: (sortOrder: SortOrder) => void
}

export default function ViewSwitcher({ 
  currentView, 
  onChange,
  sortBy = 'createdAt',
  setSortBy,
  sortOrder = 'desc',
  setSortOrder
}: ViewSwitcherProps) {
  const [isSortOpen, setIsSortOpen] = useState(false)

  const toggleSortOrder = () => {
    if (setSortOrder) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    }
  }

  const handleSortByChange = (type: SortBy) => {
    if (setSortBy) {
      setSortBy(type)
      setIsSortOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sorting controls */}
      {setSortBy && setSortOrder && (
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="bg-[#2C2C2E] rounded-lg p-2 text-[#98989D] hover:text-white flex items-center gap-1"
          >
            <ArrowUpDownIcon size={16} />
            <span className="text-xs hidden sm:inline">
              {sortBy === 'createdAt' ? 'Created' : 'Updated'}
            </span>
            <span className="text-xs hidden sm:inline">
              ({sortOrder === 'asc' ? 'Oldest' : 'Newest'})
            </span>
          </motion.button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-40 bg-[#2C2C2E] rounded-lg shadow-lg z-10 overflow-hidden"
              >
                <div className="py-1">
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
      )}

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
    </div>
  )
}