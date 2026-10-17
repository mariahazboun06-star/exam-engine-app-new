import { NextResponse } from "next/server";
import { uploadCourseBatch } from "@/lib/services/ingestionService";
import { generateCourseKnowledgeMap } from "@/lib/services/geminiService";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const courseId = formData.get("courseId") as string;
    const syllabus = formData.get("syllabus") as File;
    const textbook = formData.get("textbook") as File;
    const examsMetadataRaw = formData.get("examsMetadata") as string;

    if (!userId || !courseId || !syllabus || !textbook) {
      return NextResponse.json(
        { error: "Missing required parameters (userId, courseId, syllabus, or textbook)." },
        { status: 400 }
      );
    }

    const examsMetadata: { hasSolutions: boolean; currentLecturer: boolean }[] =
      examsMetadataRaw ? JSON.parse(examsMetadataRaw) : [];

    const examFiles: File[] = [];
    let examIdx = 0;
    while (formData.get(`exam_${examIdx}`)) {
      examFiles.push(formData.get(`exam_${examIdx}`) as File);
      examIdx++;
    }

    const examsPayload = examFiles.map((file, i) => ({
      file,
      hasSolutions: examsMetadata[i]?.hasSolutions ?? false,
      currentLecturer: examsMetadata[i]?.currentLecturer ?? true,
    }));

    // 1. Process storage uploads & DB records via ingestion service
    const uploadRecords = await uploadCourseBatch({
      userId,
      courseId,
      syllabus,
      textbook,
      exams: examsPayload,
    });

    // 2. Extract Syllabus Knowledge Map asynchronously using Gemini AI
    try {
      const syllabusBuffer = Buffer.from(await syllabus.arrayBuffer());
      const knowledgeMap = await generateCourseKnowledgeMap(
        syllabusBuffer,
        syllabus.type || "application/pdf"
      );

      if (knowledgeMap?.topics) {
        for (const [index, topicData] of knowledgeMap.topics.entries()) {
          const { data: insertedTopic } = await supabase
            .from("course_topics")
            .insert({
              course_id: courseId,
              topic_name: topicData.name,
              order_index: index + 1,
              status_color: "red",
            })
            .select()
            .single();

          if (insertedTopic && topicData.concepts) {
            const conceptsToInsert = topicData.concepts.map((c: any) => ({
              topic_id: insertedTopic.id,
              course_id: courseId,
              concept_name: c.name,
              description: c.description || "",
              recall_prompt: c.recallPrompt || `Explain concept: ${c.name}`,
              status_color: "red",
            }));
            await supabase.from("course_concepts").insert(conceptsToInsert);
          }
        }
      }
    } catch (extractionErr) {
      console.warn("Topic extraction warning (non-fatal):", extractionErr);
    }

    return NextResponse.json({
      success: true,
      processedFilesCount: uploadRecords.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process batch course upload." },
      { status: 500 }
    );
  }
}