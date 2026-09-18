import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const questionId = formData.get("questionId") as string;
    const courseId = formData.get("courseId") as string;
    const file = formData.get("file") as File;

    if (!questionId || !file) {
      return NextResponse.json({ error: "יש לספק מזהה שאלה ותמונה לבדיקה" }, { status: 400 });
    }

    // 1. שליפת השאלה וחומרי הקורס הרשמיים ב-Strict Grounding
    const [{ data: question }, { data: courseMaterials }] = await Promise.all([
      supabase.from("exam_questions").select("*").eq("id", questionId).single(),
      supabase.from("course_materials").select("content").eq("course_id", courseId),
    ]);

    const textbookContext = courseMaterials?.map((m) => m.content).join("\n\n") || "";

    // 2. המרת התמונה ל-Base64 ופענוח מול Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
        אתה מעריך אקדמי קפדן במבחן מסכם. תפקידך לבדוק פתרון פתוח שנכתב בכתב יד בתמונה.
        חובת הסתמכות קשיחה (Strict Grounding) אך ורק על ספר הקורס והפתרון הרשמי.

        משימות בדיקה:
        1. פענח את כתב היד בתמונה (דרך הפתרון והתוצאה הסופית).
        2. בדוק את נכונות כל שלבי הדרך המתמטית/לוגית מול חומר הקורס.
        3. החזר מענה במבנה JSON תקין בלבד (ללא טקסט נוסף):
           {
             "isCorrect": boolean,
             "score": number (0-100),
             "transcribedText": "הטקסט והנוסחאות שפענחת מתוך תמונת כתב היד",
             "feedback": "משוב מפורט: איפה הדרך נכונה, איפה הטעות, ואיך נדרש לפתור לפי ספר הקורס"
           }
      `,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type || "image/jpeg",
        },
      },
      `
      שאלת המבחן: ${question?.question_text || ""}
      פתרון הייחוס הרשמי: ${question?.solution_text || ""}
      חומר הקורס הרשמי: ${textbookContext.slice(0, 3000)}
      `,
    ]);

    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedEvaluation = JSON.parse(cleanedJson);

    return NextResponse.json({ success: true, ...parsedEvaluation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "שגיאה בניתוח תמונת הפתרון" },
      { status: 500 }
    );
  }
}