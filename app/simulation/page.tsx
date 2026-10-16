'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SimulationContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');
  const courseId = searchParams.get('courseId');
  
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  const currentUser = { id: 'user-123' }; 

  useEffect(() => {
    async function loadSimulation() {
      setCurrentQuestion({
        id: 'q-1',
        text: 'Calculate the derivative of x^2.',
        options: ['x', '2x', 'x^2', '2'],
        correctAnswer: '2x',
        total_attempts: 0,
        first_try_correct: null
      });
      setLoading(false);
    }

    loadSimulation();
  }, [topicId, courseId]);

  async function handleAnswerSelection(selectedOption: string) {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    setFeedback(isCorrect ? "Correct!" : "Incorrect. The right answer was " + currentQuestion.correctAnswer);

    const newAttempts = currentQuestion.total_attempts + 1;
    const firstTryCorrect = currentQuestion.total_attempts === 0 && isCorrect ? true : false;

    try {
      await fetch('/api/study/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,          
          questionId: currentQuestion.id,  
          isCorrect: isCorrect,
          totalAttempts: newAttempts,
          firstTryCorrect: firstTryCorrect
        })
      });
    } catch (error) {
      console.error("Failed to update attempt progress", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Loading simulation...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {topicId ? "Topic Practice Mode" : "Exam Simulation"}
          </h1>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">
            Question 1
          </span>
        </div>
        
        {currentQuestion ? (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-slate-800 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option: string) => (
                <button 
                  key={option}
                  onClick={() => handleAnswerSelection(option)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all font-medium text-slate-700 text-sm flex items-center justify-between group"
                >
                  <span>{option}</span>
                  <span className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-indigo-500 group-hover:bg-indigo-500 transition-colors"></span>
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
        ) : (
          <div className="text-center py-12 text-slate-500 font-medium">
            No questions available. You have mastered this section!
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamSimulationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Loading simulation page...</div>
      </div>
    }>
      <SimulationContent />
    </Suspense>
  );
}