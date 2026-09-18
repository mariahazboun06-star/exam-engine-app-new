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
      const { data, error } = await supabase
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

  if (loading) return <div className="p-8 text-center dir-rtl" dir="rtl">טוען את הקורסים שלך...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 dir-rtl space-y-8" dir="rtl">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 הקורסים שלי</h1>
          <p className="text-xs text-gray-500 mt-1">בחר קורס כדי לצפות בחומרים, במטריצה ובסימולטורים.</p>
        </div>
      </div>

      {/* יצירת קורס חדש */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-3">➕ הוספת קורס חדש למערכת</h2>
        <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="שם הקורס (למשל: מבוא למיקרו כלכלה)"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="p-2.5 border rounded-lg text-xs"
            required
          />
          <input
            type="text"
            placeholder="קוד קורס (אופציונלי)"
            value={newCourseCode}
            onChange={(e) => setNewCourseCode(e.target.value)}
            className="p-2.5 border rounded-lg text-xs"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg p-2.5 transition"
          >
            {creating ? "יוצר..." : "צור קורס"}
          </button>
        </form>
      </div>

      {/* רשימת הקורסים */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-gray-50 rounded-xl border text-gray-500 text-xs">
            עדיין לא הקמת קורסים. צור את הקורס הראשון שלך למעלה!
          </div>
        ) : (
          courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="bg-white p-5 rounded-xl border hover:border-blue-500 hover:shadow-md transition space-y-3 block"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {c.code || "קורס"}
                </span>
                <span className="text-xs text-gray-400">כניסה לקורס ←</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}