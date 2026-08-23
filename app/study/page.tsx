"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function StudyModePage() {
  const [deck, setDeck] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDueQuestions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all questions and progress
      const { data: questions } = await supabase.from('exam_questions').select('*').eq('user_id', user.id);
      const { data: progress } = await supabase.from('user_question_progress').select('*').eq('user_id', user.id);

      if (questions) {
        const now = new Date().getTime();
        // Added <string, any> and (p: any) to satisfy TypeScript
        const progressMap = new Map<string, any>(progress?.map((p: any) => [p.question_id, p]) || []);
        
        // Filter questions due for review or brand new
        const dueQuestions = questions.filter((q: any) => {
          const prog = progressMap.get(q.id);
          if (!prog) return true; // Brand new question
          return new Date(prog.next_review_date).getTime() <= now; // Due for review
        }).map((q: any) => ({
          ...q,
          currentLevel: progressMap.get(q.id)?.mastery_level || 0
        }));

        setDeck(dueQuestions);
      }
      setLoading(false);
    }
    fetchDueQuestions();
  }, []);

  const handleAnswer = async (isCorrect: boolean) => {
    const currentQ = deck[currentIndex];
    
    // Optimistically move to next question for a snappy UI
    setShowSolution(false);
    setCurrentIndex(prev => prev + 1);

    // Update backend progress
    await fetch('/api/study/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: currentQ.id,
        isCorrect,
        currentLevel: currentQ.currentLevel
      })
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Study Deck...</div>;
  
  // Empty State / All caught up
  if (currentIndex >= deck.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">All caught up! 🎉</h2>
        <p className="text-gray-600">You have completed all your reviews. Check back later!</p>
      </div>
    );
  }

  const currentQuestion = deck[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Progress Header */}
        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
          <span>Card {currentIndex + 1} of {deck.length}</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
            Mastery Level {currentQuestion.currentLevel}
          </span>
        </div>

        {/* Flashcard */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-8 flex-grow">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              {currentQuestion.topic || 'General Practice'}
            </span>
            <h2 className="text-xl font-medium text-gray-900 whitespace-pre-wrap mt-4">
              {currentQuestion.question_text}
            </h2>
          </div>

          {!showSolution ? (
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setShowSolution(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
                Reveal Solution
              </button>
            </div>
          ) : (
            <div className="p-6 bg-indigo-50 border-t border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 mb-2 uppercase tracking-wider">Solution</h3>
              <p className="text-indigo-900 mb-8 whitespace-pre-wrap">{currentQuestion.solution_text || "No solution provided. Grade yourself based on your knowledge."}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAnswer(false)} className="py-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-bold transition-colors">
                  Forgot it ❌
                </button>
                <button onClick={() => handleAnswer(true)} className="py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-colors">
                  Got it right ✅
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}