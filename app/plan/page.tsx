"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DailyTask {
  day: number;
  dateStr: string;
  focusTopics: string[];
  recallConceptsCount: number;
  trapQuestionsCount: number;
  estimatedHours: number;
}

export default function PlanPage() {
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(4);
  const [schedule, setSchedule] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    if (!examDate) {
      alert("נא לבחור תאריך בחינה");
      return;
    }

    setLoading(true);

    // 1. שליפת מושגים הדורשים חזרה (אדום/צהוב) ושאלות מלכודת
    const [{ data: concepts }, { data: traps }] = await Promise.all([
      supabase.from("course_concepts").select("*").in("status_color", ["red", "yellow"]),
      supabase.from("exam_questions").select("*").eq("is_trap", true),
    ]);

    const activeConcepts = concepts || [];
    const activeTraps = traps || [];

    // 2. חישוב הימים שנשארו עד הבחינה
    const today = new Date();
    const target = new Date(examDate);
    const diffTime = Math.max(target.getTime() - today.getTime(), 0);
    const totalDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

    // 3. חלוקת העומס על פני הימים
    const conceptsPerDay = Math.ceil(activeConcepts.length / totalDays);
    const trapsPerDay = Math.ceil(activeTraps.length / totalDays);

    const generatedSchedule: DailyTask[] = [];

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() + i);

      const dayConcepts = activeConcepts.slice(i * conceptsPerDay, (i + 1) * conceptsPerDay);
      const dayTraps = activeTraps.slice(i * trapsPerDay, (i + 1) * trapsPerDay);

      const topicNames = Array.from(
        new Set(dayConcepts.map((c) => c.concept_name))
      ).slice(0, 3);

      generatedSchedule.push({
        day: i + 1,
        dateStr: currentDate.toLocaleDateString("he-IL", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
        }),
        focusTopics: topicNames.length > 0 ? topicNames : ["חזרה כללית וסימולציות"],
        recallConceptsCount: dayConcepts.length,
        trapQuestionsCount: dayTraps.length,
        estimatedHours: Math.min(dailyHours, Math.max(2, dayConcepts.length * 0.5)),
      });
    }

    setSchedule(generatedSchedule);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">מחולל לוח הזמנים החכם ללמידה</h1>
      <p className="text-sm text-gray-600 mb-6">
        בניית לו"ז אופטימלי המבוסס על תאריך המבחן, רמת השליטה במושגים (Active Recall) ושאלות מלכודת.
      </p>

      {/* טופס אילוצים */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">תאריך הבחינה:</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">שעות לימוד זמינות ביום:</label>
          <input
            type="number"
            min="1"
            max="12"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "מחשב תוכנית..." : "צור תוכנית לימודית 📅"}
        </button>
      </div>

      {/* הצגת לוח הזמנים */}
      {schedule.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">תוכנית עבודה יומית מוצעת</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedule.map((task) => (
              <div key={task.day} className="bg-white p-5 rounded-lg border shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-blue-900">יום {task.day} ({task.dateStr})</span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    ⏱️ כ-{task.estimatedHours} שעות
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500">מיקוד עיקרי:</h4>
                  <p className="text-sm font-semibold text-gray-800">
                    {task.focusTopics.join(", ")}
                  </p>
                </div>

                <div className="flex gap-4 text-xs pt-1 border-t text-gray-600">
                  <span>🎴 {task.recallConceptsCount} מושגי Active Recall</span>
                  <span>🔥 {task.trapQuestionsCount} שאלות פינה/מלכודת</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}