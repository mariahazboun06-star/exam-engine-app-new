"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

interface Topic {
  id?: string;
  topic_name: string;
  description: string;
  order_index: number;
}

export default function TopicsPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!courseId) {
      setErrorMessage("מזהה קורס חסר.");
      setLoading(false);
      return;
    }

    const fetchOrExtractTopics = async () => {
      try {
        // 1. בדיקה אם כבר יש נושאים שמורים לקורס
        const { data: existingTopics } = await supabase
          .from("course_topics")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        if (existingTopics && existingTopics.length > 0) {
          setTopics(existingTopics);
          setLoading(false);
          return;
        }

        // 2. במידה ואין, הפעלת מנוע החילוץ מהסילבוס
        const res = await fetch("/api/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בחילוץ נושאים");

        setTopics(data.topics || []);
      } catch (err: any) {
        setErrorMessage(err.message || "שגיאה בטעינת הנושאים.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrExtractTopics();
  }, [courseId]);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const newTopic: Topic = {
      topic_name: newTopicName,
      description: "נושא שהתווסף ידנית",
      order_index: topics.length + 1,
    };
    setTopics([...topics, newTopic]);
    setNewTopicName("");
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleProceedToMatrix = async () => {
    if (topics.length === 0) {
      setErrorMessage("חובה להגדיר לפחות נושא אחד בקורס.");
      return;
    }

    window.location.href = `/matrix?courseId=${courseId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">מנתח את הסילבוס ומחלץ את אינדקס הנושאים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">אינדקס נושאי הקורס</h1>
            <p className="text-sm text-gray-500">
              ה-AI חילץ את הנושאים הבאים מהסילבוס. תוכל לערוך או להוסיף נושאים לפי הצורך.
            </p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            {topics.length} נושאים
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 mb-6 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* רשימת הנושאים */}
        <div className="space-y-3 mb-6">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800">{topic.topic_name}</h3>
                  <p className="text-xs text-gray-500">{topic.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveTopic(index)}
                className="text-red-500 hover:text-red-700 text-xs font-semibold"
              >
                הסר
              </button>
            </div>
          ))}
        </div>

        {/* הוספת נושא ידני */}
        <div className="flex gap-2 mb-8 border-t pt-4">
          <input
            type="text"
            placeholder="הוסף נושא חדש..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleAddTopic}
            className="bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-900 transition"
          >
            + הוסף נושא
          </button>
        </div>

        {/* כפתור מעבר לשלב הבא */}
        <button
          onClick={handleProceedToMatrix}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition"
        >
          אישור נושאים והמשך למיפוי שאלות המבחנים (מטריצה) ←
        </button>
      </div>
    </div>
  );
}