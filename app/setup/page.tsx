"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export default function SetupPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // קבצים
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [summaryFiles, setSummaryFiles] = useState<FileList | null>(null);

  // מצבי טעינה והודעות
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [uploadingSummaries, setUploadingSummaries] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // שליפת כל הקורסים הקיימים במערכת
  const fetchCourses = async () => {
    setLoadingCourses(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCourses(data);
      if (data.length > 0 && !activeCourseId) {
        setActiveCourseId(data[0].id);
      }
    }
    setLoadingCourses(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // יצירת קורס חדש
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName) return;

    setCreating(true);
    setStatusMessage(null);

    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({ name: courseName, code: courseCode })
        .select()
        .single();

      if (error) throw error;

      setStatusMessage(`✅ הקורס "${data.name}" נוצר בהצלחה!`);
      setCourseName("");
      setCourseCode("");
      setActiveCourseId(data.id);
      await fetchCourses();
    } catch (err: any) {
      setStatusMessage(`❌ שגיאה ביצירת הקורס: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // העלאת סילבוס
  const handleUploadSyllabus = async (cId: string) => {
    if (!syllabusFile) return;
    setUploadingSyllabus(true);
    setStatusMessage("מנתח סילבוס ומחלץ נושאים...");

    const formData = new FormData();
    formData.append("courseId", cId);
    formData.append("file", syllabusFile);

    try {
      const res = await fetch("/api/ingest/syllabus", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("✅ הסילבוס עובד ועץ הנושאים חולץ בהצלחה!");
        setSyllabusFile(null);
      } else {
        setStatusMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch {
      setStatusMessage("❌ שגיאה בזמן עיבוד הסילבוס.");
    } finally {
      setUploadingSyllabus(false);
    }
  };

  // העלאת ספר / סיכומים בכתב יד
  const handleUploadSummaries = async (cId: string) => {
    if (!summaryFiles || summaryFiles.length === 0) return;
    setUploadingSummaries(true);
    setStatusMessage("מפענח כתב יד ומאחד את ספר הקורס והסיכומים...");

    const formData = new FormData();
    formData.append("courseId", cId);
    Array.from(summaryFiles).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/ingest/summaries", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("✅ הסיכומים וספר הקורס פוענחו ונשמרו בהצלחה!");
        setSummaryFiles(null);
      } else {
        setStatusMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch {
      setStatusMessage("❌ שגיאה בפענוח הסיכומים.");
    } finally {
      setUploadingSummaries(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 dir-rtl space-y-8" dir="rtl">
      {/* כותרת ראשית */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          ⚙️ הקמת קורס והעלאת חומרי לימוד
        </h1>
        <p className="text-xs text-gray-500">
          הגדירו את הקורס והעלו סילבוס, מבחנים וסיכומים (כולל סריקות בכתב יד) לבניית מאגר הידע.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 text-center shadow-sm">
          {statusMessage}
        </div>
      )}

      {/* טופס יצירת קורס חדש */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-800">1. פרטי הקורס</h2>
        <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="שם הקורס (למשל: פיזיקה)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="p-3 border rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="מספר / קוד הקורס (למשל: 11111111111)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="p-3 border rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl p-3 transition shadow-md"
          >
            {creating ? "יוצר קורס..." : "צור קורס חדש"}
          </button>
        </form>
      </div>

      {/* רשימת הקורסים שהוקמו במערכת */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
          📚 הקורסים הפעילים במערכת ({courses.length})
        </h2>

        {loadingCourses ? (
          <div className="text-center py-8 text-xs text-gray-500">טוען קורסים...</div>
        ) : courses.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border text-xs text-gray-500">
            עדיין לא הוקמו קורסים. הזיני שם ומספר קורס למעלה ולחצי "צור קורס חדש".
          </div>
        ) : (
          courses.map((course) => {
            const isExpanded = activeCourseId === course.id;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                  isExpanded ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
                }`}
              >
                {/* כותרת התיבה: שם הקורס - מספר הקורס */}
                <div
                  onClick={() => setActiveCourseId(isExpanded ? null : course.id)}
                  className="p-5 bg-gradient-to-r from-blue-50/40 to-white flex justify-between items-center cursor-pointer hover:bg-blue-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📖</span>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {course.name} {course.code ? `- ${course.code}` : ""}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        מזהה קורס: {course.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-white border px-3 py-1.5 rounded-xl shadow-sm">
                    {isExpanded ? "סגור חומרים ▲" : "נהל קורס וחלץ חומרים ▼"}
                  </span>
                </div>

                {/* תוכן התיבה - העלאות וגישה לכל הפיצ'רים */}
                {isExpanded && (
                  <div className="p-6 border-t space-y-6 bg-gray-50/30">
                    {/* סרגל קישורים מהירים לפיצ'רים של הקורס */}
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        🚀 פעולות ותרגול עבור קורס זה:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Link
                          href={`/matrix?courseId=${course.id}`}
                          className="bg-white border hover:border-blue-500 p-2.5 rounded-xl text-center text-xs font-bold text-gray-800 shadow-sm transition"
                        >
                          📊 מטריצת שכיחות
                        </Link>
                        <Link
                          href={`/study/focused?courseId=${course.id}`}
                          className="bg-white border hover:border-blue-500 p-2.5 rounded-xl text-center text-xs font-bold text-gray-800 shadow-sm transition"
                        >
                          🎯 תרגול ממוקד
                        </Link>
                        <Link
                          href={`/exam/simulation?courseId=${course.id}`}
                          className="bg-white border hover:border-blue-500 p-2.5 rounded-xl text-center text-xs font-bold text-gray-800 shadow-sm transition"
                        >
                          📝 סימולטור מבחן
                        </Link>
                        <Link
                          href={`/flashcards?courseId=${course.id}`}
                          className="bg-white border hover:border-blue-500 p-2.5 rounded-xl text-center text-xs font-bold text-gray-800 shadow-sm transition"
                        >
                          🎴 פלאשקארטס
                        </Link>
                      </div>
                    </div>

                    {/* טפסי העלאת חומרים לקורס הספציפי הזה */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* העלאת סילבוס */}
                      <div className="bg-white p-4 rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-gray-800">📄 העלאת סילבוס (חילוץ נושאים)</h4>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                          className="block w-full text-[11px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                        />
                        <button
                          onClick={() => handleUploadSyllabus(course.id)}
                          disabled={uploadingSyllabus || !syllabusFile}
                          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold text-xs py-2 rounded-lg transition"
                        >
                          {uploadingSyllabus ? "מנתח..." : "עבד סילבוס"}
                        </button>
                      </div>

                      {/* העלאת ספר קורס / סיכומים בכתב יד */}
                      <div className="bg-white p-4 rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-gray-800">✍️ העלאת ספר/סיכומים בכתב יד</h4>
                        <input
                          type="file"
                          multiple
                          accept="application/pdf,image/*"
                          onChange={(e) => setSummaryFiles(e.target.files)}
                          className="block w-full text-[11px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                        />
                        <button
                          onClick={() => handleUploadSummaries(course.id)}
                          disabled={uploadingSummaries || !summaryFiles}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs py-2 rounded-lg transition"
                        >
                          {uploadingSummaries ? "מפענח..." : "העלה ופענח סיכומים"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}