'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EditableFields from '../components/EditableFields';
import ProjectSelector from '../components/ProjectSelector';
import PdfPreviewFrame from '../components/PdfPreviewFrame';
import SaveButton from '../components/SaveButton';
import { AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import type { EditableInvoice } from '../types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import slugify from 'slugify';
import { useProcessing } from '../client-provider';

let clientSideSupabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

const EditPage = () => {
  const router = useRouter();
  const { setIsProcessing } = useProcessing();
  
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientSideSupabase) {
      const client = createSupabaseBrowserClient();
      if (client) {
        clientSideSupabase = client;
        setSupabase(client);
      }
    }
  }, []);
  
  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [project, setProject] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'text' | 'image' | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    setIsProcessing(isReprocessing);
    return () => setIsProcessing(false);
  }, [isReprocessing, setIsProcessing]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = sessionStorage.getItem('openai_json');
        const pdfBase64 = sessionStorage.getItem('pdf_base64');
        const method = sessionStorage.getItem('processing_method');
        
        if (method === 'text') {
          setProcessingMethod('text');
        } else if (method === 'image') {
          setProcessingMethod('image');
        }

        if (!raw || !pdfBase64) {
          setError('No data found. Please upload and process an invoice first.');
          return;
        }

        try {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed === 'object' &&
            Array.isArray(parsed.invoice_data) &&
            parsed.seller &&
            parsed.buyer
          ) {
            setFields({ ...parsed, id: parsed.id || crypto.randomUUID() });
            setPdfUrl(pdfBase64);
          } else {
            setError('Invalid data structure received from AI processing.');
          }
        } catch {
          setError('Failed to parse AI-generated JSON data.');
        }

        if (supabase) {
          const { error: projError } = await supabase.from('projects').select('name');
          if (projError) throw projError;
        }
      } catch {
        setError('Failed to load invoice or projects.');
      }
    };

    if (typeof window !== 'undefined') {
      loadData();
    }
  }, [supabase]);

  // Auto-scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a brief highlight effect
        errorRef.current?.classList.add('animate-pulse');
        setTimeout(() => {
          errorRef.current?.classList.remove('animate-pulse');
        }, 2000);
      }, 100);
    }
  }, [error]);

  const handleSave = async () => {
    if (!project || !fields) {
      setError('Please select a project and provide at least the seller name.');
      return;
    }

    // Validate required fields
    if (!fields.seller || !fields.seller.name) {
      setError('Seller name is required.');
      return;
    }
  
    setIsSaving(true);
    setLocalProcessing(true);
    setError(null);
    setSaveSuccess(false);
  
    try {
      if (!supabase) {
        alert('This is a demo mode - your data is not actually being saved to a database.');
        sessionStorage.removeItem('openai_json');
        sessionStorage.removeItem('pdf_base64');
        
        setSaveSuccess(true);
        setIsSaving(false);
        setLocalProcessing(false);
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }
  
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
  
      if (!token) {
        alert('This is a demo mode - your data is not actually being saved to a database.');
        sessionStorage.removeItem('openai_json');
        sessionStorage.removeItem('pdf_base64');
        
        setSaveSuccess(true);
        setIsSaving(false);
        setLocalProcessing(false);
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }
  
      const response = await fetch('/api/saveProcessedData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields, project }),
      });
  
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save');
        } catch {
          throw new Error(`Failed to save: ${response.statusText}`);
        }
      }
      
      await response.json();
      
      sessionStorage.removeItem('openai_json');
      sessionStorage.removeItem('pdf_base64');
      
      setSaveSuccess(true);
      setIsSaving(false);
      setLocalProcessing(false);
      
      setTimeout(() => {
        const projectSlug = slugify(project, { lower: true, strict: true });
        router.push(`/projects/${projectSlug}`);
      }, 1500);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to save invoice data.');
      setIsSaving(false);
      setLocalProcessing(false);
    }
  };

  const handleReprocessWithImage = async () => {
    if (!pdfUrl) {
      setError('No PDF available for reprocessing.');
      return;
    }
    
    setIsReprocessing(true);
    setError(null);
    
    try {
      const base64Response = await fetch(pdfUrl);
      const blob = await base64Response.blob();
      const file = new File([blob], 'invoice.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      
      const response = await fetch('/api/processImagePDF', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      
      let result;
      
      try {
        const rawText = await response.text();
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse API response. The server may be experiencing issues.');
      }
      
      if (!response.ok) {
        if (result?.fallbackData) {
          setError(`Warning: ${result.error || 'API processing error'}. Using fallback structure.`);
          result = result.fallbackData;
        } else {
          throw new Error(result?.error || 'Failed to reprocess with image method');
        }
      }
      
      if (!result.seller || !result.buyer || !Array.isArray(result.invoice_data)) {
        throw new Error('The API response is missing required invoice data fields');
      }
      
      sessionStorage.setItem('openai_json', JSON.stringify(result));
      sessionStorage.setItem('processing_method', 'image');
      
      setFields({ ...result, id: result.id || crypto.randomUUID() });
      setProcessingMethod('image');
      
    } catch (err) {
      console.error('Reprocessing error:', err);
      setError((err as Error)?.message || 'Failed to reprocess PDF.');
    } finally {
      setIsReprocessing(false);
    }
  };

  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Edit Invoice Data
          </h2>
          <button 
            onClick={toggleExpandedView}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
            title={expandedView ? "Show PDF preview" : "Hide PDF preview"}
          >
            {expandedView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className="hidden sm:inline">{expandedView ? "Show Preview" : "Full Edit View"}</span>
          </button>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* PDF Preview - Sticky */}
          {!expandedView && (
            <div 
              ref={stickyContainerRef}
              className="xl:sticky xl:top-8 w-full xl:w-1/3 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-xl overflow-hidden transition-all"
              style={{ height: 'calc(100vh - 120px)' }}
            >
              {pdfUrl ? 
                <PdfPreviewFrame src={pdfUrl} /> : 
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  No PDF preview
                </div>
              }
            </div>
          )}

          {/* Editable Fields */}
          <div className={`w-full ${expandedView ? 'xl:w-full' : 'xl:w-2/3'} space-y-8`}>
            {error && (
              <div ref={errorRef} className="flex items-center gap-2 text-red-400 bg-red-400/10 px-6 py-4 rounded-xl text-lg">
                <AlertCircle size={24} />
                <span>{error}</span>
              </div>
            )}
            
            {saveSuccess && (
              <div className="py-3 px-4 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-center text-lg">
                Changes saved successfully!
              </div>
            )}

            {processingMethod === 'text' && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-400">
                  This invoice was processed using text-based extraction. If the results aren&apos;t optimal, try image-based extraction.
                </p>
                <button
                  onClick={handleReprocessWithImage}
                  disabled={isReprocessing}
                  className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReprocessing ? 'Processing...' : 'Try Image Method'}
                </button>
              </div>
            )}

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 sm:p-8" ref={itemsContainerRef}>
              {fields ? (
                <EditableFields fields={fields} onChange={setFields} />
              ) : (
                <div className="text-center py-12 text-zinc-400">Loading invoice data...</div>
              )}
            </div>
            
            {/* Project Assignment and Save Section */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Project Assignment</h3>
                  <p className="text-zinc-400 mb-6">Assign this invoice to an existing project or create a new one</p>
                  <div className="max-w-md">
                    <ProjectSelector onSelect={setProject} isDemo={!supabase} />
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-end">
                  <SaveButton
                    isSaving={isSaving}
                    onSave={handleSave}
                    disabled={localProcessing}
                    className="w-full md:w-auto"
                    isDemo={!supabase}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPage;
