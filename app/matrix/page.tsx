"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

interface Topic {
  id: string;
  topic_name: string;
}

interface ExamFile {
  id: string;
  file_name: string;
}

interface Question {
  id: string;
  topic_id: string;
  exam_file_id: string;
  question_number: number;
  points: number;
}

function MatrixContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const loadMatrixData = async () => {
      try {
        const { data: topicsData } = await supabase
          .from("course_topics")
          .select("id, topic_name")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        const { data: examsData } = await supabase
          .from("course_files")
          .select("id, file_name")
          .eq("course_id", courseId)
          .eq("file_type", "exam");

        const { data: questionsData } = await supabase
          .from("exam_questions")
          .select("*")
          .eq("course_id", courseId);

        setTopics(topicsData || []);
        setExams(examsData || []);

        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData);
        } else {
          setParsing(true);
          const res = await fetch("/api/ai/parse-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId }),
          });

          if (res.ok) {
            const { data: newQuestions } = await supabase
              .from("exam_questions")
              .select("*")
              .eq("course_id", courseId);
            setQuestions(newQuestions || []);
          }
        }
      } catch (err) {
        console.error("שגיאה בטעינת נתוני מטריצה:", err);
      } finally {
        setLoading(false);
        setParsing(false);
      }
    };

    loadMatrixData();
  }, [courseId]);

  const getQuestionsForCell = (topicId: string, examId: string) => {
    return questions.filter(
      (q) => q.topic_id === topicId && q.exam_file_id === examId
    );
  };

  if (loading || parsing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-700 font-medium">
            {parsing ? "מפרק מבחנים לשאלות ומשייך לנושאים..." : "טוען מטריצה..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6" dir="rtl">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">מטריצת מיפוי השאלות</h1>
            <p className="text-sm text-gray-500">
              פירוק כל מבחן לשאלות והתאמתן לנושאי הקורס
            </p>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
            זיהה {questions.length} שאלות במבחנים
          </span>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-3 border-l min-w-[200px]">נושא הקורס</th>
                {exams.map((exam) => (
                  <th key={exam.id} className="p-3 text-center border-l min-w-[130px]">
                    {exam.file_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800 border-l">{topic.topic_name}</td>
                  {exams.map((exam) => {
                    const matchedQuestions = getQuestionsForCell(topic.id, exam.id);
                    return (
                      <td key={exam.id} className="p-3 text-center border-l">
                        {matchedQuestions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {matchedQuestions.map((q) => (
                              <span
                                key={q.id}
                                className="bg-blue-100 text-blue-700 font-semibold text-xs px-2 py-1 rounded"
                              >
                                שאלה {q.question_number}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => (window.location.href = `/dashboard?courseId=${courseId}`)}
          className="mt-8 w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition"
        >
          עבור לדשבורד הניתוח והתחזיות הסטטיסטיות ←
        </button>
      </div>
    </div>
  );
}

export default function MatrixPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">טוען מטריצה...</div>}>
      <MatrixContent />
    </Suspense>
  );
}