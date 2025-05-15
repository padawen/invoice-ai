'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useUser } from '@/app/providers';
import slugify from 'slugify';

import { fakeProjects, FakeProject } from '@/app/fakeData';
import ExportCSVButton from '@/app/components/ExportCSVButton';
import BackButton from '@/app/components/BackButton';
import DeleteModal from '@/app/components/DeleteModal';
import { InvoiceData } from '@/app/types';

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
  
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!supabaseRef.current) {
        supabaseRef.current = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
      }
      setSupabase(supabaseRef.current);
    }
  }, []);

  const [project, setProject] = useState<Project | null>(null);
  const [processed, setProcessed] = useState<ProcessedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

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
    }

    setProcessed((prev: ProcessedItem[]) => prev.filter((item: ProcessedItem) => item.id !== itemId));
    setShowDeleteModal(null);
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!project) return <div className="p-8 text-center text-red-400">Project not found.</div>;

  const slug = slugify(project.name, { lower: true, strict: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <BackButton fallbackUrl="/dashboard" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-400">Project: {project.name}</h1>
          <ExportCSVButton
            data={user ? processed : processed.map((item: ProcessedItem) => ({ ...item.fields, id: item.id }))}
            fileName={`${project.name}-processed.csv`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {processed.length === 0 ? (
            <div className="col-span-2 text-center text-zinc-400">No processed items found.</div>
          ) : (
            processed.map((item: ProcessedItem) => {
              const invoiceNumber = item.invoice_number || item.fields?.invoice_number || 'N/A';
              const buyer = item.buyer_name || item.fields?.buyer?.name || 'N/A';
              const seller = item.seller_name || item.fields?.seller?.name || 'N/A';
              const date = item.issue_date || item.fields?.issue_date || 'N/A';
              const itemsCount =
                item.raw_data?.length ?? item.fields?.invoice_data?.length ?? 0;

              return (
                <div
                  key={item.id}
                  className="bg-zinc-800 rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-zinc-700 hover:border-green-400 transition group relative"
                  onClick={() => router.push(`/projects/${slug}/processed/${item.id}/edit`)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/projects/${slug}/processed/${item.id}/edit`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold truncate">
                      Invoice #{invoiceNumber}
                    </span>
                    <button
                      className="text-red-400 hover:text-red-300 text-sm border border-red-600 bg-zinc-900 rounded-lg px-3 py-1 shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(item.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-zinc-300">
                    <span><strong>Buyer:</strong> {buyer}</span>
                    <span><strong>Seller:</strong> {seller}</span>
                    <span><strong>Date:</strong> {date}</span>
                    <span><strong>Items:</strong> {itemsCount}</span>
                  </div>
                  <div className="mt-4 text-xs text-zinc-400 italic">Click on the card to edit/view</div>
                </div>
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
