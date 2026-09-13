"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Concept {
  id: string;
  concept_name: string;
  description?: string;
  recall_prompt: string;
  recall_answer?: string;
  item_type?: "concept" | "formula" | "theorem";
  detailed_explanation?: string;
  status_color: string;
}

interface TrapQuestion {
  id: string;
  question_number: number;
  question_text: string;
  solution_text: string;
  guidance_notes: string;
}

export default function StudyPage() {
  const [mode, setMode] = useState<"flashcards" | "traps">("flashcards");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [traps, setTraps] = useState<TrapQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [{ data: conceptsData }, { data: trapsData }] = await Promise.all([
      supabase.from("course_concepts").select("*").in("status_color", ["red", "yellow"]),
      supabase.from("exam_questions").select("*").eq("is_trap", true),
    ]);

    setConcepts(conceptsData || []);
    setTraps(trapsData || []);
    setLoading(false);
  }

  const updateConceptStatus = async (id: string, color: "red" | "yellow" | "green") => {
    await supabase.from("course_concepts").update({ status_color: color }).eq("id", id);
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setIsFlipped(false);
  };

  const getItemTypeBadge = (type?: string) => {
    switch (type) {
      case "formula":
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">📐 נוסחה</span>;
      case "theorem":
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">📜 משפט / הגדרה</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">💡 מושג</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center dir-rtl">טוען את מחולל התרגול וה-Flashcards...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 dir-rtl" dir="rtl">
      {/* סרגל ניווט */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => { setMode("flashcards"); setCurrentIndex(0); setIsFlipped(false); }}
          className={`pb-3 px-6 font-semibold text-sm border-b-2 ${
            mode === "flashcards"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🎴 Flashcards דו-צדדיים ({concepts.length})
        </button>
        <button
          onClick={() => { setMode("traps"); setCurrentIndex(0); setIsFlipped(false); }}
          className={`pb-3 px-6 font-semibold text-sm border-b-2 ${
            mode === "traps"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🔥 שאלות פינה ומלכודות ({traps.length})
        </button>
      </div>

      {/* מצב 1: Flashcards דו-צדדיים */}
      {mode === "flashcards" && (
        <div>
          {concepts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500 font-medium">כל הכבוד! אין מושגים או נוסחאות לתרגול 🎉</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* כרטיסייה מתהפכת */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer bg-white rounded-2xl border border-gray-200 p-8 shadow-md hover:shadow-lg transition-all min-h-[300px] flex flex-col justify-between relative"
              >
                <div className="flex justify-between items-center text-xs">
                  {getItemTypeBadge(concepts[currentIndex]?.item_type)}
                  <span className="text-gray-400">
                    כרטיס {currentIndex + 1} מתוך {concepts.length} (לחץ להפיכה 🔄)
                  </span>
                </div>

                <div className="my-auto text-center py-6">
                  {!isFlipped ? (
                    /* צד א': שאלה / נוסחה לרענון */
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-gray-400 block">צד א' - שאלה / זיהוי:</span>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {concepts[currentIndex]?.concept_name}
                      </h2>
                      <p className="text-base text-gray-700 font-medium max-w-xl mx-auto bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        {concepts[currentIndex]?.recall_prompt}
                      </p>
                    </div>
                  ) : (
                    /* צד ב': פתרון / הסבר מפורט */
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-green-600 block">צד ב' - פתרון / הסבר מלא:</span>
                      <div className="text-base font-semibold text-green-900 bg-green-50 p-4 rounded-xl border border-green-200 whitespace-pre-line">
                        {concepts[currentIndex]?.recall_answer || concepts[currentIndex]?.description || "אין תשובה מוגדרת."}
                      </div>
                      {concepts[currentIndex]?.detailed_explanation && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border text-right">
                          💡 <strong>דגשים נוספים:</strong> {concepts[currentIndex]?.detailed_explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-gray-400 border-t pt-3">
                  {isFlipped ? "לחץ שוב כדי לחזור לצד הקדמי" : "לחץ על הכרטיסייה כדי לגלות את התשובה וההסבר"}
                </div>
              </div>

              {/* סרגל משוב וצבעים (מוצג תמיד או לאחר הפיכה) */}
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-700 text-center">איך הייתה השליטה שלך בפריט זה?</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => updateConceptStatus(concepts[currentIndex].id, "red")}
                    className="bg-red-600 text-white text-xs py-2.5 rounded-lg font-semibold hover:bg-red-700"
                  >
                    לא זוכר (אדום 🔴)
                  </button>
                  <button
                    onClick={() => updateConceptStatus(concepts[currentIndex].id, "yellow")}
                    className="bg-yellow-500 text-white text-xs py-2.5 rounded-lg font-semibold hover:bg-yellow-600"
                  >
                    שליטה חלקית (צהוב 🟡)
                  </button>
                  <button
                    onClick={() => updateConceptStatus(concepts[currentIndex].id, "green")}
                    className="bg-green-600 text-white text-xs py-2.5 rounded-lg font-semibold hover:bg-green-700"
                  >
                    שולט מצוין (ירוק 🟢)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* מצב 2: שאלות מלכודת */}
      {mode === "traps" && (
        <div>
          {traps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500 font-medium">לא נמצאו שאלות מלכודת במבחנים.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span>שאלה {currentIndex + 1} מתוך {traps.length}</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                  🔥 שאלת מלכודת
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  שאלה {traps[currentIndex]?.question_number}
                </h3>
                <p className="text-sm bg-gray-50 p-3.5 rounded border text-gray-800">
                  {traps[currentIndex]?.question_text}
                </p>
              </div>

              {!isFlipped ? (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
                >
                  חשוף את המלכודת והפתרון המלא 🔥
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t">
                  {traps[currentIndex]?.guidance_notes && (
                    <div>
                      <h4 className="text-xs font-bold text-amber-800 mb-1">⚠️ איפה המלכודת?</h4>
                      <p className="text-sm bg-amber-50 p-3 rounded border border-amber-200 text-amber-900">
                        {traps[currentIndex]?.guidance_notes}
                      </p>
                    </div>
                  )}

                  {traps[currentIndex]?.solution_text && (
                    <div>
                      <h4 className="text-xs font-bold text-green-800 mb-1">פתרון מודרך:</h4>
                      <p className="text-sm bg-green-50 p-3 rounded border border-green-200 text-green-900 whitespace-pre-line">
                        {traps[currentIndex]?.solution_text}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentIndex((prev) => (prev + 1) % traps.length);
                    }}
                    className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm hover:bg-gray-900"
                  >
                    עבור לשאלת המלכודת הבאה ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}