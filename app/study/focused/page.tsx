"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Question {
  id: string;
  question_text: string;
  solution_text: string;
  topic_id: string;
}

interface ProgressState {
  attempts_count: number;
  is_first_try_correct: boolean | null;
}

export default function FocusedPracticeWithTracking() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestionsAndProgress() {
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: qData }, { data: pData }] = await Promise.all([
        supabase.from("exam_questions").select("*"),
        user 
          ? supabase.from("user_question_progress").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (qData) setQuestions(qData);

      if (pData) {
        const progressMap: Record<string, ProgressState> = {};
        pData.forEach((p: any) => {
          progressMap[p.question_id] = {
            attempts_count: p.attempts_count || 0,
            is_first_try_correct: p.is_first_try_correct,
          };
        });
        setProgress(progressMap);
      }
      setLoading(false);
    }

    loadQuestionsAndProgress();
  }, []);

  const handleAnswerSubmit = async (questionId: string, isCorrect: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("אנא התחבר למערכת כדי לשמור התקדמות");

    const currentProgress = progress[questionId] || { attempts_count: 0, is_first_try_correct: null };
    const newAttemptsCount = currentProgress.attempts_count + 1;

    const isFirstTryCorrect =
      currentProgress.attempts_count === 0
        ? isCorrect
        : currentProgress.is_first_try_correct;

    const updatedState = {
      attempts_count: newAttemptsCount,
      is_first_try_correct: isFirstTryCorrect,
    };

    setProgress((prev) => ({ ...prev, [questionId]: updatedState }));

    await supabase.from("user_question_progress").upsert(
      {
        user_id: user.id,
        question_id: questionId,
        attempts_count: newAttemptsCount,
        is_first_try_correct: isFirstTryCorrect,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" }
    );
  };

  const getCardStyle = (questionId: string) => {
    const qProgress = progress[questionId];
    if (!qProgress || qProgress.is_first_try_correct === null) {
      return "bg-white border-gray-200";
    }
    if (qProgress.is_first_try_correct === true) {
      return "bg-green-50 border-2 border-green-500 text-green-900";
    }
    return "bg-red-50 border-2 border-red-500 text-red-900";
  };

  if (loading) return <div className="p-8 text-center dir-rtl" dir="rtl">טוען שאלות ומעקב...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎯 תרגול שאלות ומעקב הצלחה בלמידה</h1>
        <p className="text-xs text-gray-500 mt-1">
          תיבות יסומנו ב-🟢 ירוק אם נפתרו נכון בניסיון הראשון, וב-🔴 אדום אם הייתה טעות בניסיון הראשון.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {questions.map((q, idx) => {
          const qStyle = getCardStyle(q.id);
          const currentStatus = progress[q.id];

          return (
            <div
              key={q.id}
              className={`p-5 rounded-xl border transition-all shadow-sm ${qStyle}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm">שאלה {idx + 1}</span>
                {currentStatus?.is_first_try_correct === true && (
                  <span className="bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    🟢 נפתר נכון בול בפעם הראשונה!
                  </span>
                )}
                {currentStatus?.is_first_try_correct === false && (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    🔴 דורש חזרה (לא נפתר נכון בפעם הראשונה)
                  </span>
                )}
              </div>

              <p className="text-sm font-medium mb-4">{q.question_text}</p>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-200/60">
                <span className="text-xs font-semibold">סימון תוצאת תרגול:</span>
                <button
                  onClick={() => handleAnswerSubmit(q.id, true)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  הצלחה (תשובה נכונה)
                </button>
                <button
                  onClick={() => handleAnswerSubmit(q.id, false)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  טעות (תשובה שגויה)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}