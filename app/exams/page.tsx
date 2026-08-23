"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ExamsManagerPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch files and questions on load
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch uploaded exam files
    const { data: filesData } = await supabase
      .from('course_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_type', 'exam')
      .order('created_at', { ascending: false });

    if (filesData) setFiles(filesData);

    // Fetch already extracted questions
    const { data: questionsData } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (questionsData) setQuestions(questionsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExtract = async (fileId: string, courseId: string) => {
    setProcessingId(fileId);
    try {
      const response = await fetch('/api/ai/parse-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract questions.');
      }

      alert(data.message);
      fetchData(); // Refresh the lists
    } catch (error: any) {
      console.error("Extraction Error:", error);
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Exam Manager...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-600">
          <h1 className="text-2xl font-bold text-gray-900">Exam Extraction Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Process your uploaded past papers and view the AI-extracted practice questions.</p>
        </div>

        {/* Uploaded Exams Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Uploaded Past Papers</h2>
          </div>
          <div className="p-6">
            {files.length === 0 ? (
              <p className="text-gray-500 text-sm">No exam files uploaded yet.</p>
            ) : (
              <ul className="space-y-4">
                {files.map(file => (
                  <li key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{file.file_name}</p>
                      <p className="text-xs text-gray-500">Status: <span className={file.ingestion_status === 'completed' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>{file.ingestion_status.toUpperCase()}</span></p>
                    </div>
                    <button
                      onClick={() => handleExtract(file.id, file.course_id)}
                      disabled={processingId === file.id || file.ingestion_status === 'completed'}
                      className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                        file.ingestion_status === 'completed' ? 'bg-gray-400 cursor-not-allowed' :
                        processingId === file.id ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {processingId === file.id ? 'Extracting...' : file.ingestion_status === 'completed' ? 'Extracted' : 'Extract Questions'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Extracted Questions Grid */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Question Bank ({questions.length})</h2>
          </div>
          <div className="p-6">
            {questions.length === 0 ? (
              <p className="text-gray-500 text-sm">No questions extracted yet. Run an extraction above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((q) => (
                  <div key={q.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">{q.topic || 'General'}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          q.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                          q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>{q.difficulty || 'Unrated'}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium mb-4">{q.question_text}</p>
                    </div>
                    {q.solution_text && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Solution:</p>
                        <p className="text-sm text-gray-700 italic">{q.solution_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}