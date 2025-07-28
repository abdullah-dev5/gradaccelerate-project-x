// Export allLabels for use in forms/pages
export const allLabels = [
  { id: 1, name: 'Work', color: '#007AFF' },
  { id: 2, name: 'Personal', color: '#34C759' },
  { id: 3, name: 'Urgent', color: '#FF3B30' },
  { id: 4, name: 'Ideas', color: '#AF52DE' },
  { id: 5, name: 'Shopping', color: '#FFD60A' },
  { id: 6, name: 'Travel', color: '#5AC8FA' },
  { id: 7, name: 'Health', color: '#00B894' },
  { id: 8, name: 'Finance', color: '#E17055' },
  { id: 9, name: 'Learning', color: '#6C5CE7' },
  { id: 10, name: 'Family', color: '#FF9500' },
  { id: 11, name: 'Fitness', color: '#27AE60' },
  { id: 12, name: 'Reading', color: '#2980B9' },
  { id: 13, name: 'Important', color: '#C0392B' },
  { id: 14, name: 'Fun', color: '#FF2D55' },
  { id: 15, name: 'Misc', color: '#B2BEC3' },
];
import React from 'react';

interface LabelProps {
  name: string;
  color?: string;
  onRemove?: () => void;
}

// Add more label color examples for demonstration
const LABEL_COLORS = [
  '#6366f1', // Indigo
  '#007AFF', // Blue
  '#34C759', // Green
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#AF52DE', // Purple
  '#FFD60A', // Yellow
  '#5AC8FA', // Light Blue
  '#FF2D55', // Pink
  '#00B894', // Teal
  '#E17055', // Coral
  '#6C5CE7', // Deep Purple
  '#00B8D9', // Cyan
  '#FDCB6E', // Light Yellow
  '#B2BEC3', // Silver
  '#D35400', // Pumpkin
  '#C0392B', // Strong Red
  '#2980B9', // Strong Blue
  '#27AE60', // Strong Green
  '#8E44AD', // Strong Purple
];

export function Label({ name, color = LABEL_COLORS[0], onRemove }: LabelProps) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mr-2 mb-2 shadow-sm transition-colors duration-150"
      style={{
        backgroundColor: color + '20',
        color: color,
        border: `1px solid ${color}40`,
        minWidth: 0,
        maxWidth: '100%',
        cursor: onRemove ? 'pointer' : 'default',
      }}
    >
      <span className="truncate mr-1">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-xs font-bold text-[#98989D] hover:text-red-500 focus:outline-none"
          style={{ lineHeight: 1 }}
          aria-label={`Remove label ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
