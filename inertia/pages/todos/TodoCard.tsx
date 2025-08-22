//
import { CheckCircle, Circle, Edit, Trash2, Target, Clock } from 'lucide-react'
import { Label } from '../../components/Label';
import { Badge } from '../../components/ui/badge';
import React from 'react'
import { TodoPriority, TodoStatus } from '../../stores/todosStore';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  priority: TodoPriority;
  status: TodoStatus;
  labels?: { id: number; name: string; color?: string }[];
}

interface TodoCardProps {
  todo: Todo
  isEditing: boolean
  onEditStart: (todo: Todo) => void
  onDelete: (id: number, title: string) => void
  onToggleStatus: (id: number) => void
  onUpdate?: (id: number, updates: Partial<Todo>) => void
  children?: React.ReactNode // For edit form
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

export function TodoCard({ todo, isEditing, onEditStart, onDelete, onToggleStatus, onUpdate, children }: TodoCardProps) {
  if (isEditing) {
    return <>{children}</>
  }

  const updatePriorityStatus = async (field: 'priority' | 'status', value: any) => {
    try {
      const requestBody = { [field]: value };
      console.log(`Sending request to update ${field}:`, requestBody);
      
      const response = await fetch(`/todos/${todo.id}/priority-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to update ${field}: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`${field} updated successfully:`, result);
      
      // Update local state through the callback if provided
      if (onUpdate) {
        onUpdate(todo.id, { [field]: value });
      } else {
        // Fallback to page reload if no callback provided
        window.location.reload();
      }
      
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      alert(`Failed to update ${field}. Please try again. Check console for details.`);
    }
  };

  const handlePriorityClick = () => {
    const priorities: TodoPriority[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(todo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    updatePriorityStatus('priority', nextPriority);
  };

  const handleStatusClick = () => {
    const statuses: TodoStatus[] = ['pending', 'in_progress', 'completed'];
    const currentIndex = statuses.indexOf(todo.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updatePriorityStatus('status', nextStatus);
  };
  
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
        {/* Priority and Status Row */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handlePriorityClick}
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            title={`Click to change priority. Current: ${todo.priority}`}
          >
            <Badge
              className="flex items-center gap-1 text-xs"
              style={{
                borderColor: priorityColors[todo.priority],
                color: priorityColors[todo.priority],
                backgroundColor: 'transparent',
                border: `1px solid ${priorityColors[todo.priority]}`
              }}
            >
              <Target size={12} />
              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
            </Badge>
          </button>
          <button
            onClick={handleStatusClick}
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            title={`Click to change status. Current: ${todo.status.replace('_', ' ')}`}
          >
            <Badge
              className="flex items-center gap-1 text-xs"
              style={{
                borderColor: statusColors[todo.status],
                color: statusColors[todo.status],
                backgroundColor: 'transparent',
                border: `1px solid ${statusColors[todo.status]}`
              }}
            >
              <Clock size={12} />
              {todo.status.replace('_', ' ').charAt(0).toUpperCase() + todo.status.replace('_', ' ').slice(1)}
            </Badge>
          </button>
        </div>

        {/* Labels */}
        {todo.labels && todo.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {todo.labels.map(label => (
              <Label key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        )}

        {/* Title and Description */}
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
          
          {/* Action Buttons */}
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
