import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { createProjectRequestSchema, deleteProjectRequestSchema, formatZodError } from '@/lib/validations';

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

  return NextResponse.json({ projects: data.map((p: { name: string }) => p.name) });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate request body with Zod
    const validationResult = createProjectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatZodError(validationResult.error),
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    const { error: insertError } = await supabase
      .from('projects')
      .insert({ name, user_id: user.id });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Create project error', err);
    return NextResponse.json(
      {
        error: 'Failed to create project',
        ...(process.env.NODE_ENV === 'development' && {
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate request body with Zod
    const validationResult = deleteProjectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatZodError(validationResult.error),
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Delete associated processed data first
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
  } catch (err) {
    logger.error('Delete project error', err);
    return NextResponse.json(
      {
        error: 'Failed to delete project',
        ...(process.env.NODE_ENV === 'development' && {
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}
