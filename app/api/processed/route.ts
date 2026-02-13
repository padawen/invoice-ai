import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { deleteProcessedItemRequestSchema, formatZodError } from '@/lib/validations';

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate request body with Zod
    const validationResult = deleteProcessedItemRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatZodError(validationResult.error),
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    const { error } = await supabase
      .from('processed_data')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Delete processed item error', err);
    return NextResponse.json(
      {
        error: 'Failed to delete item',
        ...(process.env.NODE_ENV === 'development' && {
          details: err instanceof Error ? err.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}
