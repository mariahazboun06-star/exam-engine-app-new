'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function ExamsList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchExams() {
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setExams(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExams();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Available Exams</h1>

      {loading && <p className="text-gray-600">Loading exams...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && exams.length === 0 && (
        <p className="text-gray-600 bg-gray-100 p-4 rounded-md">
          No exams available yet. Go create one!
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {exams.map((exam) => (
          <div key={exam.id} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">{exam.title}</h2>
            <p className="text-gray-600 mb-4">{exam.description}</p>
            
            {/* We will build the individual exam page next! */}
            <Link 
              href={`/exams/${exam.id}`}
              className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-md hover:bg-blue-100 transition-colors"
            >
              Take Exam
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}