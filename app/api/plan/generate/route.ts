import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { courseId, examDate, availableHoursPerDay } = await request.json();

    if (!courseId || !examDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. שליפת נושאים, שכיחות במבחנים וסטטוס מושגים
    const [{ data: topics }, { data: stats }, { data: concepts }] = await Promise.all([
      supabase.from("course_topics").select("id, title").eq("course_id", courseId),
      supabase.from("course_topic_stats").select("topic_id, appearance_percentage, question_count").eq("course_id", courseId),
      supabase.from("course_concepts").select("topic_id, status_color").eq("course_id", courseId)
    ]);

    // 2. חישוב ציון עדיפות לכל נושא (משקל שכיחות במבחן + מושגים לתרגול)
    const prioritizedTopics = (topics || []).map((topic) => {
      const stat = stats?.find((s) => s.topic_id === topic.id);
      const topicConcepts = concepts?.filter((c) => c.topic_id === topic.id) || [];
      const weakConceptsCount = topicConcepts.filter((c) => c.status_color === "red" || c.status_color === "yellow").length;

      const appearanceWeight = stat?.appearance_percentage || 0;
      // נוסחת שקול: שכיחות במבחן כפול 1.5 + כמות מושגים חלשים כפול 2
      const priorityScore = (appearanceWeight * 1.5) + (weakConceptsCount * 2);

      return {
        id: topic.id,
        title: topic.title,
        appearancePercentage: appearanceWeight,
        weakConceptsCount,
        priorityScore
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);

    // 3. יצירת תוכנית מותאמת אישית עם Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an academic study planner assistant.
      Generate an optimized daily study plan leading up to the exam date: ${examDate}.
      Student's daily study limit: ${availableHoursPerDay || 4} hours/day.

      Topic Priorities (Sorted by high exam frequency and student weakness):
      ${JSON.stringify(prioritizedTopics, null, 2)}

      Instructions:
      1. Allocate the highest study hours and earlier schedule slots to topics with high appearancePercentage and priorityScore.
      2. Include active recall sessions for red/yellow flashcards.
      3. Reserve the last 1-2 days before the exam strictly for full exam simulations and trap question reviews.
      4. Return ONLY valid JSON with no markdown syntax.

      Schema format:
      {
        "schedule": [
          {
            "dayNumber": 1,
            "dateLabel": "String",
            "focusTopics": ["Topic Name"],
            "allocatedHours": 4,
            "tasks": ["Task description"]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const planData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      schedule: planData.schedule,
      prioritizedTopics
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate weighted study plan" },
      { status: 500 }
    );
  }
}