"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SetupPage() {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  
  // קבצים
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [summaryFiles, setSummaryFiles] = useState<FileList | null>(null);
  const [examFiles, setExamFiles] = useState<FileList | null>(null);

  // מצבי טעינה והודעות
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // טעינת קורס קיים בכניסה
  useEffect(() => {
    async function loadExistingCourse() {
      const { data: courses } = await supabase.from("courses").select("*").limit(1);
      if (courses && courses.length > 0) {
        setCourseId(courses[0].id);
        setCourseName(courses[0].name);
        setCourseCode(courses[0].code || "");
      }
    }
    loadExistingCourse();
  }, []);

  // 1. יצירה או עדכון קורס
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName) return;

    setLoadingCourse(true);
    try {
      if (courseId) {
        await supabase.from("courses").update({ name: courseName, code: courseCode }).eq("id", courseId);
        setStatusMessage("✅ פרטי הקורס עודכנו בהצלחה!");
      } else {
        const { data, error } = await supabase
          .from("courses")
          .insert({ name: courseName, code: courseCode })
          .select()
          .single();
        if (error) throw error;
        setCourseId(data.id);
        setStatusMessage("✅ הקורס נוצר בהצלחה! כעת ניתן להעלות חומרים.");
      }
    } catch (err: any) {
      setStatusMessage(`❌ שגיאה בשמירת הקורס: ${err.message}`);
    } finally {
      setLoadingCourse(false);
    }
  };

  // 2. עיבוד סילבוס
  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusFile || !courseId) return;

    setLoadingSyllabus(true);
    setStatusMessage("מנתח את הסילבוס ומחלץ את עץ הנושאים...");

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("file", syllabusFile);

    try {
      const res = await fetch("/api/ingest/syllabus", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("✅ הסילבוס עובד בהצלחה ועץ הנושאים נוצר!");
      } else {
        setStatusMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch {
      setStatusMessage("❌ שגיאה בתקשורת בזמן עיבוד הסילבוס.");
    } finally {
      setLoadingSyllabus(false);
    }
  };

  // 3. העלאת סיכומים מרובים ופענוח כתב יד
  const handleUploadSummaries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryFiles || summaryFiles.length === 0 || !courseId) return;

    setLoadingSummaries(true);
    setStatusMessage("מפענח כתב יד ומארגן את הסיכומים ב-AI...");

    const formData = new FormData();
    formData.append("courseId", courseId);
    Array.from(summaryFiles).forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/ingest/summaries", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("✅ כל הסיכומים וכתב היד פוענחו בהצלחה ונשמרו כחומר הקורס!");
      } else {
        setStatusMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch {
      setStatusMessage("❌ שגיאה בתקשורת בזמן פענוח הסיכומים.");
    } finally {
      setLoadingSummaries(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚙️ הקמת קורס והעלאת חומרי לימוד</h1>
        <p className="text-xs text-gray-500 mt-1">
          הגדירו את הקורס והעלו סילבוס, מבחנים וסיכומים (כולל סריקות בכתב יד) לבניית מאגר הידע.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
          {statusMessage}
        </div>
      )}

      {/* שלב 1: פרטי הקורס */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-800">1. פרטי הקורס</h2>
        <form onSubmit={handleSaveCourse} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="שם הקורס (למשל: אלגברה ליניארית)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="p-2 border rounded-lg text-xs w-full"
            required
          />
          <input
            type="text"
            placeholder="קוד קורס (אופציונלי)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="p-2 border rounded-lg text-xs w-full"
          />
          <button
            type="submit"
            disabled={loadingCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg p-2 transition"
          >
            {loadingCourse ? "שומר..." : courseId ? "עדכן פרטי קורס" : "צור קורס חדש"}
          </button>
        </form>
      </div>

      {courseId && (
        <>
          {/* שלב 2: העלאת סילבוס */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800">2. העלאת סילבוס (חילוץ נושאים)</h2>
            <form onSubmit={handleUploadSyllabus} className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                disabled={loadingSyllabus || !syllabusFile}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
              >
                {loadingSyllabus ? "מנתח סילבוס..." : "עבד סילבוס והפק נושאים"}
              </button>
            </form>
          </div>

          {/* שלב 3: העלאת סיכומים מרובים וכתב יד */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">3. ✍️ העלאת סיכומים ومחברות בכתב יד</h2>
              <p className="text-xs text-gray-500 mt-1">
                ניתן להעלות כמות בלתי מוגבלת של קובצי PDF או תמונות. ה-AI יפענח כתב יד ויאחד אותם למאגר הידע המרכזי.
              </p>
            </div>
            <form onSubmit={handleUploadSummaries} className="space-y-4">
              <input
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={(e) => setSummaryFiles(e.target.files)}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                disabled={loadingSummaries || !summaryFiles}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
              >
                {loadingSummaries ? "מפענח כתב יד ומעבד..." : "העלה ופענח סיכומים"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}