'use client';

import { useState, createContext, useContext } from 'react';
import Navbar from './components/Navbar';

type ProcessingContextType = {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  return (
    <ProcessingContext.Provider value={{ isProcessing, setIsProcessing }}>
      <Navbar isProcessing={isProcessing} />
      {children}
    </ProcessingContext.Provider>
  );
} 