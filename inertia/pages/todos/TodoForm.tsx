
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Label as TodoLabel } from '../../components/Label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label as FormLabel } from '../../components/ui/label';
import { TodoPriority, TodoStatus } from '../../stores/todos_store';
import { useTodosStore } from '../../stores/todos_store';
import { useTodoFormValidation } from '../../hooks/use_form_validation';
import { TodoFormData } from '../../validators/todo_schemas';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';

type TodoLabelType = {
  id: number;
  name: string;
  color?: string;
};

interface TodoFormProps {
  initialData?: {
    title?: string;
    description?: string;
    isCompleted?: boolean;
    priority?: TodoPriority;
    status?: TodoStatus;
    labels?: TodoLabelType[];
  };
  onSuccess?: () => void;
  onCancel: () => void;
  onRefresh?: (page: number, perPage: number) => void;
  currentPage?: number;
  perPage?: number;
  submitLabel?: string;
  allLabels?: TodoLabelType[];
  todoId?: number;
}

export function TodoForm({ initialData, onSuccess, onCancel, onRefresh, currentPage = 1, perPage = 10, submitLabel = 'Create', allLabels = [], todoId }: TodoFormProps) {
  const { showToast } = useToast()
  const { createTodo, updateTodo, isLoading, error } = useTodosStore()
  
  // Form validation hook
  const {
    errors,
    validateField,
    validateForm,
    clearErrors,
    hasErrors,
    getFieldError
  } = useTodoFormValidation({
    validateOnChange: true,
    debounceMs: 500
  })

  const [form, setForm] = useState<TodoFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    isCompleted: initialData?.isCompleted || false,
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'pending',
    labels: initialData?.labels || [],
  });
  
  const [processing, setProcessing] = useState(false);

  // Clear validation errors when form data changes
  useEffect(() => {
    if (todoId) {
      clearErrors()
    }
  }, [todoId, clearErrors])

  const handleChange = (field: keyof TodoFormData, value: any) => {
    setForm((prev: TodoFormData) => ({ ...prev, [field]: value }));
    
    // Validate field in real-time
    validateField(field, value)
  };

  const updatePriorityStatus = async (field: 'priority' | 'status', value: any) => {
    if (!todoId) return
    
    try {
      // Optimistic update - immediately update the form state
      setForm(prev => ({ ...prev, [field]: value }))
      
      const response = await apiService.patch(`/todos/${todoId}/priority-status`, { [field]: value });

      if (response.data) {
        showToast(`${field} updated successfully!`, 'success');
        // No need to refresh since we already updated the UI optimistically
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      // Revert optimistic update on error
      setForm(prev => ({ ...prev, [field]: initialData?.[field] || prev[field] }))
      showToast(`Failed to update ${field}. Please try again.`, 'error');
    }
  };

  const handleLabelToggle = (label: TodoLabelType) => {
    const current = form.labels || [];
    const exists = current.find((l: TodoLabelType) => l.id === label.id);
    if (exists) {
      handleChange('labels', current.filter((l: TodoLabelType) => l.id !== label.id));
    } else {
      handleChange('labels', [...current, label]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form before submission
    const validationErrors = validateForm(form)
    if (validationErrors.length > 0) {
      showToast('Please fix the validation errors before submitting', 'error')
      return
    }
    
    setProcessing(true);
    clearErrors();
    
    try {
      let result
      
      if (todoId) {
        // Update existing todo
        result = await updateTodo(todoId, form)
        if (result) {
          showToast('Todo updated successfully!', 'success')
          onSuccess?.()
        }
      } else {
        // Create new todo
        result = await createTodo(form)
        if (result) {
          showToast('Todo created successfully!', 'success')
          onSuccess?.()
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      showToast('Failed to save todo. Please try again.', 'error')
    } finally {
      setProcessing(false)
    }
  };

  // Error display component
  const ErrorMessage = ({ field }: { field: keyof TodoFormData }) => {
    const error = getFieldError(field as string)
    if (!error) return null
    
    return (
      <div className="text-red-400 text-sm mt-1 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <FormLabel htmlFor="title" className="text-sm font-medium text-[#98989D]">
            Title *
          </FormLabel>
          <Input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`mt-1 ${
              getFieldError('title') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Enter todo title..."
          />
          <ErrorMessage field="title" />
        </div>

        {/* Description Field */}
        <div>
          <FormLabel htmlFor="description" className="text-sm font-medium text-[#98989D]">
            Description
          </FormLabel>
          <Textarea
            id="description"
            value={form.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className={`mt-1 ${
              getFieldError('description') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Enter todo description..."
          />
          <ErrorMessage field="description" />
        </div>

        {/* Priority Field */}
        <div>
          <FormLabel htmlFor="priority" className="text-sm font-medium text-[#98989D]">
            Priority
          </FormLabel>
          <Select
            value={form.priority}
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <ErrorMessage field="priority" />
        </div>

        {/* Status Field */}
        <div>
          <FormLabel htmlFor="status" className="text-sm font-medium text-[#98989D]">
            Status
          </FormLabel>
          <Select
            value={form.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ErrorMessage field="status" />
        </div>

        {/* Completed Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isCompleted"
            checked={form.isCompleted}
            onCheckedChange={(checked) => handleChange('isCompleted', checked)}
          />
          <FormLabel htmlFor="isCompleted" className="text-sm font-medium text-white">
            Mark as completed
          </FormLabel>
        </div>

        {/* Labels Section */}
        <div>
                    <FormLabel className="text-sm font-medium text-[#98989D] mb-2 block">
            Labels
          </FormLabel>
          <div className="flex flex-wrap gap-2">
            {allLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleLabelToggle(label)}
                className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                  form.labels?.some((l: TodoLabelType) => l.id === label.id)
                    ? 'bg-blue-400/20 text-blue-400 border border-blue-400/40'
                    : 'bg-[#1C1C1E] text-[#98989D] border border-[#3A3A3C] hover:bg-[#3A3A3C] hover:text-white'
                }`}
              >
                {label.name}
              </button>
            ))}
          </div>
          <ErrorMessage field="labels" />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#3A3A3C]">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={processing || isLoading || hasErrors}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {processing ? 'Saving...' : submitLabel}
          </Button>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="w-5 h-5 text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-400/80">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
