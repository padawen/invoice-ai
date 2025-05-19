import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId, itemIndex } = await req.json();
  if (!invoiceId || typeof itemIndex !== 'number') {
    return NextResponse.json({ error: 'Missing invoiceId or itemIndex' }, { status: 400 });
  }

  const { data, error: fetchError } = await supabase
    .from('processed_data')
    .select('raw_data')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !data || !Array.isArray(data.raw_data)) {
    return NextResponse.json({ error: 'Invoice not found or invalid format' }, { status: 404 });
  }

  if (itemIndex < 0 || itemIndex >= data.raw_data.length) {
    return NextResponse.json({ error: 'Invalid item index' }, { status: 400 });
  }

  const updatedItems = [...data.raw_data];
  updatedItems.splice(itemIndex, 1);

  const { error: updateError } = await supabase
    .from('processed_data')
    .update({ raw_data: updatedItems })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
