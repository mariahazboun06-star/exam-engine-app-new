"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Concept {
  id: string;
  concept_name: string;
  description: string;
  recall_prompt: string;
  status_color: "red" | "yellow" | "green";
}

interface Topic {
  id: string;
  topic_name: string;
  status_color: "red" | "yellow" | "green";
  concepts: Concept[];
  isExpanded?: boolean;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchTreeData();
  }, []);

  async function fetchTreeData() {
    setLoading(true);
    const { data: topicsData, error: topicsErr } = await supabase
      .from("course_topics")
      .select("*")
      .order("order_index", { ascending: true });

    if (topicsErr || !topicsData) {
      setLoading(false);
      return;
    }

    const { data: conceptsData } = await supabase
      .from("course_concepts")
      .select("*");

    const fullTree = topicsData.map((t) => ({
      ...t,
      isExpanded: true,
      concepts: (conceptsData || []).filter((c) => c.topic_id === t.id),
    }));

    setTopics(fullTree);
    setLoading(false);
  }

  const toggleExpand = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, isExpanded: !t.isExpanded } : t))
    );
  };

  const updateColor = async (
    type: "topic" | "concept",
    id: string,
    color: "red" | "yellow" | "green"
  ) => {
    const table = type === "topic" ? "course_topics" : "course_concepts";
    
    await supabase.from(table).update({ status_color: color }).eq("id", id);

    setTopics((prev) =>
      prev.map((t) => {
        if (type === "topic" && t.id === id) {
          return { ...t, status_color: color };
        }
        if (type === "concept") {
          return {
            ...t,
            concepts: t.concepts.map((c) =>
              c.id === id ? { ...c, status_color: color } : c
            ),
          };
        }
        return t;
      })
    );
  };

  if (loading) {
    return <div className="p-8 text-center dir-rtl">טוען את מפת הנושאים והמושגים...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dir-rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">מפת ידע היררכית - Active Recall</h1>

      <div className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.id} className="border rounded-lg p-4 bg-white shadow-sm">
            {/* שורת נושא ראשי */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="w-6 h-6 flex items-center justify-center border rounded font-mono font-bold"
                >
                  {topic.isExpanded ? "-" : "+"}
                </button>
                <span className="font-semibold text-lg">{topic.topic_name}</span>
              </div>

              {/* בורר צבעי סטטוס נושא */}
              <div className="flex items-center gap-2">
                <ColorPicker
                  currentColor={topic.status_color}
                  onChange={(color) => updateColor("topic", topic.id, color)}
                />
              </div>
            </div>

            {/* רשימת תת-נושאים (Concepts) */}
            {topic.isExpanded && (
              <div className="mt-3 mr-8 border-r-2 border-gray-200 pr-4 space-y-3">
                {topic.concepts.length === 0 ? (
                  <p className="text-sm text-gray-400">אין תת-נושאים מוגדרים</p>
                ) : (
                  topic.concepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 border"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {concept.concept_name}
                        </div>
                        {concept.description && (
                          <div className="text-xs text-gray-500">
                            {concept.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedConcept(concept);
                            setUserAnswer("");
                            setShowFeedback(false);
                          }}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          בחינה עצמית (Active Recall)
                        </button>

                        <ColorPicker
                          currentColor={concept.status_color}
                          onChange={(color) =>
                            updateColor("concept", concept.id, color)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* חלונית תרגול Active Recall */}
      {selectedConcept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h3 className="text-xl font-bold">
              Active Recall: {selectedConcept.concept_name}
            </h3>
            <p className="text-gray-700 font-medium">
              {selectedConcept.recall_prompt}
            </p>

            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="כתוב את התשובה/הסבר שלך כאן..."
              className="w-full border rounded p-2 h-28 text-sm"
            />

            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
              >
                בדוק תשובה והצג פידבק
              </button>
            ) : (
              <div className="space-y-3 bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-900">
                  הערכה עצמית: האם הצלחת לשחזר את המושג בבירור?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateColor("concept", selectedConcept.id, "green");
                      setSelectedConcept(null);
                    }}
                    className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded"
                  >
                    שולט מצוין (ירוק)
                  </button>

                  <button
                    onClick={() => {
                      updateColor("concept", selectedConcept.id, "yellow");
                      setSelectedConcept(null);
                    }}
                    className="flex-1 bg-yellow-500 text-white text-xs py-1.5 rounded"
                  >
                    חלקית / בינוני (צהוב)
                  </button>

                  <button
                    onClick={() => {
                      updateColor("concept", selectedConcept.id, "red");
                      setSelectedConcept(null);
                    }}
                    className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded"
                  >
                    לא זוכר (אדום)
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedConcept(null)}
              className="w-full text-xs text-gray-500 underline pt-2"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  currentColor,
  onChange,
}: {
  currentColor: "red" | "yellow" | "green";
  onChange: (color: "red" | "yellow" | "green") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange("red")}
        className={`w-4 h-4 rounded-full bg-red-500 ${
          currentColor === "red" ? "ring-2 ring-offset-1 ring-black" : "opacity-40"
        }`}
      />
      <button
        onClick={() => onChange("yellow")}
        className={`w-4 h-4 rounded-full bg-yellow-400 ${
          currentColor === "yellow" ? "ring-2 ring-offset-1 ring-black" : "opacity-40"
        }`}
      />
      <button
        onClick={() => onChange("green")}
        className={`w-4 h-4 rounded-full bg-green-500 ${
          currentColor === "green" ? "ring-2 ring-offset-1 ring-black" : "opacity-40"
        }`}
      />
    </div>
  );
}