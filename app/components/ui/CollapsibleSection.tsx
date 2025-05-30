import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isCollapsed,
  onToggle,
  children
}) => {
  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
      <div 
        className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
        onClick={onToggle}
      >
        <h3 className="text-lg sm:text-xl font-bold text-green-400">{title}</h3>
        <button className="text-green-400 hover:text-green-300 transition-colors">
          {isCollapsed ? <ChevronDown size={20} className="sm:w-6 sm:h-6" /> : <ChevronUp size={20} className="sm:w-6 sm:h-6" />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-zinc-700/30">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection; 