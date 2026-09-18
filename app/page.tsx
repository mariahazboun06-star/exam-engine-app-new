"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6 dir-rtl text-center" dir="rtl">
      <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg border space-y-6">
        <div className="space-y-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            פלטפורמת ה-AI ללמידה למבחנים 🎓
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
            הכנה חכמה למבחנים עם ניתוח AI
          </h1>
          <p className="text-sm text-gray-600">
            העלו את הסילבוס והמבחנים שלכם, וה-AI יזהה נושאי חובה, מלכודות במבחנים ויבנה לכם תוכנית לימודים מותאמת אישית.
          </p>
        </div>

        {/* פעולות ראשיות לסטודנט */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            href="/setup"
            className="flex flex-col items-center p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md"
          >
            <span className="text-lg">⚙️ הקמת קורס והעלאה</span>
            <span className="text-xs font-normal opacity-90 mt-1">העלאת סילבוס, חוברות ומבחנים</span>
          </Link>

          <Link
            href="/matrix"
            className="flex flex-col items-center p-5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition shadow-md"
          >
            <span className="text-lg">📊 מטריצת שכיחות</span>
            <span className="text-xs font-normal opacity-90 mt-1">ניתוח נושאי חובה מתוך מבחנים</span>
          </Link>

          <Link
            href="/study/focused"
            className="flex flex-col items-center p-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-md"
          >
            <span className="text-lg">🎯 תרגול נושאי חובה</span>
            <span className="text-xs font-normal opacity-90 mt-1">תרגול שאלות ומלכודות נפוצות</span>
          </Link>

          <Link
            href="/plan"
            className="flex flex-col items-center p-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md"
          >
            <span className="text-lg">📅 תוכנית לימודים</span>
            <span className="text-xs font-normal opacity-90 mt-1">לו"ז מותאם לפי משקל הנושאים</span>
          </Link>
        </div>
      </div>
    </div>
  );
}