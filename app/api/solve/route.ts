import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { questionId, courseId } = await request.json();

    // 1. שליפת השאלה וטקסט ספר הקורס מתוך Supabase
    const [{ data: question }, { data: courseMaterials }] = await Promise.all([
      supabase.from("exam_questions").select("*").eq("id", questionId).single(),
      supabase.from("course_materials").select("content").eq("course_id", courseId),
    ]);

    if (!question || !courseMaterials || courseMaterials.length === 0) {
      return NextResponse.json(
        { error: "לא נמצא טקסט עבור ספר הקורס במסד הנתונים" },
        { status: 400 }
      );
    }

    const textbookText = courseMaterials.map((m) => m.content).join("\n\n");

    // 2. הגדרת מודל Gemini עם הנחיית הסתמכות קשיחה (Strict Grounding)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
        אתה עוזר הוראה אקדמי המבוסס על "הסתמכות קשיחה" (Strict Grounding).
        תפקידך לענות על שאלות ולספק פתרונות אך ורק מתוך טקסט "ספר הקורס" המצורף למטה.
        
        חוקי ברזל:
        1. השתמש אך ורק במידע המופיע מפורשות בטקסט ספר הקורס.
        2. אסור להשתמש בשום ידע חיצוני או הנחות שאינן מופיעות בספר הקורס.
        3. אם הפתרון או הנושא אינם מופיעים בספר הקורס, ענה בדיוק: "הפתרון אינו מופיע בספר הקורס."
        4. לבלב או המצאת מידע (Hallucination) אינה מורשית תחת שום נסיבות.
      `,
    });

    const prompt = `
      ספר הקורס המלא:
      ---
      ${textbookText}
      ---

      השאלה לפתרון:
      ${question.question_text}

      ספק פתרון מפורט והסבר המבוסס 100% על ספר הקורס בלבד.
    `;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({ success: true, answer });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "שגיאה ביצירת פתרון המבוסס על ספר הקורס" },
      { status: 500 }
    );
  }
}