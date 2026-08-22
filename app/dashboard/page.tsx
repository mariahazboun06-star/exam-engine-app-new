'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Submission {
  id: string;
  score: number;
  submitted_at: string;
  ai_feedback?: string; // <-- Added this!
  exams: {
    title: string;
  };
}

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        // We added ai_feedback to the list of things we are fetching!
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            id,
            score,
            submitted_at,
            ai_feedback,
            exams ( title )
          `)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        setSubmissions((data as any) || []);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Teacher Dashboard - Results</h1>

      {loading ? (
        <p className="text-gray-600">Loading results...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          No students have taken any exams yet.
        </p>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-700 w-1/4">Exam Title</th>
                <th className="p-4 font-semibold text-gray-700 w-1/6">Date</th>
                <th className="p-4 font-semibold text-gray-700 w-1/12">Score</th>
                <th className="p-4 font-semibold text-gray-700 w-1/2">AI Feedback Given</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-gray-800 font-medium">{sub.exams?.title || 'Unknown Exam'}</td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                      sub.score >= 80 ? 'bg-green-100 text-green-800' : 
                      sub.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sub.score.toFixed(0)}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 italic">
                    {sub.ai_feedback ? `"${sub.ai_feedback}"` : 'No feedback generated.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}