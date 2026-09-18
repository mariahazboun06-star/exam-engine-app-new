"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("הרשמה בוצעה בהצלחה! ניתן להתחבר כעת.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "שגיאה בתהליך ההתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dir-rtl" dir="rtl">
      {/* סרגל עליון */}
      <header className="max-w-6xl mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-extrabold text-2xl text-blue-600">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-base font-black">SS</span>
          <span>Study Smarter</span>
        </div>
      </header>

      {/* אזור ה-Hero והסבר על המערכת */}
      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            🚀 פלטפורמת ה-AI הבלעדית לסטודנטים
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            ללמוד למבחנים חכם יותר, <br />
            <span className="text-blue-600">100% מתואם לחומרי הקורס שלך.</span>
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            SS - Study Smarter הופכת את סיכומי כתב היד, הסילבוסים ומבחני העבר שלך למאגר תרגול ממוקד.
            אפס המצאות AI, בדיקה אוטומטית של פתרונות בכתב יד, ומפת חום של נושאי חובה בסיכון גבוה.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xl">✍️</span>
              <h3 className="font-bold text-xs mt-1">פענוח כתב יד</h3>
              <p className="text-[11px] text-gray-500">העלאת מחברות בחינה וסריקות</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xl">🔥</span>
              <h3 className="font-bold text-xs mt-1">מטריצת שכיחות</h3>
              <p className="text-[11px] text-gray-500">זיהוי נושאי חובה בסיכון (80%+)</p>
            </div>
          </div>
        </div>

        {/* טופס התחברות / הרשמה */}
        <div className="bg-white p-8 rounded-2xl border shadow-lg space-y-6 max-w-md mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isSignUp ? "יצירת חשבון جديد" : "התחברות למערכת"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isSignUp ? "הרשם והתחל לנהל את הקורסים שלך" : "הכנס את הפרטים כדי לגשת לקורסים שלך"}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">דוא"ל</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs"
                placeholder="student@university.ac.il"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">סיסמה</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition shadow-md"
            >
              {loading ? "מעבד..." : isSignUp ? "ירשם כעת" : "התחבר לחשבון"}
            </button>
          </form>

          <div className="text-center pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {isSignUp ? "כבר נרשמת? התחבר כאן" : "אין לך חשבון? הרשם כעת"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}