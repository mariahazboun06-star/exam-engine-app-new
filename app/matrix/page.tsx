"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ExamQuestion {
  id: string;
  course_id: string;
  exam_file_id: string;
  topic_id: string;
  question_number: number;
  question_text?: string;
  solution_text?: string;
  is_trap?: boolean;
  guidance_notes?: string;
}

interface ExamFile {
  id: string;
  file_name: string;
  file_type: string;
}

interface Topic {
  id: string;
  topic_name: string;
}

export default function ExamMatrixPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(null);

  useEffect(() => {
    fetchMatrixData();
  }, []);

  async function fetchMatrixData() {
    setLoading(true);

    const [{ data: topicsData }, { data: examsData }, { data: questionsData }] =
      await Promise.all([
        supabase.from("course_topics").select("id, topic_name").order("order_index"),
        supabase.from("course_files").select("id, file_name, file_type").eq("file_type", "exam"),
        supabase.from("exam_questions").select("*"),
      ]);

    setTopics(topicsData || []);
    setExams(examsData || []);
    setQuestions(questionsData || []);
    setLoading(false);
  }

  const getQuestionsForCell = (topicId: string, examId: string) => {
    return questions.filter(
      (q) => q.topic_id === topicId && q.exam_file_id === examId
    );
  };

  if (loading) {
    return <div className="p-8 text-center dir-rtl">טוען את מטריצת הבחינות והדפוסים...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 dir-rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">מטריצת ניתוח מבחנים ותבניות עומק</h1>
          <p className="text-sm text-gray-600">
            מיפוי השאלות לפי נושאים, זיהוי שאלות פינה/מלכודת ופתרונות מנחים
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-100 border border-blue-400 rounded-full inline-block" />
            שאלה רגילה
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 border border-red-500 rounded-full inline-block" />
            שאלת פינה / מלכודת 🔥
          </span>
        </div>
      </div>

      {/* טבלת המטריצה */}
      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
            <tr>
              <th className="p-3 border-l w-1/4">נושא הקורס</th>
              {exams.map((exam) => (
                <th key={exam.id} className="p-3 border-l text-center">
                  {exam.file_name.replace(".pdf", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id} className="border-b hover:bg-gray-50/50">
                <td className="p-3 font-medium border-l bg-gray-50">{topic.topic_name}</td>
                {exams.map((exam) => {
                  const cellQuestions = getQuestionsForCell(topic.id, exam.id);
                  return (
                    <td key={exam.id} className="p-3 border-l text-center align-top">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {cellQuestions.length === 0 ? (
                          <span className="text-gray-300 text-xs">-</span>
                        ) : (
                          cellQuestions.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => setSelectedQuestion(q)}
                              className={`px-2 py-1 text-xs rounded border transition-all ${
                                q.is_trap
                                  ? "bg-red-100 text-red-700 border-red-400 font-bold hover:bg-red-200"
                                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                              }`}
                            >
                              שאלה {q.question_number}
                              {q.is_trap && " 🔥"}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal הצגת ניתוח שאלה ופתרון */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">שאלה {selectedQuestion.question_number}</h3>
                {selectedQuestion.is_trap && (
                  <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-semibold mt-1">
                    ⚠️ שאלת מלכודת / פינה מכשילה
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {selectedQuestion.question_text && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 mb-1">נוסח השאלה:</h4>
                <p className="text-sm bg-gray-50 p-2.5 rounded border text-gray-800">
                  {selectedQuestion.question_text}
                </p>
              </div>
            )}

            {selectedQuestion.guidance_notes && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 mb-1">היגיון מנחה ודגשים:</h4>
                <p className="text-sm bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                  {selectedQuestion.guidance_notes}
                </p>
              </div>
            )}

            {selectedQuestion.solution_text && (
              <div>
                <h4 className="text-xs font-bold text-green-700 mb-1">פתרון מלא / מחוון:</h4>
                <p className="text-sm bg-green-50 p-2.5 rounded border border-green-200 text-green-900 whitespace-pre-line">
                  {selectedQuestion.solution_text}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedQuestion(null)}
              className="w-full bg-gray-800 text-white py-2 rounded text-sm hover:bg-gray-900 mt-2"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}