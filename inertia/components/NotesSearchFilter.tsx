import React from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useNotesStore } from '../stores/notesStore'

interface Label {
  id: number
  name: string
  color?: string
}

interface NotesSearchFilterProps {
  labels: Label[]
  className?: string
}

export const NotesSearchFilter: React.FC<NotesSearchFilterProps> = ({ 
  labels, 
  className 
}) => {
  const { 
    searchQuery, 
    selectedLabels, 
    setSearchQuery, 
    setSelectedLabels, 
    clearFilters 
  } = useNotesStore()

  const handleLabelToggle = (labelId: number) => {
    if (selectedLabels.includes(labelId)) {
      setSelectedLabels(selectedLabels.filter(id => id !== labelId))
    } else {
      setSelectedLabels([...selectedLabels, labelId])
    }
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLabels.length > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search notes by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 bg-[#2C2C2E] border-[#3A3A3C] text-white placeholder:text-gray-400 focus:border-[#0A84FF] focus:ring-[#0A84FF]"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Labels Filter */}
      {labels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filter by labels:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge
                key={label.id}
                variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedLabels.includes(label.id)
                    ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                    : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-500 hover:text-white'
                }`}
                onClick={() => handleLabelToggle(label.id)}
                style={{
                  backgroundColor: selectedLabels.includes(label.id) 
                    ? label.color || '#0A84FF' 
                    : 'transparent'
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-400 border-gray-600 hover:text-white hover:border-gray-500"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-400 text-center">
          {searchQuery && (
            <span className="inline-block mr-2">
              Search: "{searchQuery}"
            </span>
          )}
          {selectedLabels.length > 0 && (
            <span className="inline-block">
              Labels: {selectedLabels.length} selected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
