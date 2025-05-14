"use client";

import { useEffect, useState } from "react";
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter, useParams } from "next/navigation";
import { fakeProjects } from "@/app/fakeData";
import slugify from 'slugify';
import ExportCSVButton from '@/app/components/ExportCSVButton';
import BackButton from '@/app/components/BackButton';
import DeleteModal from '@/app/components/DeleteModal';

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
  raw_data?: Array<{
    name: string;
    quantity: string;
    unit_price: string;
    net: string;
    gross: string;
  }>;
  fields?: {
    buyer?: {
      name: string;
    };
    seller?: {
      name: string;
    };
    issue_date?: string;
    invoice_number?: string;
    invoice_data?: Array<{
      name: string;
      quantity: string;
      unit_price: string;
      net: string;
      gross: string;
    }>;
  };
}

export default function ProjectDetailsPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const projectSlug = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [processed, setProcessed] = useState<ProcessedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user) {
        const { data: allProjects } = await supabase.from('projects').select('id, name');
        const found = allProjects?.find((p: { id: string; name: string }) => slugify(p.name, { lower: true, strict: true }) === projectSlug);
        setProject(found || null);
        if (found) {
          const { data: processedData } = await supabase.from('processed_data').select('id, invoice_number, issue_date, buyer_name, seller_name, raw_data').eq('project_id', found.id);
          setProcessed(processedData || []);
        } else {
          setProcessed([]);
        }
      } else {
        const fake = fakeProjects.find(p => slugify(p.name, { lower: true, strict: true }) === projectSlug);
        setProject(fake ? { id: fake.id, name: fake.name } : null);
        setProcessed(fake ? fake.processed : []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, supabase, projectSlug]);

  const handleDelete = async (itemId: string) => {
    if (user) {
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
    setProcessed((prev) => prev.filter((item) => item.id !== itemId));
    setShowDeleteModal(null);
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!project) return <div className="p-8 text-center text-red-400">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <BackButton fallbackUrl="/dashboard" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-400">Project name: {project.name}</h1>
          <ExportCSVButton
            data={user ? processed : processed.map((item) => ({ ...item.fields, id: item.id }))}
            fileName={`${project.name}-processed.csv`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {processed.length === 0 ? (
            <div className="col-span-2 text-center text-zinc-400">No processed items found.</div>
          ) : (
            processed.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-800 rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-zinc-700 hover:border-green-400 transition group relative cursor-pointer"
                onClick={e => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button')) return;
                  router.push(`/projects/${slugify(project.name, { lower: true, strict: true })}/processed/${item.id}/edit`);
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/projects/${slugify(project.name, { lower: true, strict: true })}/processed/${item.id}/edit`); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white truncate">Invoice #{item.invoice_number || item.fields?.invoice_number || 'N/A'}</span>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 bg-zinc-900 border border-red-700 px-3 py-1 rounded-lg shadow transition"
                      onClick={e => { e.stopPropagation(); setShowDeleteModal(item.id); }}
                    >
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-zinc-300 text-sm">
                  <span><span className="font-semibold">Buyer:</span> {item.buyer_name || item.fields?.buyer?.name || 'N/A'}</span>
                  <span><span className="font-semibold">Seller:</span> {item.seller_name || item.fields?.seller?.name || 'N/A'}</span>
                  <span><span className="font-semibold">Date:</span> {item.issue_date || item.fields?.issue_date || 'N/A'}</span>
                  <span><span className="font-semibold">Items:</span> {item.raw_data ? item.raw_data.length : (item.fields?.invoice_data?.length || 0)}</span>
                </div>
                <div className="mt-4 text-xs text-zinc-400 italic">Click on the card to edit/view</div>
                <DeleteModal
                  open={showDeleteModal === item.id}
                  onClose={() => setShowDeleteModal(null)}
                  onConfirm={() => handleDelete(item.id)}
                  title="Delete Invoice"
                  description="Are you sure you want to delete this invoice? This action cannot be undone."
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 