import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TasksPanel from '../TasksPanel';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsUpdated?: (newBalance: number) => void;
}

export function TasksModal({ isOpen, onClose, onCoinsUpdated }: TasksModalProps) {
  const { user } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f0826] rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-lg font-semibold">Tasks</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/60 hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>
        <TasksPanel userId={user.id} onCoinsUpdated={onCoinsUpdated} />
      </div>
    </div>
  );
}

export default TasksModal;
