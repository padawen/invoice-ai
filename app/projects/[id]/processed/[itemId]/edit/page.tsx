'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/app/providers';
import slugify from 'slugify';
import EditableFields from '@/app/components/EditableFields';
import SaveButton from '@/app/components/SaveButton';
import BackButton from '@/app/components/BackButton';
import ProjectSelector from '@/app/components/ProjectSelector';
import { useDirtyFields } from '@/app/hooks/useDirtyFields';
import { AlertTriangle } from 'lucide-react';
import { fakeProjects, FakeProcessedItem } from '@/app/fakeData';
import type { EditableInvoice, InvoiceData } from '@/app/types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Project {
  id: string;
  name: string;
}

export default function EditProcessedItemPage() {
  const user = useUser();
  const router = useRouter();
  const { id: slug, itemId } = useParams() as { id: string; itemId: string };
  
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  const handleFieldChange = useCallback((updated: EditableInvoice) => {
    setFields(updated);
  }, []);

  useEffect(() => {
    if (!supabaseRef.current) {
      const client = createSupabaseBrowserClient();
      if (client) {
        supabaseRef.current = client;
        setSupabase(client);
      }
    }
  }, []);

  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectChanging, setProjectChanging] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isNavigatingAfterSave, setIsNavigatingAfterSave] = useState(false);

  const { hasDirtyChanges, totalChanges } = useDirtyFields(fields || {} as EditableInvoice);

  const handleProjectSelect = (newProjectName: string) => {
    const selectedProject = allProjects.find(p => p.name === newProjectName);
    if (!selectedProject) return;
    
    setSelectedProjectName(newProjectName);
    setSelectedProjectId(selectedProject.id);
  };

  const hasProjectChanged = currentProjectId !== selectedProjectId;

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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingAfterSave) return;
      
      const hasUnsavedChanges = hasDirtyChanges || hasProjectChanged;
      if (!hasUnsavedChanges) return;
      
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return 'You have unsaved changes. Are you sure you want to leave?';
    };

    const handleRouteChange = () => {
      if (isNavigatingAfterSave) return true;
      
      const hasUnsavedChanges = hasDirtyChanges || hasProjectChanged;
      if (!hasUnsavedChanges) return true;
      
      return window.confirm('You have unsaved changes. Are you sure you want to leave?');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const originalPush = router.push;
    router.push = (...args) => {
      if (handleRouteChange()) {
        return originalPush.apply(router, args);
      }
      return Promise.resolve(false);
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.push = originalPush;
    };
  }, [router, isNavigatingAfterSave, hasDirtyChanges, hasProjectChanged]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user && supabase) {
          const { data: projects, error: projErr } = await supabase
            .from('projects')
            .select('id, name');

          if (projErr || !projects) throw projErr;
          
          setAllProjects(projects);

          const project = projects.find(
            (p: Project) => slugify(p.name, { lower: true, strict: true }) === slug
          );
          if (!project) throw new Error('Project not found');

          setCurrentProjectName(project.name);
          setCurrentProjectId(project.id);
          setSelectedProjectName(project.name);
          setSelectedProjectId(project.id);

          const { data, error: itemErr } = await supabase
            .from('processed_data')
            .select(
              'id, project_id, seller_name, seller_address, seller_tax_id, seller_email, seller_phone, buyer_name, buyer_address, buyer_tax_id, invoice_number, issue_date, fulfillment_date, due_date, payment_method, currency, raw_data, extraction_method, extraction_time, user_changes_count'
            )
            .eq('id', itemId)
            .single();

          if (itemErr || !data) throw itemErr;

          if (data.project_id !== project.id) {
            router.push(`/dashboard`);
            throw new Error('Invoice does not belong to this project');
          }

          setFields({
            id: data.id,
            seller: {
              name: data.seller_name,
              address: data.seller_address,
              tax_id: data.seller_tax_id,
              email: data.seller_email,
              phone: data.seller_phone,
            },
            buyer: {
              name: data.buyer_name,
              address: data.buyer_address,
              tax_id: data.buyer_tax_id,
            },
            invoice_number: data.invoice_number,
            issue_date: data.issue_date,
            fulfillment_date: data.fulfillment_date,
            due_date: data.due_date,
            payment_method: data.payment_method,
            currency: data.currency || 'HUF',
            invoice_data: data.raw_data || [],
            extraction_method: data.extraction_method,
            extraction_time: data.extraction_time,
            user_changes_count: data.user_changes_count || 0,
          });
          
          setLoading(false);
        } else if (!user) {
          try {
            const fake = fakeProjects.find(
              (p) => slugify(p.name, { lower: true, strict: true }) === slug
            );
            if (!fake) throw new Error('Project not found');
            
            setCurrentProjectName(fake.name);
            setCurrentProjectId(fake.id);
            setSelectedProjectName(fake.name);
            setSelectedProjectId(fake.id);
            setAllProjects(fakeProjects.map(p => ({ id: p.id, name: p.name })));

            const item = fake.processed.find((i) => i.id === itemId);
            if (!item) throw new Error('Item not found');
            
            setFields({ ...item.fields, id: item.id });
            setLoading(false);
          } catch (fakeErr) {
            console.error('Error with demo data:', fakeErr);
            throw new Error('Failed to load invoice data. Please log in to view real data.');
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      }
    };

    loadData();
  }, [user, supabase, slug, itemId, router]);

  const handleSave = async () => {
    if (!fields) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      if (user && supabase) {
        const updateData: Record<string, string | string[] | number | null | InvoiceData[]> = {};

        if (fields.seller.name) updateData.seller_name = fields.seller.name;
        if (fields.seller.address) updateData.seller_address = fields.seller.address;
        if (fields.seller.tax_id) updateData.seller_tax_id = fields.seller.tax_id;
        if (fields.seller.email) updateData.seller_email = fields.seller.email;
        if (fields.seller.phone) updateData.seller_phone = fields.seller.phone;

        if (fields.buyer.name) updateData.buyer_name = fields.buyer.name;
        if (fields.buyer.address) updateData.buyer_address = fields.buyer.address;
        if (fields.buyer.tax_id) updateData.buyer_tax_id = fields.buyer.tax_id;

        if (fields.invoice_number) updateData.invoice_number = fields.invoice_number;
        if (fields.issue_date) updateData.issue_date = fields.issue_date;
        if (fields.fulfillment_date) updateData.fulfillment_date = fields.fulfillment_date;
        if (fields.due_date) updateData.due_date = fields.due_date;
        if (fields.payment_method) updateData.payment_method = fields.payment_method;
        if (fields.currency) updateData.currency = fields.currency;

        updateData.raw_data = fields.invoice_data;

        const changesCount = totalChanges;
        const currentChangesCount = fields.user_changes_count || 0;
        updateData.user_changes_count = currentChangesCount + changesCount;

        const { error } = await supabase
          .from('processed_data')
          .update(updateData)
          .eq('id', itemId);

        if (error) throw error;

        if (hasProjectChanged) {
          setProjectChanging(true);
          
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          
          if (!token) {
            throw new Error('Authentication token not found');
          }
          
          const response = await fetch('/api/processed/updateProject', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              itemId: fields.id,
              projectId: selectedProjectId
            })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update project');
          }
          
          setCurrentProjectName(selectedProjectName);
          setCurrentProjectId(selectedProjectId);
        }
      } else {
        const fake = fakeProjects.find(
          (p) => slugify(p.name, { lower: true, strict: true }) === slug
        );
        const item = fake?.processed.find((i: FakeProcessedItem) => i.id === itemId);
        if (item) item.fields = fields;
        
        if (hasProjectChanged) {
          setProjectChanging(true);
          setCurrentProjectName(selectedProjectName);
          setCurrentProjectId(selectedProjectId);
        }
      }

      setSuccess(true);
      
      setIsNavigatingAfterSave(true);
      
      setTimeout(() => {
        const targetProjectSlug = hasProjectChanged 
          ? slugify(selectedProjectName, { lower: true, strict: true })
          : slugify(currentProjectName, { lower: true, strict: true });
        router.push(`/projects/${targetProjectSlug}`);
      }, hasProjectChanged ? 1500 : 1000);
      
      setTimeout(() => setSuccess(false), hasProjectChanged ? 4000 : 3000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
      setProjectChanging(false);
    } finally {
      setSaving(false);
    }
  };

  const fallbackUrl = `/projects/${slugify(currentProjectName, { lower: true, strict: true })}`;

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!fields) return <div className="p-8 text-center text-red-400">Processed item not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-2 sm:px-4">
      <div className="w-full max-w-7xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-4 sm:p-8 border border-zinc-800 backdrop-blur-md">
        <div className="mb-8 flex flex-col sm:flex-row items-center">
          <BackButton fallbackUrl={fallbackUrl} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-green-400 flex-1 mt-4 sm:mt-0">
            Edit Processed Data
          </h1>
        </div>

        <EditableFields 
          key={fields.id}
          fields={fields} 
          onChange={handleFieldChange} 
        />

        <div ref={saveRef} className="mt-6 sm:mt-10 bg-zinc-800/60 rounded-xl p-4 sm:p-6 border border-zinc-700/60">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-4">Project Assignment</h3>
              <div className="w-full sm:max-w-md">
                <ProjectSelector 
                  onSelect={handleProjectSelect}
                  initialProject={currentProjectName}
                  isDemo={!user || !supabase}
                />
                
                {hasProjectChanged && (
                  <div className="mt-4 py-3 px-4 bg-amber-900/30 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-amber-400 text-sm">
                        <p className="font-medium">Project change will be applied when you save.</p>
                        <div className="mt-2 text-xs">
                          <div><span className="font-medium">From:</span> {currentProjectName}</div>
                          <div><span className="font-medium">To:</span> {selectedProjectName}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full">
              <SaveButton 
                isSaving={saving || projectChanging} 
                onSave={handleSave} 
                className="w-full"
                isDemo={!user || !supabase}
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="mt-6 py-3 px-4 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-center">
            {projectChanging ? 'Project changed and data saved successfully!' : 'Changes saved successfully!'}
          </div>
        )}

        {error && (
          <div ref={errorRef} className="mt-6 py-3 px-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
