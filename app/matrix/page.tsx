'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';

export default function TopicMatrixPage() {
  const { t, dir } = useLanguage();
  const [matrixData, setMatrixData] = useState<any>(null);

  useEffect(() => {
    setMatrixData({
      exams: [
        { id: 'e1', title: '2020 אמריקאי מועד א' },
        { id: 'e2', title: '2021 אמריקאי מועד ב' }
      ],
      topics: [
        { id: 't1', num: 1, name: 'וקטורים, מכפלה פנימית ומכפלה וקטורית' },
        { id: 't2', num: 2, name: 'גיאומטריה אנליטית – מישורים וישרים' },
        { id: 't3', num: 3, name: 'משטחים ריבועיים' },
        { id: 't4', num: 4, name: 'פונקציות – גבולות ורציפות' },
        { id: 't5', num: 5, name: 'דיפרנציאביליות, נגזרות חלקיות, נגזרות מכוונות, כלל השרשרת, הגרדיאנט' },
        { id: 't6', num: 6, name: 'פולינום טיילור, משפט הפונקציות הסתומות' },
        { id: 't7', num: 7, name: 'קיצון וקיצון מקומי, אפיון קיצון מקומי, כופלי לגרנז' },
        { id: 't8', num: 8, name: 'אינטגרל כפול' },
        { id: 't9', num: 9, name: 'אינטגרל משולש' },
        { id: 't10', num: 10, name: 'אינטגרל קווי מסוג ראשון ושני. משפט גרין, שדה משמר במישור' },
        { id: 't11', num: 11, name: 'אינטגרל משטחי מסוג ראשון ושני' },
        { id: 't12', num: 12, name: 'משפט גאוס ומשפט סטוקס' }
      ],
      questions: [
        { id: 'q1', q_number: '1', exam_id: 'e1', topic_id: 't1', status: 'correct' },
        { id: 'q2', q_number: '3', exam_id: 'e1', topic_id: 't5', status: 'correct' },
        { id: 'q3', q_number: '6', exam_id: 'e1', topic_id: 't6', status: 'correct' },
        { id: 'q4', q_number: '5', exam_id: 'e1', topic_id: 't7', status: 'correct' },
        { id: 'q5', q_number: '2', exam_id: 'e1', topic_id: 't8', status: 'correct' },
        { id: 'q6', q_number: '4', exam_id: 'e1', topic_id: 't9', status: 'correct' }
      ]
    });
  }, []);

  if (!matrixData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir={dir}>
        <div className="text-slate-400 font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 space-y-6" dir={dir}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('matrixTitle')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('matrixSubtitle')}
          </p>
        </div>

        {/* Legend */}
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

      {/* Sheet Matrix Container */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th className="p-3 border-l border-slate-300 min-w-[320px] text-start">
                  {t('syllabusTopic')}
                </th>
                {matrixData.exams.map((exam: any) => (
                  <th key={exam.id} className="p-3 text-center min-w-[180px] border-l border-slate-300">
                    {exam.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matrixData.topics.map((topic: any) => {
                return (
                  <tr key={topic.id} className="hover:bg-slate-50 transition-colors">
                    {/* Syllabus Topic Title */}
                    <td className="p-3 font-medium text-slate-900 border-l border-slate-200 text-start">
                      <Link 
                        href={`/simulation?topicId=${topic.id}`}
                        className="hover:text-indigo-600 hover:underline transition-all block"
                      >
                        {topic.num}. {topic.name}
                      </Link>
                    </td>

                    {/* Exam Columns */}
                    {matrixData.exams.map((exam: any) => {
                      const topicQuestions = matrixData.questions.filter(
                        (q: any) => q.topic_id === topic.id && q.exam_id === exam.id
                      );

                      const hasQuestions = topicQuestions.length > 0;
                      const isMastered = hasQuestions && topicQuestions.every((q: any) => q.status === 'correct');

                      return (
                        <td 
                          key={exam.id} 
                          className={`p-3 text-center font-bold border-l border-slate-200 transition-colors ${
                            isMastered 
                              ? 'bg-emerald-600 text-white' 
                              : hasQuestions 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'text-slate-400'
                          }`}
                        >
                          {hasQuestions 
                            ? topicQuestions.map((q: any) => q.q_number).join(', ')
                            : '—'
                          }
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