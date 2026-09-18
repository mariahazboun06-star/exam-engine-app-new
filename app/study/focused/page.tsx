"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCourseMatrixAndAnalytics, TopicMatrixRow } from "@/lib/services/analyticsService";

interface FocusedQuestion {
  id: string;
  question_number: number;
  question_text: string;
  is_trap: boolean;
  guidance_notes: string;
  solution_text: string;
  topicTitle: string;
}

export default function FocusedStudyPage() {
  const [mandatoryTopics, setMandatoryTopics] = useState<TopicMatrixRow[]>([]);
  const [questions, setQuestions] = useState<FocusedQuestion[]>([]);
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [dynamicSolutions, setDynamicSolutions] = useState<Record<string, string>>({});
  const [loadingSolutions, setLoadingSolutions] = useState<Record<string, boolean>>({});
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFocusedContent() {
      const { data: courses } = await supabase.from("courses").select("id").limit(1);
      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      const currentCourseId = courses[0].id;
      setCourseId(currentCourseId);
      
      const matrixData = await getCourseMatrixAndAnalytics(currentCourseId);
      const mandatory = matrixData.matrixRows.filter((r) => r.isMandatory);
      setMandatoryTopics(mandatory);

      const mandatoryTopicIds = mandatory.map((m) => m.topicId);

      if (mandatoryTopicIds.length > 0) {
        const { data: qData } = await supabase
          .from("exam_questions")
          .select("*")
          .in("topic_id", mandatoryTopicIds);

        if (qData) {
          const formattedQuestions: FocusedQuestion[] = qData.map((q) => {
            const topic = mandatory.find((m) => m.topicId === q.topic_id);
            return {
              id: q.id,
              question_number: q.question_number,
              question_text: q.question_text,
              is_trap: q.is_trap,
              guidance_notes: q.guidance_notes,
              solution_text: q.solution_text,
              topicTitle: topic ? topic.topicTitle : "נושא חובה",
            };
          });
          setQuestions(formattedQuestions);
        }
      }
      setLoading(false);
    }

    loadFocusedContent();
  }, []);

  const toggleSolution = async (questionId: string) => {
    const isCurrentlyShown = showSolution[questionId];
    setShowSolution((prev) => ({ ...prev, [questionId]: !isCurrentlyShown }));

    if (!isCurrentlyShown && !dynamicSolutions[questionId] && courseId) {
      setLoadingSolutions((prev) => ({ ...prev, [questionId]: true }));
      try {
        const res = await fetch("/api/study/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, courseId }),
        });
        const data = await res.json();
        if (data.success) {
          setDynamicSolutions((prev) => ({ ...prev, [questionId]: data.answer }));
        } else {
          setDynamicSolutions((prev) => ({
            ...prev,
            [questionId]: data.error || "לא ניתן היה לגזור פתרון מספר הקורס.",
          }));
        }
      } catch {
        setDynamicSolutions((prev) => ({
          ...prev,
          [questionId]: "שגיאה בתקשורת עם מנוע הפתרונות.",
        }));
      } finally {
        setLoadingSolutions((prev) => ({ ...prev, [questionId]: false }));
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center dir-rtl" dir="rtl">טוען את מנוע התרגול הממוקד...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎯 תרגול ממוקד מתוך ספר הקורס</h1>
        <p className="text-xs text-gray-500 mt-1">
          כל הפתרונות וההסברים נגזרים אך ורק מספרו הרשמי של הקורס.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-700 mb-2">נושאי חובה שנכללים בתרגול:</h2>
        <div className="flex flex-wrap gap-2">
          {mandatoryTopics.length === 0 ? (
            <span className="text-xs text-gray-400">לא זוהו נושאי חובה בסיכון גבוה (80%+ שכיחות).</span>
          ) : (
            mandatoryTopics.map((t) => (
              <span
                key={t.topicId}
                className="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-3 py-1 rounded-full"
              >
                🔥 {t.topicTitle} ({t.appearancePercentage}%)
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-xl border text-gray-500 text-sm">
            אין שאלות מסווגות זמינות עבור נושאי החובה כרגע.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {q.topicTitle}
                  </span>
                  <h3 className="text-base font-bold text-gray-800 mt-2">
                    שאלה {idx + 1}: {q.question_text}
                  </h3>
                </div>
                {q.is_trap && (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-1 rounded">
                    ⚠️ מוקש / מלכודת
                  </span>
                )}
              </div>

              {q.guidance_notes && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                  <strong>💡 דגש AI לשאלה זו:</strong> {q.guidance_notes}
                </div>
              )}

              <div>
                <button
                  onClick={() => toggleSolution(q.id)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {showSolution[q.id] ? "הסתר פתרון" : "📖 הצג פתרון מתוך ספר הקורס ←"}
                </button>

                {showSolution[q.id] && (
                  <div className="mt-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-xs text-gray-800 space-y-2">
                    <strong className="block text-blue-900">פתרון רשמי מספר הקורס:</strong>
                    {loadingSolutions[q.id] ? (
                      <p className="text-gray-500 animate-pulse">שולף פתרון ומצליב מול ספר הקורס...</p>
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed">
                        {dynamicSolutions[q.id] || q.solution_text || "אין פתרון זמין."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}