import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateCourseKnowledgeMap } from "@/lib/services/geminiService";

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const { data: files } = await supabase
      .from("course_files")
      .select("file_path")
      .eq("course_id", courseId)
      .eq("file_type", "syllabus")
      .limit(1);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Syllabus file not found" }, { status: 404 });
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from("course-materials")
      .download(files[0].file_path);

    if (downloadError || !blob) {
      throw new Error("Failed to download syllabus file");
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const knowledgeMap = await generateCourseKnowledgeMap(buffer, "application/pdf");

    for (const [index, topicData] of knowledgeMap.topics.entries()) {
      // 1. שמירת הנושא הראשי
      const { data: insertedTopic, error: topicError } = await supabase
        .from("course_topics")
        .insert({
          course_id: courseId,
          topic_name: topicData.name,
          order_index: index + 1,
          status_color: 'red'
        })
        .select()
        .single();

      if (topicError || !insertedTopic) continue;

      // 2. שמירת תת-הנושאים (Concepts) המשויכים אליו
      if (topicData.concepts && Array.isArray(topicData.concepts)) {
        const conceptsToInsert = topicData.concepts.map((c: any) => ({
          topic_id: insertedTopic.id,
          course_id: courseId,
          concept_name: c.name,
          description: c.description || '',
          recall_prompt: c.recallPrompt || `הסבר את המושג ${c.name}`,
          status_color: 'red'
        }));

        await supabase.from("course_concepts").insert(conceptsToInsert);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to extract structure" }, { status: 500 });
  }
}