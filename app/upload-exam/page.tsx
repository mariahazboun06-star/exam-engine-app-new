'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function UploadExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';

  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    semester: 'A',
    testPeriod: 'Moed A',
    file: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.file) return alert("Please select an exam PDF first.");

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to upload exams.");
      setSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append('year', formData.year);
    data.append('semester', formData.semester);
    data.append('testPeriod', formData.testPeriod);
    data.append('file', formData.file);
    data.append('userId', user.id);
    if (courseId) data.append('courseId', courseId);

    try {
      const res = await fetch('/api/ingest-exam', { method: 'POST', body: data });
      const result = await res.json();

      if (res.ok && result.success) {
        router.push(courseId ? `/matrix?courseId=${courseId}` : '/dashboard');
      } else {
        alert(result.error || "Failed to upload and process exam.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An unexpected error occurred during file upload.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto pt-10 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Private Exam</h1>
          <p className="text-slate-500 text-sm mt-1">
            Add past exams to extract topics and populate your question matrix.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Exam Year</label>
            <input 
              type="number" 
              value={formData.year}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm text-slate-800"
              onChange={e => setFormData({...formData, year: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Semester</label>
              <select 
                value={formData.semester}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm text-slate-800 bg-white"
                onChange={e => setFormData({...formData, semester: e.target.value})}
              >
                <option value="A">Semester A</option>
                <option value="B">Semester B</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Test Period</label>
              <select 
                value={formData.testPeriod}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-sm text-slate-800 bg-white"
                onChange={e => setFormData({...formData, testPeriod: e.target.value})}
              >
                <option value="Moed A">Moed A</option>
                <option value="Moed B">Moed B</option>
                <option value="Midterm">Midterm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">PDF File</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50/50">
              <input 
                type="file" 
                accept="application/pdf" 
                required
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                onChange={e => setFormData({...formData, file: e.target.files?.[0] || null})} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-xl shadow-sm transition-all text-sm mt-2"
          >
            {submitting ? "Processing Exam..." : "Process & Add to Matrix"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UploadExamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading upload form...</div>}>
      <UploadExamContent />
    </Suspense>
  );
}