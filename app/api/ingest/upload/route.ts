import { NextResponse } from 'next/server';
// Using relative paths to fix the module not found error
import { supabase } from '../../../../lib/supabaseClient';
import { validateIngestionBatch } from '../../../../lib/services/ingestionService';

export async function POST(request: Request) {
  try {
    // We removed createClient() and are using the imported 'supabase' instance directly
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const formData = await request.formData();
    const courseId = formData.get('courseId') as string;
    const syllabus = formData.get('syllabus') as File;
    const textbook = formData.get('textbook') as File;
    const examFiles = formData.getAll('exams') as File[];

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId parameter.' }, { status: 400 });
    }

    // Server-side validation check for 20+ exams rule
    const validation = validateIngestionBatch(examFiles.length, !!syllabus, !!textbook);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 422 });
    }

    return NextResponse.json({
      message: 'Batch uploaded and queued for processing successfully.',
      status: 'pending_processing',
      filesCount: 2 + examFiles.length
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error during batch ingestion.' }, { status: 500 });
  }
}