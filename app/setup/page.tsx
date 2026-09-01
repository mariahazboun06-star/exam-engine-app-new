"use client";

import { useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

interface ExamFileItem {
  file: File;
  isCurrentLecturer: boolean;
  hasSolutions: boolean;
}

export default function SetupPage() {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<string[]>(["מועד א'", "מועד ב'"]);

  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [textbook, setTextbook] = useState<File | null>(null);
  const [examFiles, setExamFiles] = useState<ExamFileItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTermToggle = (term: string) => {
    setSelectedTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    );
  };

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

    if (!courseName.trim()) {
      setErrorMessage("נא להזין שם קורס.");
      return;
    }

    if (!syllabus) {
      setErrorMessage("נא להעלות סילבוס.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("משתמש לא מחובר. נא להתחבר מחדש.");
        setLoading(false);
        return;
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .insert({
          user_id: user.id,
          course_name: courseName,
          course_code: courseCode,
          exam_terms: selectedTerms,
        })
        .select()
        .single();

      if (courseError) throw courseError;
      const courseId = courseData.id;

      const syllabusPath = `${user.id}/${courseId}/syllabus_${Date.now()}_${syllabus.name}`;
      await supabase.storage.from("course-materials").upload(syllabusPath, syllabus);
      await supabase.from("course_files").insert({
        user_id: user.id,
        course_id: courseId,
        file_name: syllabus.name,
        file_path: syllabusPath,
        file_type: "syllabus",
      });

      if (textbook) {
        const tbPath = `${user.id}/${courseId}/textbook_${Date.now()}_${textbook.name}`;
        await supabase.storage.from("course-materials").upload(tbPath, textbook);
        await supabase.from("course_files").insert({
          user_id: user.id,
          course_id: courseId,
          file_name: textbook.name,
          file_path: tbPath,
          file_type: "textbook",
        });
      }

      for (const item of examFiles) {
        const examPath = `${user.id}/${courseId}/exam_${Date.now()}_${item.file.name}`;
        await supabase.storage.from("course-materials").upload(examPath, item.file);

        await supabase.from("course_files").insert({
          user_id: user.id,
          course_id: courseId,
          file_name: item.file.name,
          file_path: examPath,
          file_type: "exam",
          metadata: {
            isCurrentLecturer: item.isCurrentLecturer,
            hasSolutions: item.hasSolutions,
          },
        });
      }

     window.location.href = `/topics?courseId=${courseId}`;
    } catch (err: any) {
      setErrorMessage(err.message || "אירעה שגיאה בהעלאת החומרים.");
    } finally {
      setLoading(false);
    }
  };

  const buttonText = loading ? "מעלה ושומר פרטים..." : "שמור קורס והמשך לבניית התוכנית";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">הוספת קורס חדש והעלאת חומרים</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-800">1. פרטי הקורס</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  שם הקורס (חובה)
                </label>
                <input
                  type="text"
                  placeholder="לדוגמה: אינפי 2"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  מספר קורס (אופציונלי)
                </label>
                <input
                  type="text"
                  placeholder="לדוגמה: 104012"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                מועדי בחינה נדרשים
              </label>
              <div className="flex items-center space-x-4 space-x-reverse text-sm">
                {["מועד א'", "מועד ב'", "מועד ג' / מיוחד"].map((term) => (
                  <label key={term} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTerms.includes(term)}
                      onChange={() => handleTermToggle(term)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{term}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">2. חומרי הלימוד והמבחנים</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                סילבוס הקורס (חובה)
              </label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setSyllabus(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                ספר הקורס / מצגות (אופציונלי)
              </label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setTextbook(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  מבחני עבר
                </label>
                <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                  💡 מומלץ: 20+ מבחנים
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mb-3">
                העלאת מספר רב של מבחנים תאפשר ל-AI לזהות נושאים חוזרים ודפוסי ניסוח של המרצה.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={(e) => handleExamUpload(e.target.files)}
                className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
              />

              {examFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      קובצי מבחנים שהועלו ({examFiles.length})
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-md hover:bg-blue-100 transition border border-blue-200"
                    >
                      + הוסף מבחנים נוספים
                    </button>
                  </div>

                  {examFiles.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-gray-800 truncate max-w-xs">
                        {item.file.name}
                      </span>

                      <div className="flex items-center space-x-4 space-x-reverse">
                        <label className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isCurrentLecturer}
                            onChange={() => toggleLecturer(index)}
                            className="rounded text-blue-600"
                          />
                          <span>מרצה נוכחי</span>
                        </label>

                        <label className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.hasSolutions}
                            onChange={() => toggleSolutions(index)}
                            className="rounded text-blue-600"
                          />
                          <span>כולל פתרונות</span>
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
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}