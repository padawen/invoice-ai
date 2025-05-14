import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing processed item id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('processed_data')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
