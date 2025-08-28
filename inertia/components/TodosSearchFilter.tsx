import React from 'react'
import { Search, X, Filter, Target, Clock } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useTodosStore, TodoPriority, TodoStatus } from '../stores/todos_store'

interface Label {
  id: number
  name: string
  color?: string
}

interface TodosSearchFilterProps {
  labels: Label[]
  className?: string
}

const priorityColors: Record<TodoPriority, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444'
}

const statusColors: Record<TodoStatus, string> = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981'
}

export const TodosSearchFilter: React.FC<TodosSearchFilterProps> = ({ 
  labels, 
  className 
}) => {
  const { 
    searchQuery, 
    selectedLabels, 
    selectedPriorities,
    selectedStatuses,
    setSearchQuery, 
    setSelectedLabels, 
    setSelectedPriorities,
    setSelectedStatuses,
    clearFilters 
  } = useTodosStore()

  const handleLabelToggle = (labelId: number) => {
    if (selectedLabels.includes(labelId)) {
      setSelectedLabels(selectedLabels.filter(id => id !== labelId))
    } else {
      setSelectedLabels([...selectedLabels, labelId])
    }
  }

  const handlePriorityToggle = (priority: TodoPriority) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== priority))
    } else {
      setSelectedPriorities([...selectedPriorities, priority])
    }
  }

  const handleStatusToggle = (status: TodoStatus) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status))
    } else {
      setSelectedStatuses([...selectedStatuses, status])
    }
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  const hasActiveFilters = searchQuery.trim() !== '' || 
    selectedLabels.length > 0 || 
    selectedPriorities.length > 0 || 
    selectedStatuses.length > 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search todos by title or description..."
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

      {/* Priority Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filter by priority:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['low', 'medium', 'high'] as TodoPriority[]).map((priority) => (
            <Badge
              key={priority}
              variant={selectedPriorities.includes(priority) ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 capitalize ${
                selectedPriorities.includes(priority)
                  ? 'text-white border-transparent'
                  : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-500 hover:text-white'
              }`}
              onClick={() => handlePriorityToggle(priority)}
              style={{
                backgroundColor: selectedPriorities.includes(priority) 
                  ? priorityColors[priority]
                  : 'transparent',
                borderColor: selectedPriorities.includes(priority) 
                  ? priorityColors[priority]
                  : undefined
              }}
            >
              {priority}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'in_progress', 'completed'] as TodoStatus[]).map((status) => (
            <Badge
              key={status}
              variant={selectedStatuses.includes(status) ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 capitalize ${
                selectedStatuses.includes(status)
                  ? 'text-white border-transparent'
                  : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-500 hover:text-white'
              }`}
              onClick={() => handleStatusToggle(status)}
              style={{
                backgroundColor: selectedStatuses.includes(status) 
                  ? statusColors[status]
                  : 'transparent',
                borderColor: selectedStatuses.includes(status) 
                  ? statusColors[status]
                  : undefined
              }}
            >
              {status.replace('_', ' ')}
            </Badge>
          ))}
        </div>
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
        <div className="text-sm text-gray-400 text-center space-y-1">
          {searchQuery && (
            <div>Search: "{searchQuery}"</div>
          )}
          {selectedPriorities.length > 0 && (
            <div>Priorities: {selectedPriorities.length} selected</div>
          )}
          {selectedStatuses.length > 0 && (
            <div>Statuses: {selectedStatuses.length} selected</div>
          )}
          {selectedLabels.length > 0 && (
            <div>Labels: {selectedLabels.length} selected</div>
          )}
        </div>
      )}
    </div>
  )
}
