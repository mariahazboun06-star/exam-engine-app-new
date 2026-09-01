"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

interface TopicStat {
  id: string;
  topic_name: string;
  appearanceCount: number;
  probability: number;
  priority: "גבוהה מאוד" | "בינונית" | "נמוכה";
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [courseName, setCourseName] = useState("");
  const [stats, setStats] = useState<TopicStat[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const calculateAnalytics = async () => {
      try {
        const { data: course } = await supabase
          .from("courses")
          .select("course_name")
          .eq("id", courseId)
          .single();

        if (course) setCourseName(course.course_name);

        const { data: topics } = await supabase
          .from("course_topics")
          .select("id, topic_name")
          .eq("course_id", courseId);

        const { data: exams } = await supabase
          .from("course_files")
          .select("id")
          .eq("course_id", courseId)
          .eq("file_type", "exam");

        const { data: questions } = await supabase
          .from("exam_questions")
          .select("topic_id, exam_file_id")
          .eq("course_id", courseId);

        const examsCount = exams?.length || 1;
        setTotalExams(examsCount);

        if (topics && questions) {
          const calculatedStats: TopicStat[] = topics.map((t) => {
            const uniqueExamsWithTopic = new Set(
              questions.filter((q) => q.topic_id === t.id).map((q) => q.exam_file_id)
            ).size;

            const prob = Math.min(
              100,
              Math.round((uniqueExamsWithTopic / examsCount) * 100)
            );

            let priority: "גבוהה מאוד" | "בינונית" | "נמוכה" = "נמוכה";
            if (prob >= 75) priority = "גבוהה מאוד";
            else if (prob >= 40) priority = "בינונית";

            return {
              id: t.id,
              topic_name: t.topic_name,
              appearanceCount: uniqueExamsWithTopic,
              probability: prob,
              priority,
            };
          });

          calculatedStats.sort((a, b) => b.probability - a.probability);
          setStats(calculatedStats);
        }
      } catch (err) {
        console.error("שגיאה בחישוב האנליטיקה:", err);
      } finally {
        setLoading(false);
      }
    };

    calculateAnalytics();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <p className="text-gray-600 font-medium">מחשב הסתברויות ובונה את תחזית הבחינה...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              תחזית וניתוח סטטיסטי: {courseName || "הקורס שלך"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              מבוסס על ניתוח AI של {totalExams} מבחני עבר ומיפוי השאלות
            </p>
          </div>
          <button
            onClick={() => (window.location.href = `/matrix?courseId=${courseId}`)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg transition"
          >
            ← חזרה למטריצה
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-3">
            הסתברות הופעת נושאים במבחן הקרוב
          </h2>

          <div className="space-y-4">
            {stats.map((item, idx) => {
              const barColor =
                item.probability >= 75
                  ? "bg-red-500"
                  : item.probability >= 40
                  ? "bg-amber-500"
                  : "bg-blue-400";

              const badgeColor =
                item.priority === "גבוהה מאוד"
                  ? "bg-red-100 text-red-800"
                  : item.priority === "בינונית"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-200 text-gray-700";

              return (
                <div key={item.id} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="font-bold text-gray-400 text-sm">#{idx + 1}</span>
                      <span className="font-semibold text-gray-800">{item.topic_name}</span>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                        עדיפות: {item.priority}
                      </span>
                      <span className="text-sm font-bold text-blue-600">{item.probability}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${item.probability}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">טוען נתונים...</div>}>
      <DashboardContent />
    </Suspense>
  );
}