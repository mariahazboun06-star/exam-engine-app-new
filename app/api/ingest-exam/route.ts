import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { parseExamQuestions } from "@/lib/services/geminiService";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const year = parseInt(formData.get("year") as string, 10) || new Date().getFullYear();
    const semester = (formData.get("semester") as string) || "A";
    const testPeriod = (formData.get("testPeriod") as string) || "Moed A";
    const userId = (formData.get("userId") as string) || "user-123";
    const courseId = (formData.get("courseId") as string) || null;
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No exam PDF file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Retrieve course topics for matching context
    let availableTopics: { id: string; title: string }[] = [];
    if (courseId) {
      const { data: topicsData } = await supabase
        .from("course_topics")
        .select("id, topic_name")
        .eq("course_id", courseId);

      if (topicsData) {
        availableTopics = topicsData.map((t) => ({
          id: t.id,
          title: t.topic_name,
        }));
      }
    }

    // 2. Parse exam questions via Gemini AI
    const parsedQuestions = await parseExamQuestions(
      buffer,
      file.type || "application/pdf",
      availableTopics
    );

    // 3. Upload file to Supabase Storage
    const storagePath = `${userId}/${courseId || "default"}/exams/${Date.now()}_${file.name}`;
    await supabase.storage.from("course-materials").upload(storagePath, file);

    // 4. Create Exam Record
    const term = `${semester} - ${testPeriod}`;
    const { data: examData, error: examError } = await supabase
      .from("exams")
      .insert({
        course_id: courseId,
        year,
        term,
      })
      .select()
      .single();

    if (examError || !examData) {
      throw new Error(`Failed to create exam record: ${examError?.message}`);
    }

    // 5. Insert Extracted Questions
    const questionsToInsert = parsedQuestions.map((q: any) => ({
      course_id: courseId,
      exam_id: examData.id,
      topic_id: q.topicId || null,
      question_number: q.questionNumber,
      question_text: q.questionText,
      solution_text: q.solutionText,
      is_trap: Boolean(q.isTrap),
      guidance_notes: q.guidanceNotes || "",
    }));

    if (questionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("exam_questions")
        .insert(questionsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert exam questions: ${insertError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      examId: examData.id,
      extractedQuestionsCount: questionsToInsert.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to ingest exam PDF." },
      { status: 500 }
    );
  }
}