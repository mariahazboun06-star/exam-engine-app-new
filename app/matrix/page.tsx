'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';
import { getCourseMatrixAndAnalytics, MatrixAnalyticsResult } from '@/lib/services/analyticsService';

function MatrixContent() {
  const { t, dir } = useLanguage();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';

  const [matrixData, setMatrixData] = useState<MatrixAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatrix() {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getCourseMatrixAndAnalytics(courseId);
        setMatrixData(data);
      } catch (err: any) {
        console.error('Error fetching course matrix analytics:', err);
        setError(err.message || 'Failed to load topic matrix.');
      } finally {
        setLoading(false);
      }
    }

    loadMatrix();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir={dir}>
        <div className="text-slate-400 font-medium animate-pulse">Loading topic matrix...</div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto mt-12 p-8 bg-white border rounded-2xl text-center space-y-4" dir={dir}>
        <h2 className="text-xl font-bold text-slate-800">No Course Selected</h2>
        <p className="text-slate-500 text-sm">Please navigate to the Topic Matrix from a specific course dashboard.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (error || !matrixData) {
    return (
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-center text-sm" dir={dir}>
        {error || 'Unable to display topic matrix data.'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 space-y-6" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('matrixTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('matrixSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span> {t('solvedSuccess')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span> {t('needsReview')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">—</span> {t('noQuestion')}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th className="p-3 border-l border-slate-300 min-w-[320px] text-start">
                  {t('syllabusTopic')}
                </th>
                <th className="p-3 text-center min-w-[100px] border-l border-slate-300">
                  Frequency
                </th>
                {matrixData.exams.map((exam) => (
                  <th key={exam.id} className="p-3 text-center min-w-[140px] border-l border-slate-300">
                    {exam.year} {exam.term}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matrixData.matrixRows.map((row) => (
                <tr key={row.topicId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium text-slate-900 border-l border-slate-200 text-start">
                    <Link 
                      href={`/simulation?courseId=${courseId}&topicId=${row.topicId}`}
                      className="hover:text-indigo-600 hover:underline transition-all flex items-center justify-between"
                    >
                      <span>{row.topicTitle}</span>
                      {row.isMandatory && (
                        <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          🔥 Core (80%+)
                        </span>
                      )}
                    </Link>
                  </td>

                  <td className="p-3 text-center font-bold text-slate-700 border-l border-slate-200 bg-slate-50/50">
                    {row.appearancePercentage}%
                  </td>

                  {matrixData.exams.map((exam) => {
                    const questionNumbers = row.examQuestionsMap[exam.id];
                    const hasQuestions = questionNumbers && questionNumbers.length > 0;

                    return (
                      <td 
                        key={exam.id} 
                        className={`p-3 text-center font-bold border-l border-slate-200 transition-colors ${
                          hasQuestions 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'text-slate-400'
                        }`}
                      >
                        {hasQuestions ? questionNumbers.join(', ') : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TopicMatrixPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading matrix view...</div>}>
      <MatrixContent />
    </Suspense>
  );
}