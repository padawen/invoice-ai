'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EditableFields from '../components/EditableFields';
import ProjectSelector, { ProjectSelectorRef } from '../components/ProjectSelector';
import PdfPreviewFrame from '../components/PdfPreviewFrame';
import SaveButton from '../components/SaveButton';
import { AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import type { EditableInvoice } from '../types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import slugify from 'slugify';
import { Skeleton } from '../components/ui/Skeleton';



const EditPage = () => {
  const router = useRouter();
  const projectSelectorRef = useRef<ProjectSelectorRef>(null);

  const [supabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(() => createSupabaseBrowserClient());
  const [expandedView, setExpandedView] = useState(false);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);



  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [project, setProject] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userChangesCount, setUserChangesCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = sessionStorage.getItem('openai_json');
        const pdfBase64 = sessionStorage.getItem('pdf_base64');
        const extractionMethod = sessionStorage.getItem('extraction_method') as 'openai' | 'privacy' | null;
        const extractionTime = sessionStorage.getItem('extraction_time');

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
            const invoiceData = {
              ...parsed,
              id: parsed.id || crypto.randomUUID(),
              extraction_method: extractionMethod || undefined,
              extraction_time: extractionTime ? parseFloat(extractionTime) : undefined,
              user_changes_count: 0 // Will be updated when user makes changes
            };
            setFields(invoiceData);
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

  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        errorRef.current?.classList.add('animate-pulse');
        setTimeout(() => {
          errorRef.current?.classList.remove('animate-pulse');
        }, 2000);
      }, 100);
    }
  }, [error]);

  const handleSave = async () => {
    if (!fields) {
      setError('Please provide at least the seller name.');
      return;
    }

    if (!fields.seller || !fields.seller.name) {
      setError('Seller name is required.');
      return;
    }

    if (!project) {
      projectSelectorRef.current?.openProjectModal();
      setError('Please select a project to save the invoice.');
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
        body: JSON.stringify({
          fields: { ...fields, user_changes_count: userChangesCount },
          project
        }),
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
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors cursor-pointer"
            title={expandedView ? "Show PDF preview" : "Hide PDF preview"}
          >
            {expandedView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className="hidden sm:inline">{expandedView ? "Show Preview" : "Full Edit View"}</span>
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
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

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 sm:p-8" ref={itemsContainerRef}>
              {fields ? (
                <EditableFields
                  fields={fields}
                  onChange={setFields}
                  onChangesCountUpdate={setUserChangesCount}
                />
              ) : (
                <div className="space-y-6">
                  {/* Seller Section Skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>

                  {/* Buyer Section Skeleton */}
                  <div className="space-y-4 pt-4 border-t border-zinc-700/50">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>

                  {/* Items Section Skeleton */}
                  <div className="space-y-4 pt-4 border-t border-zinc-700/50">
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Project Assignment</h3>
                  <p className="text-zinc-400 mb-6">Assign this invoice to an existing project or create a new one</p>
                  <div className="max-w-md">
                    <ProjectSelector onSelect={setProject} isDemo={!supabase} ref={projectSelectorRef} />
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
