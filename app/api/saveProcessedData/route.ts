import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';
import { EditableInvoice, InvoiceData } from '@/app/types';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fields, project } = (await req.json()) as {
      fields: EditableInvoice;
      project: string;
    };

    if (!fields || !project) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', project)
      .eq('user_id', user.id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json({ error: 'Project not found' }, { status: 400 });
    }

    const {
      seller,
      buyer,
      invoice_number,
      issue_date,
      fulfillment_date,
      due_date,
      payment_method,
      currency,
      invoice_data
    } = fields;

    const insertData: Record<string, string | string[] | number | null | InvoiceData[]> = {
      user_id: user.id,
      project_id: projectData.id,
      seller_name: seller.name,
      raw_data: invoice_data
    };

    if (seller.address) insertData.seller_address = seller.address;
    if (seller.tax_id) insertData.seller_tax_id = seller.tax_id;
    if (seller.email) insertData.seller_email = seller.email;
    if (seller.phone) insertData.seller_phone = seller.phone;
    
    if (buyer.name) insertData.buyer_name = buyer.name;
    if (buyer.address) insertData.buyer_address = buyer.address;
    if (buyer.tax_id) insertData.buyer_tax_id = buyer.tax_id;
    
    if (invoice_number) insertData.invoice_number = invoice_number;
    if (issue_date) insertData.issue_date = issue_date;
    if (fulfillment_date) insertData.fulfillment_date = fulfillment_date;
    if (due_date) insertData.due_date = due_date;
    if (payment_method) insertData.payment_method = payment_method;
    if (currency) insertData.currency = currency;

    const { data: insertedData, error: insertError } = await supabase
      .from('processed_data')
      .insert(insertData)
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      id: insertedData?.id,
      projectId: projectData.id,
      projectName: project
    });
  } catch (err) {
    console.error('Save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
