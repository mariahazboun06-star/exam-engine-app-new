import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { parseExamQuestions } from "@/lib/services/geminiService";

export async function POST(request: Request) {
  try {
    const { courseId, examId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // 1. שליפת רשימת הנושאים הקיימים בסילבוס הקורס
    const { data: topics, error: topicsErr } = await supabase
      .from("course_topics")
      .select("id, title")
      .eq("course_id", courseId);

    if (topicsErr || !topics) {
      throw new Error("Failed to fetch course topics for classification");
    }

    // 2. שליפת קובץ המבחן מתוך course_files
    const { data: files } = await supabase
      .from("course_files")
      .select("file_path")
      .eq("course_id", courseId)
      .eq("file_type", "exam")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Exam file not found" }, { status: 404 });
    }

    // 3. הורדת הקובץ מ-Supabase Storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from("course-materials")
      .download(files[0].file_path);

    if (downloadError || !blob) {
      throw new Error("Failed to download exam file");
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // 4. ניתוח וסיווג השאלות בעזרת Gemini
    const questions = await parseExamQuestions(buffer, "application/pdf", topics);

    // 5. שמירת השאלות המסווגות ב-Database
    const questionsToInsert = questions.map((q: any) => ({
      course_id: courseId,
      exam_id: examId || null,
      question_number: q.questionNumber,
      question_text: q.questionText,
      is_trap: q.isTrap || false,
      topic_id: q.topicId || null,
      guidance_notes: q.guidanceNotes || "",
      solution_text: q.solutionText || ""
    }));

    const { data: insertedQuestions, error: insertErr } = await supabase
      .from("exam_questions")
      .insert(questionsToInsert)
      .select();

    if (insertErr) throw insertErr;

    // 6. חישוב ועדכון שכיחות ומשקל הנושאים במבחנים (course_topic_stats)
    const { data: allCourseQuestions } = await supabase
      .from("exam_questions")
      .select("topic_id")
      .eq("course_id", courseId);

    const totalQuestionsCount = allCourseQuestions?.length || 0;

    if (totalQuestionsCount > 0) {
      const countsByTopic: Record<string, number> = {};
      allCourseQuestions?.forEach((q) => {
        if (q.topic_id) {
          countsByTopic[q.topic_id] = (countsByTopic[q.topic_id] || 0) + 1;
        }
      });

      const statsUpserts = Object.keys(countsByTopic).map((tId) => ({
        course_id: courseId,
        topic_id: tId,
        question_count: countsByTopic[tId],
        appearance_percentage: Number(((countsByTopic[tId] / totalQuestionsCount) * 100).toFixed(1))
      }));

      if (statsUpserts.length > 0) {
        await supabase
          .from("course_topic_stats")
          .upsert(statsUpserts, { onConflict: "course_id,topic_id" });
      }
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertedQuestions?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process exam" },
      { status: 500 }
    );
  }
}