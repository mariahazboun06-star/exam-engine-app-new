import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { extractExamQuestions } from "@/lib/services/geminiService";

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const { data: topics } = await supabase
      .from("course_topics")
      .select("id, topic_name")
      .eq("course_id", courseId);

    const { data: examFiles } = await supabase
      .from("course_files")
      .select("*")
      .eq("course_id", courseId)
      .eq("file_type", "exam");

    if (!examFiles || examFiles.length === 0) {
      return NextResponse.json({ error: "No exam files found" }, { status: 404 });
    }

    const insertedQuestions = [];

    for (const exam of examFiles) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from("course-materials")
        .download(exam.file_path);

      if (downloadError || !blob) continue;

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsedQuestions = await extractExamQuestions(buffer, "application/pdf");

      const questionsToInsert = parsedQuestions.map((q: any, index: number) => {
        const matchedTopic = topics?.find(
          (t) => t.topic_name.toLowerCase() === q.topic?.toLowerCase()
        );

        return {
          course_id: courseId,
          exam_file_id: exam.id,
          topic_id: matchedTopic ? matchedTopic.id : topics?.[0]?.id || null,
          question_number: index + 1,
          points: 0,
          question_text: q.question_text || "",
          solution_text: q.solution_text || null,
          is_trap: q.is_trap || false,
          guidance_notes: q.guidance_notes || "",
        };
      });

      if (questionsToInsert.length > 0) {
        const { data, error: insertError } = await supabase
          .from("exam_questions")
          .insert(questionsToInsert)
          .select();

        if (!insertError && data) {
          insertedQuestions.push(...data);
        }
      }
    }

    return NextResponse.json({
      success: true,
      questionsCount: insertedQuestions.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to parse exams" },
      { status: 500 }
    );
  }
}