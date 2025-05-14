"use client";

import { useEffect, useState } from "react";
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useParams } from "next/navigation";
import { fakeProjects, FakeProcessedItem } from "@/app/fakeData";
import EditableFields from "@/app/components/EditableFields";
import SaveButton from "@/app/components/SaveButton";
import slugify from 'slugify';
import BackButton from '@/app/components/BackButton';
import type { EditableInvoice } from "@/app/types";

export default function EditProcessedItemPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const params = useParams();
  const projectSlug = params.id as string;
  const itemId = params.itemId as string;
  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user) {
        const { data: allProjects } = await supabase.from('projects').select('id, name');
        const found = allProjects?.find((p: { id: string; name: string }) => slugify(p.name, { lower: true, strict: true }) === projectSlug);
        if (found) {
          setProjectName(found.name);
          const { data } = await supabase
            .from('processed_data')
            .select('id, seller_name, seller_address, seller_tax_id, seller_email, seller_phone, buyer_name, buyer_address, buyer_tax_id, invoice_number, issue_date, fulfillment_date, due_date, payment_method, raw_data')
            .eq('id', itemId)
            .eq('project_id', found.id)
            .single();
          if (data) {
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
          }
        }
      } else {
        const fake = fakeProjects.find(p => slugify(p.name, { lower: true, strict: true }) === projectSlug);
        setProjectName(fake?.name || '');
        const item = fake?.processed.find((i: FakeProcessedItem) => i.id === itemId);
        setFields(item ? { ...item.fields, id: item.id } : null);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, supabase, projectSlug, itemId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      if (user) {
        if (!fields) {
          throw new Error('No fields to update');
        }
        const { error } = await supabase.from('processed_data').update({
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
        }).eq('id', itemId);
        if (error) throw error;
      } else {
        const fake = fakeProjects.find(p => slugify(p.name, { lower: true, strict: true }) === projectSlug);
        const item = fake?.processed.find((i: FakeProcessedItem) => i.id === itemId);
        if (item && fields) {
          item.fields = fields;
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: unknown) {
      console.error('Error fetching item:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch item');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  if (!fields) return <div className="p-8 text-center text-red-400">Processed item not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-10 border border-zinc-800 backdrop-blur-md">
        <div className="mb-6 flex items-center">
          <BackButton fallbackUrl={`/projects/${slugify(projectName, { lower: true, strict: true })}`} />
          <h1 className="text-2xl font-bold text-center text-green-400 flex-1">
            Edit Processed Data{projectName ? ` — ${projectName}` : ''}
          </h1>
        </div>
        <EditableFields fields={fields} onChange={setFields} />
        <div className="flex gap-4 justify-end mt-8">
          <SaveButton isSaving={saving} onSave={handleSave} />
        </div>
        {success && <div className="mt-4 text-green-400 text-center">Saved!</div>}
        {error && <div className="mt-4 text-red-400 text-center">{error}</div>}
      </div>
    </div>
  );
} 