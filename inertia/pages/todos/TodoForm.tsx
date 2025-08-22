
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Label as TodoLabel } from '../../components/Label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label as FormLabel } from '../../components/ui/label';
import { TodoPriority, TodoStatus } from '../../stores/todosStore';

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
  submitLabel?: string;
  allLabels?: TodoLabelType[];
  todoId?: number;
}

export function TodoForm({ initialData, onSuccess, onCancel, submitLabel = 'Create', allLabels = [], todoId }: TodoFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    isCompleted: initialData?.isCompleted || false,
    priority: initialData?.priority || 'medium' as TodoPriority,
    status: initialData?.status || 'pending' as TodoStatus,
    labels: initialData?.labels || [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState(false);

  const handleChange = (field: 'title' | 'description' | 'isCompleted' | 'priority' | 'status' | 'labels', value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Remove the immediate update - let the form submission handle it
    // This was causing issues with default values
  };

  const updatePriorityStatus = async (field: 'priority' | 'status', value: any) => {
    try {
      const response = await fetch(`/todos/${todoId}/priority-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update priority/status');
      }

      // Update local state with the response
      const result = await response.json();
      console.log(`${field} updated successfully:`, result);
      
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      // Optionally show an error message to the user
    }
  };

  const handleLabelToggle = (label: TodoLabelType) => {
    const current = form.labels || [];
    const exists = current.find(l => l.id === label.id);
    if (exists) {
      handleChange('labels', current.filter(l => l.id !== label.id));
    } else {
      handleChange('labels', [...current, label]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    try {
      const url = todoId ? `/todos/${todoId}` : '/todos';
      const method = todoId ? 'put' : 'post';
      await new Promise<void>((resolve, reject) => {
        router[method](url, form, {
          onSuccess: () => {
            setProcessing(false);
            // Only reset form to defaults if we're creating a new todo
            if (!todoId) {
              setForm({ 
                title: '', 
                description: '', 
                isCompleted: false, 
                priority: 'medium',
                status: 'pending',
                labels: [] 
              });
            }
            if (onSuccess) onSuccess();
            resolve();
          },
          onError: (errs: any) => {
            setProcessing(false);
            setErrors(errs || {});
            reject();
          },
        });
      });
    } catch {
      // errors handled above
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <FormLabel htmlFor="title" className="text-white">Title</FormLabel>
        <Input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="bg-[#2C2C2E] border-[#3A3A3C] text-white placeholder:text-gray-400 focus:border-[#0A84FF] focus:ring-[#0A84FF]"
          placeholder="Enter todo title..."
          required
        />
        {errors?.title && (
          <p className="text-red-500 text-sm">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <FormLabel htmlFor="description" className="text-white">Description</FormLabel>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="bg-[#2C2C2E] border-[#3A3A3C] text-white placeholder:text-gray-400 focus:border-[#0A84FF] focus:ring-[#0A84FF] resize-none"
          placeholder="Enter todo description..."
        />
        {errors?.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {/* Priority and Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority */}
        <div className="space-y-2">
          <FormLabel htmlFor="priority" className="text-white">Priority</FormLabel>
          <Select value={form.priority} onValueChange={(value: TodoPriority) => handleChange('priority', value)}>
            <SelectTrigger className="bg-[#2C2C2E] border-[#3A3A3C] text-white focus:border-[#0A84FF] focus:ring-[#0A84FF]">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C] text-white">
              <SelectItem value="low" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">Low</SelectItem>
              <SelectItem value="medium" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">Medium</SelectItem>
              <SelectItem value="high" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">High</SelectItem>
            </SelectContent>
          </Select>
          {errors?.priority && (
            <p className="text-red-500 text-sm">{errors.priority}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <FormLabel htmlFor="status" className="text-white">Status</FormLabel>
          <Select value={form.status} onValueChange={(value: TodoStatus) => handleChange('status', value)}>
            <SelectTrigger className="bg-[#2C2C2E] border-[#3A3A3C] text-white focus:border-[#0A84FF] focus:ring-[#0A84FF]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-[#2C2C2E] border-[#3A3A3C] text-white">
              <SelectItem value="pending" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">Pending</SelectItem>
              <SelectItem value="in_progress" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">In Progress</SelectItem>
              <SelectItem value="completed" className="hover:bg-[#3A3A3C] focus:bg-[#3A3A3C]">Completed</SelectItem>
            </SelectContent>
          </Select>
          {errors?.status && (
            <p className="text-red-500 text-sm">{errors.status}</p>
          )}
        </div>
      </div>

      {/* Labels */}
      {allLabels.length > 0 && (
        <div className="space-y-3">
          <FormLabel className="text-white">Labels</FormLabel>
          <div className="flex flex-wrap gap-2">
            {allLabels.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleLabelToggle(label)}
                className={`transition-all ${form.labels?.some(l => l.id === label.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                style={{ border: 'none', background: 'none', padding: 0 }}
              >
                <TodoLabel
                  name={label.name}
                  color={label.color}
                  onRemove={form.labels?.some(l => l.id === label.id) ? () => handleLabelToggle(label) : undefined}
                />
              </button>
            ))}
          </div>
          {/* Show selected labels */}
          {form.labels && form.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.labels.map(label => (
                <TodoLabel
                  key={label.id}
                  name={label.name}
                  color={label.color}
                  onRemove={() => handleLabelToggle(label)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Checkbox and Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#3A3A3C]">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="completed"
            checked={form.isCompleted}
            onCheckedChange={(checked: boolean) => handleChange('isCompleted', checked)}
            className="border-[#3A3A3C] data-[state=checked]:bg-[#0A84FF] data-[state=checked]:border-[#0A84FF]"
          />
          <FormLabel htmlFor="completed" className="text-white text-sm">Mark as completed</FormLabel>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={processing}
            className="bg-[#0A84FF] hover:bg-[#0A74FF] disabled:bg-[#3A3A3C] disabled:text-gray-400"
          >
            <Save size={16} className="mr-2" />
            {processing ? (submitLabel === 'Create' ? 'Creating...' : 'Updating...') : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-[#3A3A3C] text-white hover:bg-[#3A3A3C]"
          >
            <X size={16} className="mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
