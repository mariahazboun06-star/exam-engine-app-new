'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ExamDayScreen from '@/app/components/ExamDayScreen';

export default function StudyPlannerPage() {
  const [examDate, setExamDate] = useState<string | null>(null);
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
  const [unlockedStudy, setUnlockedStudy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadPlannerState() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch user's first course or upcoming exam date
      const { data: exams } = await supabase
        .from('exams')
        .select('year')
        .order('year', { ascending: false })
        .limit(1);

      const targetExamDate = exams && exams.length > 0 
        ? `${exams[0].year}-11-15` 
        : "2026-11-15";

      setExamDate(targetExamDate);

      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const targetDate = new Date(targetExamDate);
      targetDate.setHours(0, 0, 0, 0);

      const timeDiff = targetDate.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      setDaysUntilExam(days);

      // Fetch dynamic review question
      const { data: questions } = await supabase
        .from('exam_questions')
        .select('*')
        .limit(1);

      if (questions && questions.length > 0) {
        setDailyQuestion(questions[0]);
      }
    }

    loadPlannerState();
  }, []);

  async function handleDailyReviewAnswer(isCorrect: boolean) {
    if (!currentUser || !dailyQuestion) return;

    setFeedback(isCorrect ? "Correct! Recorded in spaced repetition schedule." : "Recorded for review.");

    try {
      await fetch('/api/study/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          questionId: dailyQuestion.id,
          currentLevel: 1,
          isCorrect: isCorrect,
          examDate: examDate
        })
      });
    } catch (error) {
      console.error("Failed to update daily progress", error);
    }
  }

  if (daysUntilExam === 0 && !unlockedStudy) {
    return <ExamDayScreen onUnlockStudy={() => setUnlockedStudy(true)} />;
  }

  if (unlockedStudy) {
    return (
      <div className="max-w-4xl mx-auto pt-8 px-4 space-y-6">
        <div className="bg-indigo-50 border border-indigo-200/80 text-indigo-900 p-5 rounded-2xl text-sm leading-relaxed">
          <strong className="font-semibold block mb-1">Free Review Mode Active</strong>
          Browse your notes, summaries, and course maps at your own pace without pressure or timer scores.
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/matrix" className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 transition block group">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Topic Matrix</h3>
            <p className="text-slate-500 text-sm mt-1">Look over core concepts and exam breakdown across topics.</p>
          </a>
          
          <a href="/simulation" className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 transition block group">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Course Simulations</h3>
            <p className="text-slate-500 text-sm mt-1">Freely review practice questions at your leisure.</p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Daily Study Planner</h1>
          <p className="text-slate-500 text-sm mt-1">Your spaced repetition schedule for today.</p>
        </div>
        {daysUntilExam !== null && (
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl font-bold text-sm border border-indigo-100">
            {daysUntilExam} Days Left
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Daily Spaced Repetition Item
        </span>
        
        {dailyQuestion ? (
          <>
            <h3 className="text-lg font-medium text-slate-800">{dailyQuestion.question_text}</h3>
            
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => handleDailyReviewAnswer(true)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition"
              >
                Knew It Instantly (🟢)
              </button>
              <button 
                onClick={() => handleDailyReviewAnswer(false)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition"
              >
                Needs Review (🔴)
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No review questions scheduled for today. Great job!</p>
        )}

        {feedback && (
          <div className="p-4 rounded-xl border text-sm font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}