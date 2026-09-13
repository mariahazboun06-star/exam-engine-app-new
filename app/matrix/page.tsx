"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface TopicStat {
  topic_id: string;
  topic_title: string;
  question_count: number;
  appearance_percentage: number;
  questions: {
    id: string;
    question_number: number;
    question_text: string;
    is_trap: boolean;
  }[];
}

export default function MatrixPage() {
  const [stats, setStats] = useState<TopicStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatrixData();
  }, []);

  async function fetchMatrixData() {
    setLoading(true);

    // שליפת הנושאים, השכיחות והשאלות המשויכות
    const [{ data: topics }, { data: topicStats }, { data: questions }] = await Promise.all([
      supabase.from("course_topics").select("id, title"),
      supabase.from("course_topic_stats").select("*"),
      supabase.from("exam_questions").select("id, topic_id, question_number, question_text, is_trap"),
    ]);

    if (topics) {
      const formattedStats: TopicStat[] = topics.map((t) => {
        const stat = topicStats?.find((s) => s.topic_id === t.id);
        const relatedQuestions = questions?.filter((q) => q.topic_id === t.id) || [];

        return {
          topic_id: t.id,
          topic_title: t.title,
          question_count: stat?.question_count || relatedQuestions.length,
          appearance_percentage: stat?.appearance_percentage || 0,
          questions: relatedQuestions,
        };
      });

      // מיוון לפי הנושאים השכיחים ביותר במבחנים
      formattedStats.sort((a, b) => b.appearance_percentage - a.appearance_percentage);
      setStats(formattedStats);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="p-8 text-center dir-rtl" dir="rtl">טוען את מטריצת הנושאים והשכיחויות...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 dir-rtl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 מטריצת שכיחות נושאים במבחנים</h1>
        <p className="text-xs text-gray-500 mt-1">
          ניתוח ה-AI מציג את משקל כל נושא במבחנים שנורו, כדי למקד את הלמידה בנושאים הקריטיים ביותר.
        </p>
      </div>

      <div className="space-y-4">
        {stats.map((item) => (
          <div key={item.topic_id} className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-800">{item.topic_title}</h3>
                <span className="text-xs text-gray-500">
                  סה"כ שאלות שנמצאו: <strong>{item.question_count}</strong>
                </span>
              </div>
              <div className="text-left">
                <span className="inline-block bg-blue-100 text-blue-800 font-extrabold text-sm px-3 py-1 rounded-full">
                  {item.appearance_percentage}% מהמבחנים
                </span>
              </div>
            </div>

            {/* רשימת שאלות מסווגות נושא */}
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">שאלות מסווגות מתוך המבחנים:</h4>
              {item.questions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">טרם סווגו שאלות לנושא זה.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.questions.map((q) => (
                    <div
                      key={q.id}
                      className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                        q.is_trap ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span className="font-medium truncate max-w-[80%]">
                        שאלה {q.question_number}: {q.question_text}
                      </span>
                      {q.is_trap && (
                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          מלכודת 🔥
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}