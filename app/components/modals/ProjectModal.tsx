'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Plus, X, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import ProjectCreator from './ProjectCreator';
import ProjectList from './ProjectList';

interface ProjectModalProps { 
  isOpen: boolean; 
  onClose: () => void;
  onSelect: (project: string) => void;
  selectedProject: string;
  existingProjects: string[];
}

const ProjectModal = ({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedProject,
  existingProjects
}: ProjectModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; 
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const handleProjectCreated = (project: string) => {
    setSuccess(true);
    onSelect(project);
    onClose();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const filteredProjects = existingProjects.filter(p => 
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all">
      <div 
        ref={modalRef}
        className="w-[95%] max-w-md max-h-[85vh] bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl transform"
        style={{ animation: 'modal-pop 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {isCreating ? (
          <ProjectCreator 
            onCancel={() => setIsCreating(false)}
            onProjectCreated={handleProjectCreated}
            onError={handleError}
            existingProjects={existingProjects}
          />
        ) : (
          <div>
            <div className="p-5 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-green-400">Select Project</h3>
                <button 
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-md transition-colors"
              >
                <Plus size={18} />
                Create New Project
              </button>
            </div>
            
            <ProjectList 
              projects={filteredProjects}
              selectedProject={selectedProject}
              onSelect={(project) => {
                onSelect(project);
                onClose();
              }}
              searchQuery={searchQuery}
            />
          </div>
        )}
      </div>
      
      {/* Display error message */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[101] flex items-center gap-2 text-red-400 bg-zinc-900 border border-red-500/30 px-4 py-3 rounded-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Show success message as a flash notification */}
      {success && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[101] flex items-center gap-2 text-green-400 bg-zinc-900 border border-green-500/30 px-4 py-3 rounded-lg">
          <CheckCircle size={18} />
          <span>Project selected successfully!</span>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes modal-pop {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ProjectModal; 