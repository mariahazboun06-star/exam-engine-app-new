"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadUserCourses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setCourses(data);
      setLoading(false);
    }

    loadUserCourses();
  }, [router]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("courses")
        .insert({
          name: newCourseName,
          code: newCourseCode,
          user_id: user.id,
        })
        .select()
        .single();

      if (data) {
        setCourses([data, ...courses]);
        setNewCourseName("");
        setNewCourseCode("");
      }
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center dir-rtl" dir="rtl">
        <div className="text-slate-400 font-medium animate-pulse">טוען את הקורסים שלי...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-10 px-4 dir-rtl space-y-8" dir="rtl">
      {/* Main Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          📚 הקורסים שלי
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          בחר קורס כדי לצפות בחומרי הלימוד, במטריצה ובסימולציות.
        </p>
      </div>

      {/* Course List Stack (Matches your sketch: קורס X, קורס Y) */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
            עדיין לא הקמת קורסים. צור את הקורס הראשון שלך למטה!
          </div>
        ) : (
          courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between group block"
            >
              <div className="space-y-1">
                {c.code && (
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {c.code}
                  </span>
                )}
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {c.name}
                </h2>
              </div>
              
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span>כניסה לקורס</span>
                <span className="text-lg">←</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Add New Course Section */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">➕ הוספת קורס חדש</h3>
        <form onSubmit={handleCreateCourse} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="שם הקורס (למשל: אינפי 2)"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />
          <input
            type="text"
            placeholder="קוד קורס (אופציונלי)"
            value={newCourseCode}
            onChange={(e) => setNewCourseCode(e.target.value)}
            className="w-full sm:w-40 p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl px-6 py-3 transition shadow-xs"
          >
            {creating ? "יוצר..." : "צור קורס"}
          </button>
        </form>
      </div>
    </div>
  );
}