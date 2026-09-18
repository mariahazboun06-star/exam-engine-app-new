import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const courseId = formData.get("courseId") as string;
    const files = formData.getAll("files") as File[];

    if (!courseId || !files || files.length === 0) {
      return NextResponse.json({ error: "יש לספק מזהה קורס וקבצים להעלאה" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
        אתה מומחה OCR ופענוח מסמכים אקדמיים.
        תפקידך לקרוא קבצי סיכום, כולל מחברות בחינה וסיכומים בכתב יד (גם אם הכתב לא קריא לחלוטין).
        
        הנחיות:
        1. תרגם וחלץ את כל הטקסט המופיע במסמך/בתמונה בדיוק מרבי.
        2. ארגן את הטקסט המפוענח בצורה מובנית לפי נושאי לימוד, הגדרות, נוסחאות ודוגמאות.
        3. אל תחסיר פרטים לימודיים.
      `,
    });

    const processedMaterials = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      // שליחת הקובץ (תמונה/PDF) לפענוח כתב יד ב-Gemini
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type || "application/pdf",
          },
        },
        "פענח את כתב היד והטקסט בסיכום זה וסדר אותו כחומר לימוד רשמי לקורס.",
      ]);

      const transcribedText = result.response.text();

      // שמירת המידע המפוענח ב-Supabase
      const { data, error } = await supabase.from("course_materials").insert({
        course_id: courseId,
        material_type: "summary",
        file_name: file.name,
        content: transcribedText,
      }).select().single();

      if (error) throw error;
      processedMaterials.push(data);
    }

    return NextResponse.json({
      success: true,
      message: `עובדו ונשמרו בהצלחה ${processedMaterials.length} סיכומים.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "שגיאה בפענוח ועיבוד הסיכומים" },
      { status: 500 }
    );
  }
}