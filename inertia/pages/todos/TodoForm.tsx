
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Label } from '../../components/Label';

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
    labels: initialData?.labels || [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState(false);

  const handleChange = (field: 'title' | 'description' | 'isCompleted' | 'labels', value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
            setForm({ title: '', description: '', isCompleted: false, labels: [] });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200"
            placeholder="Enter todo title..."
            required
          />
          {errors?.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full bg-[#1C1C1E] text-white px-4 py-3 rounded-lg border border-[#3A3A3C] focus:border-[#007AFF] focus:outline-none transition-colors duration-200 resize-none"
            placeholder="Enter todo description..."
          />
          {errors?.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        {/* Labels UI */}
        {allLabels.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Labels</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allLabels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => handleLabelToggle(label)}
                  className={`transition-all ${form.labels?.some(l => l.id === label.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                  style={{ border: 'none', background: 'none', padding: 0 }}
                >
                  <Label
                    name={label.name}
                    color={label.color}
                    onRemove={form.labels?.some(l => l.id === label.id) ? () => handleLabelToggle(label) : undefined}
                  />
                </button>
              ))}
            </div>
            {/* Show selected labels (if any) */}
            {form.labels && form.labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.labels.map(label => (
                  <Label
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
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isCompleted}
              onChange={(e) => handleChange('isCompleted', e.target.checked)}
              className="w-4 h-4 text-[#007AFF] bg-[#1C1C1E] border-[#3A3A3C] rounded focus:ring-[#007AFF] focus:ring-2"
            />
            <label className="text-sm">Mark as completed</label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={processing}
              className="bg-[#007AFF] hover:bg-[#0056CC] disabled:bg-[#3A3A3C] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Save size={16} />
              {processing ? (submitLabel === 'Create' ? 'Creating...' : 'Updating...') : submitLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-[#3A3A3C] hover:bg-[#48484A] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
