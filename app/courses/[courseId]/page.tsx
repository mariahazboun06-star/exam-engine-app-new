"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function CourseHubPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <div className="max-w-5xl mx-auto p-6 dir-rtl space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎓 מרכז המשאבים והתרגול של הקורס</h1>
        <p className="text-xs text-gray-500 mt-1">נהל את חומרי הלימוד, בחן שכיחות נושאים ותרגל בזמן אמת.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. העלאת סילבוס, מבחנים וכתב יד */}
        <Link
          href={`/setup?courseId=${courseId}`}
          className="bg-white p-6 rounded-xl border hover:border-blue-500 hover:shadow-md transition space-y-2"
        >
          <div className="text-2xl">📥</div>
          <h2 className="font-bold text-base text-gray-900">1. העלאת חומרים וסיכומים</h2>
          <p className="text-xs text-gray-500">העלאת סילבוסים, מבחנים וסיכומים בכתב יד לפענוח AI.</p>
        </Link>

        {/* 2. מטריצת שכיחות */}
        <Link
          href={`/matrix?courseId=${courseId}`}
          className="bg-white p-6 rounded-xl border hover:border-blue-500 hover:shadow-md transition space-y-2"
        >
          <div className="text-2xl">📊</div>
          <h2 className="font-bold text-base text-gray-900">2. מטריצת נושאי חובה</h2>
          <p className="text-xs text-gray-500">ניתוח שכיחות נושאים ממבחני עבר וזיהוי נושאים קריטיים (80%+).</p>
        </Link>

        {/* 3. תרגול ממוקד */}
        <Link
          href={`/study/focused?courseId=${courseId}`}
          className="bg-white p-6 rounded-xl border hover:border-blue-500 hover:shadow-md transition space-y-2"
        >
          <div className="text-2xl">🎯</div>
          <h2 className="font-bold text-base text-gray-900">3. תרגול ממוקד ומפת חום</h2>
          <p className="text-xs text-gray-500">תרגול שאלות מבוססות ספר הקורס עם סימון ירוק/אדום.</p>
        </Link>

        {/* 4. סימולטור מבחן */}
        <Link
          href={`/exam/simulation?courseId=${courseId}`}
          className="bg-white p-6 rounded-xl border hover:border-blue-500 hover:shadow-md transition space-y-2"
        >
          <div className="text-2xl">📝</div>
          <h2 className="font-bold text-base text-gray-900">4. סימולציית מבחן בזמן אמת</h2>
          <p className="text-xs text-gray-500">הדמיית מבחן אמת כולל בדיקת פתרונות פתוחים מתמונות כתב יד.</p>
        </Link>
      </div>
    </div>
  );
}