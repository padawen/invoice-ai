import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId, projectId } = await req.json();
  
  if (!itemId || !projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabase
    .from('processed_data')
    .select('id')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from('processed_data')
    .update({ project_id: projectId })
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 