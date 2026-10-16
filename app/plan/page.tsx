'use client';

import { useState, useEffect } from 'react';
import ExamDayScreen from '@/app/components/ExamDayScreen';

export default function StudyPlannerPage() {
  const [examDate, setExamDate] = useState<string | null>(null);
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
  const [unlockedStudy, setUnlockedStudy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentUser = { id: 'user-123' };
  const currentDailyQuestion = {
    id: 'q-2',
    text: 'What is 5 x 5?',
    options: ['10', '20', '25', '30'],
    correctAnswer: '25',
    mastery_level: 2
  };

  useEffect(() => {
    const fetchedDate = "2026-11-15"; 
    setExamDate(fetchedDate);

    if (fetchedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const targetDate = new Date(fetchedDate);
      targetDate.setHours(0, 0, 0, 0);

      const timeDiff = targetDate.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      setDaysUntilExam(days);
    }
  }, []);

  async function handleDailyReviewAnswer(selectedOption: string) {
    const isCorrect = selectedOption === currentDailyQuestion.correctAnswer;
    setFeedback(isCorrect ? "Correct!" : "Incorrect.");

    try {
      await fetch('/api/study/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          questionId: currentDailyQuestion.id,
          currentLevel: currentDailyQuestion.mastery_level || 1,
          isCorrect: isCorrect,
          examDate: examDate
        })
      });
    } catch (error) {
      console.error("Failed to update progress", error);
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
          The algorithm is taking the day off. Browse your notes, summaries, and course maps at your own pace without pressure or timer scores.
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
          Daily Review Question
        </span>
        
        <h3 className="text-lg font-medium text-slate-800">{currentDailyQuestion.text}</h3>
        
        <div className="space-y-3">
          {currentDailyQuestion.options.map((option: string) => (
            <button 
              key={option}
              onClick={() => handleDailyReviewAnswer(option)}
              className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-700"
            >
              {option}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl border text-sm font-semibold ${
            feedback.includes("Correct") 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}