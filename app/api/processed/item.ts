import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
  }
  
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invoiceId, itemIndex } = await req.json();
    
    if (!invoiceId || typeof itemIndex !== 'number') {
      return NextResponse.json({ error: 'Missing invoiceId or itemIndex' }, { status: 400 });
    }

    // First, get the current data
    const { data, error: fetchError } = await supabase
      .from('processed_data')
      .select('raw_data')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!data || !Array.isArray(data.raw_data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    if (itemIndex < 0 || itemIndex >= data.raw_data.length) {
      return NextResponse.json({ error: 'Invalid item index' }, { status: 400 });
    }

    // Update the items array by removing the specified item
    const updatedItems = [...data.raw_data];
    updatedItems.splice(itemIndex, 1);

    // Save the updated items array
    const { error: updateError } = await supabase
      .from('processed_data')
      .update({ raw_data: updatedItems })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Failed to process the request' }, { status: 500 });
  }
}
