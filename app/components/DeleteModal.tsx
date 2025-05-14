'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

const DeleteModal = ({ open, onClose, onConfirm, title, description }: DeleteModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-zinc-700">
        <h2 className="text-xl font-bold text-red-400 mb-4">{title}</h2>
        <p className="text-zinc-300 mb-6">{description}</p>
        <div className="flex justify-end gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition font-bold"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteModal;
