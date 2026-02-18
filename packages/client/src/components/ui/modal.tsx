import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
      <div className={cn('w-full max-w-md glass-card p-6', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ds-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-ds-fg-muted transition-colors hover:text-ds-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ModalFormProps extends ModalProps {
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ModalForm({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = '保存',
  cancelText = '取消',
  isLoading = false,
  className,
}: ModalFormProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay/50 backdrop-blur-sm">
      <div className={cn('w-full max-w-md glass-card p-6', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ds-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-ds-fg-muted transition-colors hover:text-ds-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-fg transition-colors hover:bg-ds-surface-2 focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-ds-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 focus:outline-none focus:ring-2 focus:ring-ds-primary/20 disabled:opacity-50"
            >
              {isLoading ? '保存中...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
