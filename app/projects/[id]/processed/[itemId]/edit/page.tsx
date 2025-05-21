'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/app/providers';
import slugify from 'slugify';
import EditableFields from '@/app/components/EditableFields';
import SaveButton from '@/app/components/SaveButton';
import BackButton from '@/app/components/BackButton';
import { fakeProjects, FakeProcessedItem } from '@/app/fakeData';
import type { EditableInvoice } from '@/app/types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Project {
  id: string;
  name: string;
}

export default function EditProcessedItemPage() {
  const user = useUser();
  const { id: slug, itemId } = useParams() as { id: string; itemId: string };
  
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

  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user && supabase) {
          const { data: projects, error: projErr } = await supabase
            .from('projects')
            .select('id, name');

          if (projErr || !projects) throw projErr;

          const project = projects.find(
            (p: Project) => slugify(p.name, { lower: true, strict: true }) === slug
          );
          if (!project) throw new Error('Project not found');

          setProjectName(project.name);

          const { data, error: itemErr } = await supabase
            .from('processed_data')
            .select(
              'id, seller_name, seller_address, seller_tax_id, seller_email, seller_phone, buyer_name, buyer_address, buyer_tax_id, invoice_number, issue_date, fulfillment_date, due_date, payment_method, raw_data'
            )
            .eq('id', itemId)
            .eq('project_id', project.id)
            .single();

          if (itemErr || !data) throw itemErr;

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
            invoice_data: data.raw_data || [],
          });
          setLoading(false);
        } else if (!user) {
          try {
            const fake = fakeProjects.find(
              (p) => slugify(p.name, { lower: true, strict: true }) === slug
            );
            if (!fake) throw new Error('Project not found');
            
            setProjectName(fake.name);

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
  }, [user, supabase, slug, itemId]);

  const handleSave = async () => {
    if (!fields) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      if (user && supabase) {
        const { error } = await supabase
          .from('processed_data')
          .update({
            seller_name: fields.seller.name,
            seller_address: fields.seller.address,
            seller_tax_id: fields.seller.tax_id,
            seller_email: fields.seller.email,
            seller_phone: fields.seller.phone,
            buyer_name: fields.buyer.name,
            buyer_address: fields.buyer.address,
            buyer_tax_id: fields.buyer.tax_id,
            invoice_number: fields.invoice_number,
            issue_date: fields.issue_date,
            fulfillment_date: fields.fulfillment_date,
            due_date: fields.due_date,
            payment_method: fields.payment_method,
            raw_data: fields.invoice_data,
          })
          .eq('id', itemId);

        if (error) throw error;
      } else {
        const fake = fakeProjects.find(
          (p) => slugify(p.name, { lower: true, strict: true }) === slug
        );
        const item = fake?.processed.find((i: FakeProcessedItem) => i.id === itemId);
        if (item) item.fields = fields;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const fallbackUrl = `/projects/${slugify(projectName, { lower: true, strict: true })}`;

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!fields) return <div className="p-8 text-center text-red-400">Processed item not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
      <div className="w-full max-w-7xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-8 border border-zinc-800 backdrop-blur-md">
        <div className="mb-8 flex flex-col sm:flex-row items-center">
          <BackButton fallbackUrl={fallbackUrl} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-green-400 flex-1 mt-4 sm:mt-0">
            Edit Processed Data{projectName ? ` — ${projectName}` : ''}
          </h1>
        </div>

        <EditableFields fields={fields} onChange={setFields} />

        <div className="flex gap-4 justify-end mt-10">
          <SaveButton isSaving={saving} onSave={handleSave} />
        </div>

        {success && <div className="mt-4 text-green-400 text-center">Saved!</div>}
        {error && <div className="mt-4 text-red-400 text-center">{error}</div>}
      </div>
    </div>
  );
}
