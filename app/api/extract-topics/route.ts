import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // 1. שליפת קובץ הסילבוס של הקורס מתוך בסיס הנתונים
    const { data: files, error: fileError } = await supabase
      .from("course_files")
      .select("*")
      .eq("course_id", courseId)
      .eq("file_type", "syllabus");

    if (fileError || !files || files.length === 0) {
      return NextResponse.json(
        { error: "Syllabus file not found for this course" },
        { status: 404 }
      );
    }

    // 2. זיהוי וחילוץ הנושאים (כאן משתלב מנוע ה-AI לניתוח המסמך)
    // כרגע מוגדרת תבנית נושאים כהדגמה - ניתן לחבר ישירות ל-LLM API
    const extractedTopics = [
      { topic_name: "מבוא ומושגי יסוד", description: "הגדרות בסיסיות ומשפטי עזר", order_index: 1 },
      { topic_name: "אינטגרלים כפולים ומשולשים", description: "חישובי נפחים ושינוי משתנים", order_index: 2 },
      { topic_name: "אינטגרלים קוויים ומשטחִיִים", description: "אינטגרלים מסוג ראשון ושני", order_index: 3 },
      { topic_name: "משפט גאוס ומשפט סטוקס", description: "שימושים ואנליזה וקטורית", order_index: 4 },
      { topic_name: "טורי פורייה וטורי חזקות", description: "התכנסות ופיתוח פונקציות", order_index: 5 },
    ];

    // 3. שמירת הנושאים שחולצו בטבלת course_topics
    const topicsToInsert = extractedTopics.map((item) => ({
      course_id: courseId,
      ...item,
    }));

    const { data: insertedTopics, error: insertError } = await supabase
      .from("course_topics")
      .insert(topicsToInsert)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      topics: insertedTopics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to extract topics" },
      { status: 500 }
    );
  }
}