import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';
import { InvoiceData } from '@/app/types';

// Function to convert various date formats to ISO format (YYYY-MM-DD)
const convertToISODate = (dateString: string): string | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    // Handle Hungarian format: "2025. 03. 31."
    if (dateString.includes('.')) {
      const cleaned = dateString.replace(/\./g, '').trim();
      const parts = cleaned.split(' ').filter(part => part.length > 0);
      
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Validate the date
        const testDate = new Date(isoDate);
        if (!isNaN(testDate.getTime())) {
          return isoDate;
        }
      }
    }
    
    // Handle other formats by trying to parse directly
    const testDate = new Date(dateString);
    if (!isNaN(testDate.getTime())) {
      return testDate.toISOString().split('T')[0]; // Get YYYY-MM-DD part
    }
    
    return null;
  } catch (error) {
    console.warn('Date conversion failed for:', dateString, error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    console.error('No authorization token provided');
    return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
  }

  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { fields, project } = body;

    if (!fields || !project) {
      console.error('Missing required fields:', { fields: !!fields, project: !!project });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!fields.seller?.name) {
      console.error('Seller name is required but missing');
      return NextResponse.json({ error: 'Seller name is required' }, { status: 400 });
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', project)
      .eq('user_id', user.id)
      .single();

    if (projectError) {
      console.error('Project query error:', projectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!projectData) {
      console.error('Project not found:', project);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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
      raw_data: invoice_data || []
    };

    if (seller.address) insertData.seller_address = seller.address;
    if (seller.tax_id) insertData.seller_tax_id = seller.tax_id;
    if (seller.email) insertData.seller_email = seller.email;
    if (seller.phone) insertData.seller_phone = seller.phone;
    
    if (buyer?.name) insertData.buyer_name = buyer.name;
    if (buyer?.address) insertData.buyer_address = buyer.address;
    if (buyer?.tax_id) insertData.buyer_tax_id = buyer.tax_id;
    
    if (invoice_number) insertData.invoice_number = invoice_number;
    if (issue_date) insertData.issue_date = convertToISODate(issue_date);
    if (fulfillment_date) insertData.fulfillment_date = convertToISODate(fulfillment_date);
    if (due_date) insertData.due_date = convertToISODate(due_date);
    if (payment_method) insertData.payment_method = payment_method;
    if (currency) insertData.currency = currency;

    const { data: insertedData, error: insertError } = await supabase
      .from('processed_data')
      .insert(insertData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ 
        error: 'Database insert failed', 
        details: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      id: insertedData?.id,
      projectId: projectData.id,
      projectName: project
    });
  } catch (err) {
    console.error('Save error:', err);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
