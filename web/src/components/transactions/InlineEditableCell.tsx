import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface InlineEditableCellProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayRender?: (value: string) => React.ReactNode;
}

const InlineEditableCell: React.FC<InlineEditableCellProps> = ({
  value,
  onSave,
  type = 'text',
  options,
  placeholder = 'Click to edit',
  className = '',
  displayRender,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  if (editing) {
    return (
      <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
        {type === 'select' && options ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              // Auto-save on select change
              setSaving(true);
              onSave(e.target.value).then(() => {
                setEditing(false);
              }).catch(() => {
                setEditValue(value);
              }).finally(() => setSaving(false));
            }}
            onBlur={handleCancel}
            onKeyDown={handleKeyDown}
            className="text-sm border border-brand-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white max-w-[160px]"
            disabled={saving}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              step={type === 'number' ? '0.01' : undefined}
              className="text-sm border border-brand-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-full max-w-[140px]"
              disabled={saving}
              placeholder={placeholder}
            />
            <button
              onClick={handleSave}
              aria-label="Save"
              className="p-0.5 text-green-600 hover:text-green-700"
              tabIndex={-1}
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              className="p-0.5 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer group ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {displayRender ? (
        <div className="group-hover:ring-1 group-hover:ring-brand-200 rounded px-1 -mx-1 transition-all">
          {displayRender(value)}
        </div>
      ) : (
        <span className="text-sm group-hover:ring-1 group-hover:ring-brand-200 rounded px-1 -mx-1 transition-all">
          {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </span>
      )}
    </div>
  );
};

export default InlineEditableCell;
