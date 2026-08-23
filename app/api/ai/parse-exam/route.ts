import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { extractExamQuestions } from '../../../../lib/services/geminiService';

export async function POST(request: Request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { courseId, fileId } = body;
    if (!courseId || !fileId) return NextResponse.json({ error: 'Missing courseId or fileId' }, { status: 400 });

    // 1. Find the specific exam file in the database
    const { data: fileRecord, error: fileError } = await supabase
      .from('course_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fileError || !fileRecord) {
      return NextResponse.json({ error: 'Exam file not found.' }, { status: 404 });
    }

    // 2. Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('course-materials')
      .download(fileRecord.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download exam from storage.' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Process with Gemini
    const extractedQuestions = await extractExamQuestions(buffer, fileData.type);

    // 4. Save extracted questions to the database
    const questionsToInsert = extractedQuestions.map((q: any) => ({
      course_id: courseId,
      user_id: user.id,
      source_file_id: fileId,
      question_text: q.question_text,
      solution_text: q.solution_text,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    const { error: insertError } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert);

    if (insertError) throw new Error("Database insert failed: " + insertError.message);

    // 5. Update the file's ingestion status
    await supabase.from('course_files').update({ ingestion_status: 'completed' }).eq('id', fileId);

    return NextResponse.json({
      message: `Successfully extracted ${questionsToInsert.length} questions.`,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Exam Parsing Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during exam parsing.' }, { status: 500 });
  }
}