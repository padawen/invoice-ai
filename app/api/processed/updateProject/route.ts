import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { updateProjectRequestSchema, formatZodError } from '@/lib/validations';

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate request body with Zod
    const validationResult = updateProjectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatZodError(validationResult.error),
        { status: 400 }
      );
    }

    const { itemId, projectId } = validationResult.data;

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
  } catch (err) {
    logger.error('Update project error', err);
    return NextResponse.json(
      {
        error: 'Failed to update project',
        ...(process.env.NODE_ENV === 'development' && {
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
} 