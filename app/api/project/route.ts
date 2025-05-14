import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error: fetchError } = await supabase
    .from('projects')
    .select('name')
    .eq('user_id', user.id);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data.map(p => p.name) });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid project name' }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from('projects')
    .insert({ name, user_id: user.id });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  await supabase.from('processed_data').delete().eq('project_id', id);

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
