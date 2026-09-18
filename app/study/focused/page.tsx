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
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestionsAndProgress() {
      // 1. שליפת השאלה מתוך מסד הנתונים
      const { data: qData } = await supabase.from("exam_questions").select("*");
      if (qData) setQuestions(qData);

      // 2. שליפת ההתקדמות והצבעים שמורים
      const { data: pData } = await supabase.from("student_progress").select("*");
      if (pData) {
        const progressMap: Record<string, ProgressState> = {};
        pData.forEach((p) => {
          progressMap[p.question_id] = {
            attempts_count: p.attempts_count,
            is_first_try_correct: p.is_first_try_correct,
          };
        });
        setProgress(progressMap);
      }
      setLoading(false);
    }

    loadQuestionsAndProgress();
  }, []);

  // עדכון סטטוס התשובה (נכון / לא נכון)
  const handleAnswerSubmit = async (questionId: string, isCorrect: boolean) => {
    const currentProgress = progress[questionId] || { attempts_count: 0, is_first_try_correct: null };
    const newAttemptsCount = currentProgress.attempts_count + 1;

    // הקביעה האם זה נכון בפעם הראשונה מתרחשת אך ורק בניסיון הראשון (attempts_count == 0)
    const isFirstTryCorrect =
      currentProgress.attempts_count === 0
        ? isCorrect
        : currentProgress.is_first_try_correct;

    const updatedState = {
      attempts_count: newAttemptsCount,
      is_first_try_correct: isFirstTryCorrect,
    };

    // עדכון ב-State המקומי
    setProgress((prev) => ({ ...prev, [questionId]: updatedState }));

    // שמירה במסד הנתונים ב-Supabase
    await supabase.from("student_progress").upsert({
      question_id: questionId,
      attempts_count: newAttemptsCount,
      is_first_try_correct: isFirstTryCorrect,
      updated_at: new Date().toISOString(),
    });
  };

  // פונקציית עיצוב צבע התיבה לפי התוצאה
  const getCardStyle = (questionId: string) => {
    const qProgress = progress[questionId];
    if (!qProgress || qProgress.is_first_try_correct === null) {
      return "bg-white border-gray-200"; // ברירת מחדל - טרם נענתה
    }
    if (qProgress.is_first_try_correct === true) {
      return "bg-green-50 border-2 border-green-500 text-green-900"; // 🟢 נכון מפעם ראשונה
    }
    return "bg-red-50 border-2 border-red-500 text-red-900"; // 🔴 לא נכון מפעם ראשונה
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

              {/* אזור בדיקת תשובה */}
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