//
import { CheckCircle, Circle, Edit, Trash2 } from 'lucide-react'
import { Label } from '../../components/Label';
import React from 'react'


interface Todo {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  labels?: { id: number; name: string; color?: string }[];
}

interface TodoCardProps {
  todo: Todo
  isEditing: boolean
  onEditStart: (todo: Todo) => void
  onDelete: (id: number, title: string) => void
  onToggleStatus: (id: number) => void
  children?: React.ReactNode // For edit form
}

export function TodoCard({ todo, isEditing, onEditStart, onDelete, onToggleStatus, children }: TodoCardProps) {
  if (isEditing) {
    return <>{children}</>
  }
  return (
    <div className="flex items-start gap-3">
      <button 
        onClick={() => onToggleStatus(todo.id)}
        className="mt-1 hover:scale-110 transition-transform duration-200"
      >
        {todo.isCompleted ? (
          <CheckCircle size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-[#98989D] hover:text-green-400" />
        )}
      </button>
      <div className="flex-1">
        {todo.labels && todo.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {todo.labels.map(label => (
              <Label key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${todo.isCompleted ? 'line-through text-[#98989D]' : 'text-white'}`}>
              {todo.title}
            </h3>
            {todo.description && (
              <p className={`text-sm mt-1 ${todo.isCompleted ? 'line-through text-[#6D6D70]' : 'text-[#98989D]'}`}>
                {todo.description}
              </p>
            )}
            <p className="text-xs text-[#6D6D70] mt-2">
              Created {new Date(todo.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEditStart(todo)}
              className="p-2 hover:bg-[#48484A] rounded-lg transition-colors duration-200 text-[#98989D] hover:text-white"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(todo.id, todo.title)}
              className="p-2 hover:bg-[#48484A] rounded-lg transition-colors duration-200 text-[#98989D] hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
