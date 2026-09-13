"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SetupPage() {
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [bookletFile, setBookletFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 1. יצירת קורס חדש
  const handleCreateCourse = async () => {
    if (!courseName) return alert("נא להזין שם קורס");
    setLoading(true);
    setStatus("יוצר קורס חדש...");

    const { data, error } = await supabase
      .from("courses")
      .insert({ title: courseName })
      .select()
      .single();

    if (error) {
      setStatus("שגיאה ביצירת הקורס: " + error.message);
      setLoading(false);
      return;
    }

    setCourseId(data.id);
    setStatus(`קורס "${data.title}" נוצר בהצלחה! כעת ניתן להעלות קבצים.`);
    setLoading(false);
  };

  // 2. העלאת ועיבוד סילבוס
  const handleUploadSyllabus = async () => {
    if (!syllabusFile || !courseId) return;
    setLoading(true);
    setStatus("מעלה סילבוס ומפרק נושאים ב-AI...");

    try {
      const filePath = `${courseId}/syllabus-${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("course-materials")
        .upload(filePath, syllabusFile);

      if (uploadErr) throw uploadErr;

      await supabase.from("course_files").insert({
        course_id: courseId,
        file_type: "syllabus",
        file_path: filePath,
      });

      const res = await fetch("/api/extract-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setStatus("הסילבוס עובד בהצלחה! מפת הנושאים נבנתה.");
    } catch (err: any) {
      setStatus("שגיאה בעיבוד הסילבוס: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. העלאת ועיבוד חוברת קורס / סיכום (Active Recall & Formulas)
  const handleUploadBooklet = async () => {
    if (!bookletFile || !courseId) return;
    setLoading(true);
    setStatus("מעלה חוברת קורס ומחלץ נוסחאות ומושגים...");

    try {
      const filePath = `${courseId}/booklet-${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("course-materials")
        .upload(filePath, bookletFile);

      if (uploadErr) throw uploadErr;

      await supabase.from("course_files").insert({
        course_id: courseId,
        file_type: "booklet",
        file_path: filePath,
      });

      const res = await fetch("/api/ingest-booklet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setStatus(`חוברת הקורס עובדה בהצלחה! חולצו ${result.insertedCount} נוסחאות ומושגים.`);
    } catch (err: any) {
      setStatus("שגיאה בעיבוד החוברת: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 dir-rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">הקמת קורס והעלאת חומרי לימוד</h1>

      {/* שלב א': יצירת קורס */}
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">1. הגדרת קורס</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="שם הקורס (לדוגמה: אלגברה ליניארית 1)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            disabled={!!courseId}
            className="flex-1 border rounded-lg p-2.5 text-sm"
          />
          <button
            onClick={handleCreateCourse}
            disabled={loading || !!courseId}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {courseId ? "קורס נוצר ✓" : "צור קורס"}
          </button>
        </div>
      </div>

      {/* שלב ב': העלאת קבצים (מופעל רק לאחר יצירת קורס) */}
      {courseId && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-800">2. העלאת חומרים לעיבוד AI</h2>

          {/* העלאת סילבוס */}
          <div className="border-b pb-4 space-y-2">
            <label className="block text-xs font-bold text-gray-700">📋 סילבוס הקורס (PDF):</label>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm border rounded-lg p-2"
              />
              <button
                onClick={handleUploadSyllabus}
                disabled={loading || !syllabusFile}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                עבד סילבוס
              </button>
            </div>
          </div>

          {/* העלאת חוברת / סיכום */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">📚 חוברת קורס / סיכום / דף נוסחאות (PDF):</label>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setBookletFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm border rounded-lg p-2"
              />
              <button
                onClick={handleUploadBooklet}
                disabled={loading || !bookletFile}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                עבד חוברת ונוסחאות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* הודעות סטטוס */}
      {status && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium">
          {status}
        </div>
      )}
    </div>
  );
}