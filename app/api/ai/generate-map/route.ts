import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { generateCourseKnowledgeMap } from '../../../../lib/services/geminiService';

export async function POST(request: Request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { courseId } = body;
    if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

    // 1. Find the syllabus for this course in the database
    const { data: fileRecord, error: fileError } = await supabase
      .from('course_files')
      .select('storage_path')
      .eq('course_id', courseId)
      .eq('file_type', 'syllabus')
      .single();

    if (fileError || !fileRecord) {
      return NextResponse.json({ error: 'Syllabus not found for this course.' }, { status: 404 });
    }

    // 2. Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('course-materials')
      .download(fileRecord.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download syllabus from storage.' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Process with Gemini
    const knowledgeMapJson = await generateCourseKnowledgeMap(buffer, fileData.type);

    // 4. Save the generated map to Supabase
    const { data: savedMap, error: insertError } = await supabase
      .from('course_knowledge_maps')
      .upsert({
        course_id: courseId,
        user_id: user.id,
        map_data: knowledgeMapJson
      }, { onConflict: 'course_id' })
      .select()
      .single();

    if (insertError) throw new Error("Database insert failed: " + insertError.message);

    // 5. Update the ingestion status
    await supabase.from('course_files').update({ ingestion_status: 'completed' }).eq('course_id', courseId);

    return NextResponse.json({
      message: 'Knowledge map generated successfully.',
      data: savedMap
    }, { status: 200 });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during AI generation.' }, { status: 500 });
  }
}