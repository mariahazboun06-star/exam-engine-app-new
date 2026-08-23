"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface ExamFileItem {
  file: File;
  isCurrentLecturer: boolean;
  hasSolutions: boolean;
}

export default function SetupPage() {
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [textbook, setTextbook] = useState<File | null>(null);
  const [examFiles, setExamFiles] = useState<ExamFileItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleExamUpload = (files: FileList | null) => {
    if (!files) return;
    const newItems: ExamFileItem[] = Array.from(files).map((file) => ({
      file,
      isCurrentLecturer: true,
      hasSolutions: false,
    }));
    setExamFiles((prev) => [...prev, ...newItems]);
  };

  const toggleLecturer = (index: number) => {
    setExamFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isCurrentLecturer: !item.isCurrentLecturer } : item
      )
    );
  };

  const toggleSolutions = (index: number) => {
    setExamFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, hasSolutions: !item.hasSolutions } : item
      )
    );
  };

  const removeExam = (index: number) => {
    setExamFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!syllabus) {
      setErrorMessage("Please upload a syllabus.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Unauthorized. Please log in first.");
        setLoading(false);
        return;
      }

      // 1. Upload Syllabus
      const syllabusPath = `${user.id}/syllabus_${Date.now()}_${syllabus.name}`;
      await supabase.storage.from("course-materials").upload(syllabusPath, syllabus);
      await supabase.from("course_files").insert({
        user_id: user.id,
        file_name: syllabus.name,
        file_path: syllabusPath,
        file_type: "syllabus",
      });

      // 2. Upload Textbook if provided
      if (textbook) {
        const tbPath = `${user.id}/textbook_${Date.now()}_${textbook.name}`;
        await supabase.storage.from("course-materials").upload(tbPath, textbook);
        await supabase.from("course_files").insert({
          user_id: user.id,
          file_name: textbook.name,
          file_path: tbPath,
          file_type: "textbook",
        });
      }

      // 3. Upload Exams with Per-File Metadata
      for (const item of examFiles) {
        const examPath = `${user.id}/exam_${Date.now()}_${item.file.name}`;
        await supabase.storage.from("course-materials").upload(examPath, item.file);

        await supabase.from("course_files").insert({
          user_id: user.id,
          file_name: item.file.name,
          file_path: examPath,
          file_type: "exam",
          metadata: {
            isCurrentLecturer: item.isCurrentLecturer,
            hasSolutions: item.hasSolutions,
          },
        });
      }

      window.location.href = "/context-input";
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload course materials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Course Materials</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Syllabus */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Syllabus (Required)
            </label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setSyllabus(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Textbook */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Textbook / Slides (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setTextbook(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Exams Upload & Per-File Settings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Past Exams (Upload multiple)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={(e) => handleExamUpload(e.target.files)}
              className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
            />

            {/* List of uploaded exams with granular toggles */}
            {examFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Uploaded Exam Files ({examFiles.length})
                </p>
                {examFiles.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-gray-800 truncate max-w-xs">
                      {item.file.name}
                    </span>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCurrentLecturer}
                          onChange={() => toggleLecturer(index)}
                          className="rounded text-blue-600"
                        />
                        <span>Current Lecturer</span>
                      </label>

                      <label className="flex items-center space-x-1 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.hasSolutions}
                          onChange={() => toggleSolutions(index)}
                          className="rounded text-blue-600"
                        />
                        <span>Includes Solutions</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeExam(index)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Uploading & Processing..." : "Upload Course Materials"}
          </button>
        </form>
      </div>
    </div>
  );
}