"use client";

import { useEffect, useState } from "react";
import { getCourseMatrixAndAnalytics, MatrixAnalyticsResult } from "@/lib/services/analyticsService";
import { supabase } from "@/lib/supabaseClient";

export default function MatrixPage() {
  const [data, setData] = useState<MatrixAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // שליפת הקורס הפילי
      const { data: courses } = await supabase.from("courses").select("id").limit(1);
      if (courses && courses.length > 0) {
        setCourseId(courses[0].id);
        const matrixData = await getCourseMatrixAndAnalytics(courses[0].id);
        setData(matrixData);
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return <div className="p-8 text-center dir-rtl" dir="rtl">טוען את הטבלה המצליבה...</div>;
  }

  if (!data || data.matrixRows.length === 0) {
    return (
      <div className="p-8 text-center dir-rtl" dir="rtl">
        <h2 className="text-xl font-bold">לא נמצאו נתונים</h2>
        <p className="text-gray-500 text-sm mt-2">יש להעלות סילבוס ומבחנים במסך ה-Setup תחילה.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 dir-rtl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 מטריצה מצליבה: נושאים מול מועדי מבחנים</h1>
        <p className="text-xs text-gray-500 mt-1">
          הטבלה מציגה את השאלות המדויקות מכל מועד ומזהה אוטומטית נושאי חובה המופיעים באופן קבוע במבחנים.
        </p>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
        <table className="w-full text-sm text-right border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-gray-700">
              <th className="p-4 border-l font-bold min-w-[220px]">נושא בסילבוס</th>
              <th className="p-4 border-l font-bold text-center w-28">שכיחות</th>
              {data.exams.map((exam) => (
                <th key={exam.id} className="p-4 border-l font-bold text-center min-w-[120px]">
                  {exam.year} {exam.term}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrixRows.map((row) => (
              <tr
                key={row.topicId}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  row.isMandatory ? "bg-red-50/40" : ""
                }`}
              >
                {/* שם הנושא ותגית נושא חובה */}
                <td className="p-4 border-l">
                  <div className="font-bold text-gray-800">{row.topicTitle}</div>
                  {row.isMandatory && (
                    <span className="inline-block mt-1 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      🔥 נושא חובה במבחנים (סבירות גבוהה)
                    </span>
                  )}
                </td>

                {/* אחוז שכיחות */}
                <td className="p-4 border-l text-center font-bold">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                      row.isMandatory
                        ? "bg-red-100 text-red-800"
                        : row.appearancePercentage >= 50
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {row.appearancePercentage}%
                  </span>
                </td>

                {/* שאלות לפי מועדים */}
                {data.exams.map((exam) => {
                  const qNumbers = row.examQuestionsMap[exam.id];
                  return (
                    <td key={exam.id} className="p-4 border-l text-center">
                      {qNumbers && qNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {qNumbers.map((qNum) => (
                            <span
                              key={qNum}
                              className="bg-blue-100 text-blue-900 border border-blue-200 font-semibold px-2 py-0.5 rounded text-xs"
                            >
                              שאלה {qNum}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}