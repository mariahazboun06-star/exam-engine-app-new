"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "open";
  options?: string[]; // עבור שאלות אמריקאיות
  solution_text?: string;
}

interface ImageGradeResult {
  isCorrect: boolean;
  score: number;
  transcribedText: string;
  feedback: string;
}

export default function ExamSimulationPage() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Record<string, File>>({});
  const [gradingState, setGradingState] = useState<Record<string, boolean>>({});
  const [gradeResults, setGradeResults] = useState<Record<string, ImageGradeResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initExam() {
      const { data: courses } = await supabase.from("courses").select("id").limit(1);
      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }
      const cId = courses[0].id;
      setCourseId(cId);

      const { data: qData } = await supabase.from("exam_questions").select("*");
      if (qData) {
        setQuestions(
          qData.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.options ? "multiple_choice" : "open",
            options: q.options || [],
            solution_text: q.solution_text,
          }))
        );
      }
      setLoading(false);
    }
    initExam();
  }, []);

  const handleFileChange = (questionId: string, file: File | null) => {
    if (file) {
      setSelectedImage((prev) => ({ ...prev, [questionId]: file }));
    }
  };

  const submitHandwrittenSolution = async (questionId: string) => {
    const file = selectedImage[questionId];
    if (!file || !courseId) return;

    setGradingState((prev) => ({ ...prev, [questionId]: true }));

    const formData = new FormData();
    formData.append("questionId", questionId);
    formData.append("courseId", courseId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/exam/grade-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setGradeResults((prev) => ({ ...prev, [questionId]: data }));
      }
    } catch {
      alert("שגיאה בחיבור למנוע בדיקת התמונות.");
    } finally {
      setGradingState((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) return <div className="p-8 text-center dir-rtl" dir="rtl">מכין את סימולציית המבחן...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl space-y-6" dir="rtl">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-amber-900">📝 סימולציית מבחן בזמן אמת</h1>
          <p className="text-xs text-amber-800 mt-0.5">תרגול במבנה המבחן המלא. פתרונות פתוחים ניתן לצלם ולהעלות לבדיקת AI.</p>
        </div>
        <div className="bg-amber-600 text-white font-mono text-sm font-bold px-3 py-1.5 rounded-lg shadow">
          ⏱️ 02:00:00
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b pb-2">
              <span className="font-bold text-sm text-gray-800">שאלה {idx + 1}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {q.question_type === "multiple_choice" ? "אמריקאית" : "שאלה פתוחה"}
              </span>
            </div>

            <p className="text-sm font-medium text-gray-900">{q.question_text}</p>

            {/* שאלות רב בחירתיות */}
            {q.question_type === "multiple_choice" && (
              <div className="space-y-2 pt-2">
                {q.options?.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 text-xs cursor-pointer">
                    <input type="radio" name={`q-${q.id}`} className="text-blue-600" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* שאלות פתוחות - העלאת תמונה */}
            {q.question_type === "open" && (
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed space-y-3">
                <span className="text-xs font-bold text-gray-700 block">📷 העלאת צילום פתרון בכתב יד:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />

                {selectedImage[q.id] && (
                  <button
                    onClick={() => submitHandwrittenSolution(q.id)}
                    disabled={gradingState[q.id]}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
                  >
                    {gradingState[q.id] ? "מפענח ובודק את התמונה..." : "בדוק פתרון מתוך התמונה"}
                  </button>
                )}

                {/* תצוגת משוב והערכת AI למבחן */}
                {gradeResults[q.id] && (
                  <div className={`mt-3 p-4 rounded-lg border text-xs space-y-2 ${gradeResults[q.id].isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex justify-between font-bold">
                      <span>ציון לתשובה: {gradeResults[q.id].score}/100</span>
                      <span>{gradeResults[q.id].isCorrect ? "🟢 תשובה נכונה" : "🔴 טעות בפתרון"}</span>
                    </div>
                    <p className="text-gray-700"><strong>טקסט שפוענח מכתב היד:</strong> {gradeResults[q.id].transcribedText}</p>
                    <p className="text-gray-800"><strong>משוב מנוע הבדיקה:</strong> {gradeResults[q.id].feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}