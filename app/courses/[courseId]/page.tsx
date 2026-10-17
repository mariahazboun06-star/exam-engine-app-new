"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface ExamEntry {
  file: File;
  hasSolutions: boolean;
  currentLecturer: boolean;
}

export default function CourseSetupPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [textbook, setTextbook] = useState<File | null>(null);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddExam = (files: FileList | null) => {
    if (!files) return;
    const newExams = Array.from(files).map((file) => ({
      file,
      hasSolutions: false,
      currentLecturer: true,
    }));
    setExams((prev) => [...prev, ...newExams]);
  };

  const handleToggleOption = (index: number, field: "hasSolutions" | "currentLecturer") => {
    setExams((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: !item[field] } : item))
    );
  };

  const handleRemoveExam = (index: number) => {
    setExams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!syllabus || !textbook) {
      setErrorMessage("Both Syllabus and Textbook PDF files are required.");
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Please log in to upload materials.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("courseId", courseId);
    formData.append("syllabus", syllabus);
    formData.append("textbook", textbook);

    const metadata = exams.map((e) => ({
      hasSolutions: e.hasSolutions,
      currentLecturer: e.currentLecturer,
    }));
    formData.append("examsMetadata", JSON.stringify(metadata));

    exams.forEach((entry, idx) => {
      formData.append(`exam_${idx}`, entry.file);
    });

    try {
      const res = await fetch("/api/ingest-batch", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push(`/courses/${courseId}`);
      } else {
        setErrorMessage(result.error || "Failed to process course materials.");
      }
    } catch (err: any) {
      setErrorMessage("Network error during upload submission.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-8 px-4 dir-rtl" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📥 העלאת חומרי קורס מרוכזת</h1>
          <p className="text-slate-500 text-xs mt-1">
            טען סילבוס, ספר קורס ומבחני עבר ליצירת מפת נושאים ומטריצת תרגול מותאמת.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Syllabus */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">1. סילבוס הקורס (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setSyllabus(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {/* Textbook */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">2. ספר הקורס / חוברת לימוד (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setTextbook(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {/* Past Exams Upload */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">3. מבחני עבר (PDFs)</label>
              <span className="text-[11px] text-slate-400">נבחרו: {exams.length}</span>
            </div>

            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => handleAddExam(e.target.files)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

            {exams.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {exams.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">
                      {item.file.name}
                    </span>

                    <div className="flex items-center gap-4 text-[11px]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.hasSolutions}
                          onChange={() => handleToggleOption(idx, "hasSolutions")}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>כולל פתרון</span>
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.currentLecturer}
                          onChange={() => handleToggleOption(idx, "currentLecturer")}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>מרצה נוכחי</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveExam(idx)}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            {uploading ? "מעבד ומעלה חומרי קורס..." : "שמור והתחל עיבוד AI"}
          </button>
        </form>
      </div>
    </div>
  );
}