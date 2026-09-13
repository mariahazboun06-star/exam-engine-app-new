import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { parseCourseBooklet } from "@/lib/services/geminiService";

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // 1. שליפת קובץ החוברת המעודכן מתוך course_files
    const { data: files } = await supabase
      .from("course_files")
      .select("file_path")
      .eq("course_id", courseId)
      .eq("file_type", "booklet")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Course booklet file not found" }, { status: 404 });
    }

    // 2. הורדת הקובץ מ-Supabase Storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from("course-materials")
      .download(files[0].file_path);

    if (downloadError || !blob) {
      throw new Error("Failed to download booklet file from storage");
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. ניתוח החוברת באמצעות Gemini
    const items = await parseCourseBooklet(buffer, "application/pdf");

    // 4. שליפת topic ברירת מחדל לקישור (או הנושא הראשון)
    const { data: topics } = await supabase
      .from("course_topics")
      .select("id")
      .eq("course_id", courseId)
      .limit(1);

    const defaultTopicId = topics?.[0]?.id || null;

    // 5. הכנת הפריטים לשמירה ב-Database
    const conceptsToInsert = items.map((item: any) => ({
      course_id: courseId,
      topic_id: defaultTopicId,
      concept_name: item.conceptName,
      item_type: item.itemType || "concept",
      recall_prompt: item.recallPrompt,
      recall_answer: item.recallAnswer,
      detailed_explanation: item.detailedExplanation || "",
      description: item.detailedExplanation || "",
      status_color: "red"
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("course_concepts")
      .insert(conceptsToInsert)
      .select();

    if (insertError) {
      throw new Error("Failed to save booklet items: " + insertError.message);
    }

    return NextResponse.json({
      success: true,
      insertedCount: inserted?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process course booklet" },
      { status: 500 }
    );
  }
}