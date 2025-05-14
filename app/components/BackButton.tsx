'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

const BackButton = ({
  fallbackUrl = '/',
  label = 'Back',
  className = '',
}: BackButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-green-400 px-4 py-2 rounded-lg font-semibold shadow transition border border-green-700 ${className}`}
    >
      <ArrowLeft size={20} />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
