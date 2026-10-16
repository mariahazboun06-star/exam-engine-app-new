'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TopicMatrixPage() {
  const [matrixData, setMatrixData] = useState<any>(null);

  useEffect(() => {
    setMatrixData({
      exams: [
        { id: 'e1', title: '2023 Sem A Moed A' },
        { id: 'e2', title: '2022 Sem B Midterm' }
      ],
      topics: [
        { id: 't1', name: 'Derivatives & Limits' },
        { id: 't2', name: 'Integrals & Area' }
      ],
      questions: [
        { id: 'q1', q_number: 1, exam_id: 'e1', topic_id: 't1', first_try_correct: true, total_attempts: 1 },
        { id: 'q2', q_number: 3, exam_id: 'e1', topic_id: 't1', first_try_correct: false, total_attempts: 2, latest_correct: true },
        { id: 'q3', q_number: 2, exam_id: 'e2', topic_id: 't2', first_try_correct: null, total_attempts: 0 }
      ]
    });
  }, []);

  if (!matrixData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Loading Knowledge Matrix...</div>
      </div>
    );
  }

  const getQuestionStyle = (q: any) => {
    if (q.first_try_correct === true) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs';
    }
    if (q.first_try_correct === false && q.latest_correct && q.total_attempts > 1) {
      return 'bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200/80';
  };

  return (
    <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Topic Mastery Matrix</h1>
          <p className="text-slate-500 text-sm mt-1">
            Click on any topic row to start practicing its questions.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-600 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 1st Try Correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Retried Correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Unsolved
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 sm:p-5 w-64">Topics</th>
                {matrixData.exams.map((exam: any) => (
                  <th key={exam.id} className="p-4 sm:p-5 text-center min-w-[160px]">
                    {exam.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {matrixData.topics.map((topic: any) => {
                const topicQuestions = matrixData.questions.filter((q: any) => q.topic_id === topic.id);
                const isTopicMastered = topicQuestions.length > 0 && topicQuestions.every((q: any) => q.first_try_correct === true);

                return (
                  <tr key={topic.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className={`p-4 sm:p-5 font-medium transition-colors ${isTopicMastered ? 'bg-emerald-50/60 text-emerald-950' : 'text-slate-800'}`}>
                      <Link 
                        href={`/simulation?topicId=${topic.id}`} 
                        className="group inline-flex items-center gap-2 hover:text-indigo-600 transition-colors"
                      >
                        <span>{topic.name}</span>
                        <span className="text-slate-400 group-hover:translate-x-1 transition-transform text-xs">→</span>
                      </Link>
                    </td>

                    {matrixData.exams.map((exam: any) => {
                      const cellQuestions = topicQuestions.filter((q: any) => q.exam_id === exam.id);

                      return (
                        <td key={exam.id} className="p-4 sm:p-5 text-center align-middle">
                          {cellQuestions.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {cellQuestions.map((q: any, idx: number) => (
                                <span key={q.id} className="inline-flex items-center">
                                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getQuestionStyle(q)}`}>
                                    Q{q.q_number}
                                  </span>
                                  {idx < cellQuestions.length - 1 && (
                                    <span className="ml-1 text-xs font-normal text-slate-400">and</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-light">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}