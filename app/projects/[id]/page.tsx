'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/app/providers';
import slugify from 'slugify';
import { fakeProjects, FakeProject } from '@/app/fakeData';
import ExportCSVButton from '@/app/components/ExportCSVButton';
import BackButton from '@/app/components/BackButton';
import DeleteModal from '@/app/components/modals/DeleteModal';
import { InvoiceData } from '@/app/types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Pencil, Check } from 'lucide-react';
import InvoiceCard from '@/app/components/InvoiceCard';
import InvoiceFilters, { FilterOptions } from '@/app/components/InvoiceFilters';
import FinancialSummary from '@/app/components/FinancialSummary';

interface Project {
  id: string;
  name: string;
}

interface ProcessedItem {
  id: string;
  invoice_number?: string;
  issue_date?: string;
  buyer_name?: string;
  seller_name?: string;
  raw_data?: InvoiceData[];
  fields?: {
    buyer?: { name: string };
    seller?: { name: string };
    issue_date?: string;
    invoice_number?: string;
    invoice_data?: InvoiceData[];
  };
}


export default function ProjectDetailsPage() {
  const user = useUser();
  const router = useRouter();
  const { id: projectSlug } = useParams() as { id: string };
  
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    if (!supabaseRef.current) {
      const client = createSupabaseBrowserClient();
      if (client) {
        supabaseRef.current = client;
        setSupabase(client);
      }
    }
  }, []);

  const [project, setProject] = useState<Project | null>(null);
  const [processed, setProcessed] = useState<ProcessedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  
  const [editing, setEditing] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [filteredProcessed, setFilteredProcessed] = useState<ProcessedItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    buyer: '',
    seller: '',
    searchTerm: '',
  });

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);

      if (user && supabase) {
        const { data: projects } = await supabase.from('projects').select('id, name');
        const found = projects?.find(
          (p: Project) => slugify(p.name, { lower: true, strict: true }) === projectSlug
        );
        setProject(found || null);

        if (found) {
          const { data: processedData } = await supabase
            .from('processed_data')
            .select('id, invoice_number, issue_date, buyer_name, seller_name, raw_data')
            .eq('project_id', found.id);

          setProcessed(processedData || []);
        } else {
          setProcessed([]);
        }
      } else {
        const fake = fakeProjects.find(
          (p: FakeProject) => slugify(p.name, { lower: true, strict: true }) === projectSlug
        );
        setProject(fake ? { id: fake.id, name: fake.name } : null);
        setProcessed(fake ? fake.processed : []);
      }

      setLoading(false);
    };

    loadProject();
  }, [user, supabase, projectSlug]);

  useEffect(() => {
    if (!processed) return;
    
    let filtered = [...processed];
    
    if (filterOptions.searchTerm) {
      const term = filterOptions.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const invoiceNumber = (item.invoice_number || item.fields?.invoice_number || '').toLowerCase();
        const buyer = (item.buyer_name || item.fields?.buyer?.name || '').toLowerCase();
        const seller = (item.seller_name || item.fields?.seller?.name || '').toLowerCase();
        
        return invoiceNumber.includes(term) || buyer.includes(term) || seller.includes(term);
      });
    }
    
    if (filterOptions.dateRange.start) {
      const startDate = new Date(filterOptions.dateRange.start);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.issue_date || item.fields?.issue_date || '');
        return !isNaN(itemDate.getTime()) && itemDate >= startDate;
      });
    }
    
    if (filterOptions.dateRange.end) {
      const endDate = new Date(filterOptions.dateRange.end);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.issue_date || item.fields?.issue_date || '');
        return !isNaN(itemDate.getTime()) && itemDate <= endDate;
      });
    }
    
    if (filterOptions.buyer) {
      const buyerTerm = filterOptions.buyer.toLowerCase();
      filtered = filtered.filter(item => {
        const buyer = (item.buyer_name || item.fields?.buyer?.name || '').toLowerCase();
        return buyer.includes(buyerTerm);
      });
    }
    
    if (filterOptions.seller) {
      const sellerTerm = filterOptions.seller.toLowerCase();
      filtered = filtered.filter(item => {
        const seller = (item.seller_name || item.fields?.seller?.name || '').toLowerCase();
        return seller.includes(sellerTerm);
      });
    }
    
    if (filterOptions.amountRange.min || filterOptions.amountRange.max) {
      filtered = filtered.filter(item => {
        const invoiceItems = item.raw_data || item.fields?.invoice_data || [];
        let total = 0;
        
        invoiceItems.forEach(invItem => {
          total += parseFloat(invItem.gross) || 0;
        });
        
        const min = filterOptions.amountRange.min ? parseFloat(filterOptions.amountRange.min) : 0;
        const max = filterOptions.amountRange.max ? parseFloat(filterOptions.amountRange.max) : Infinity;
        
        return total >= min && total <= max;
      });
    }
    
    setFilteredProcessed(filtered);
  }, [processed, filterOptions]);

  const handleDelete = async (itemId: string) => {
    if (user && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/processed', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: itemId }),
      });

      if (!res.ok) return;
    } else {
      // Show message for fake data deletion
      alert("This is a demo mode - your invoice is not actually being deleted from a database.");
    }

    setProcessed((prev: ProcessedItem[]) => prev.filter((item: ProcessedItem) => item.id !== itemId));
    setShowDeleteModal(null);
  };
  
  const saveProjectName = async () => {
    if (!project || !projectName.trim() || projectName === project.name) {
      setEditing(false);
      return;
    }
    
    setSaving(true);
    
    if (user && supabase) {
      try {
        await supabase
          .from('projects')
          .update({ name: projectName.trim() })
          .eq('id', project.id);
          
        setProject({ ...project, name: projectName.trim() });
        
        const newSlug = slugify(projectName.trim(), { lower: true, strict: true });
        router.push(`/projects/${newSlug}`);
      } catch (error) {
        console.error('Error updating project name:', error);
        setProjectName(project.name);
      }
    } else {
      setProject({ ...project, name: projectName.trim() });
    }
    
    setSaving(false);
    setEditing(false);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilterOptions(newFilters);
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!project) return <div className="p-8 text-center text-red-400">Project not found.</div>;

  const slug = slugify(project.name, { lower: true, strict: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <BackButton fallbackUrl="/dashboard" />
          <div className="flex items-center gap-2 order-first sm:order-none mb-2 sm:mb-0">
            {editing ? (
              <>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={saving}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProjectName();
                    if (e.key === 'Escape') {
                      setProjectName(project.name);
                      setEditing(false);
                    }
                  }}
                  className="bg-zinc-800 text-white rounded-md px-3 py-1 text-2xl md:text-3xl font-bold border border-zinc-700 focus:border-green-400 focus:outline-none transition"
                />
                <button
                  onClick={saveProjectName}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-md transition"
                >
                  <Check size={20} />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center relative">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    <span className="text-green-400">Project:</span> <span className="text-white">{project.name}</span>
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="ml-2 bg-zinc-700 hover:bg-zinc-600 text-white p-1.5 rounded-full transition hover:shadow-lg hover:shadow-green-900/20"
                    title="Edit project name"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
          <ExportCSVButton
            data={user ? processed : processed.map((item: ProcessedItem) => ({ ...item.fields, id: item.id }))}
            fileName={`${project.name}-processed.csv`}
          />
        </div>

        <FinancialSummary data={processed} />

        <InvoiceFilters onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProcessed.length === 0 ? (
            <div className="col-span-2 text-center text-zinc-400">
              {processed.length > 0 
                ? "No invoices match the current filters." 
                : "No processed items found."}
            </div>
          ) : (
            filteredProcessed.map((item: ProcessedItem) => {
              const invoiceNumber = item.invoice_number || item.fields?.invoice_number || 'N/A';
              const buyer = item.buyer_name || item.fields?.buyer?.name || 'N/A';
              const seller = item.seller_name || item.fields?.seller?.name || 'N/A';
              const date = item.issue_date || item.fields?.issue_date || 'N/A';
              const itemsCount =
                item.raw_data?.length ?? item.fields?.invoice_data?.length ?? 0;

              return (
                <InvoiceCard 
                  key={item.id}
                  id={item.id}
                  invoiceNumber={invoiceNumber}
                  buyer={buyer}
                  seller={seller}
                  date={date}
                  itemsCount={itemsCount}
                  onClick={() => router.push(`/projects/${slug}/processed/${item.id}/edit`)}
                  onDelete={(id) => setShowDeleteModal(id)}
                />
              );
            })
          )}
        </div>

        {showDeleteModal && (
          <DeleteModal
            key={showDeleteModal}
            open={true}
            onClose={() => setShowDeleteModal(null)}
            onConfirm={() => handleDelete(showDeleteModal)}
            title="Delete Invoice"
            description="Are you sure you want to delete this invoice? This action cannot be undone."
          />
        )}
      </div>
    </div>
  );
}
