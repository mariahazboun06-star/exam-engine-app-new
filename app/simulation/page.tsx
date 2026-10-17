'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAIFeedback } from '@/app/actions';

function TimedSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get('topicId');
  const courseId = searchParams.get('courseId');

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  
  // Timer State (Default 30 minutes countdown)
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  useEffect(() => {
    async function initSimulation() {
      let query = supabase.from('exam_questions').select('*');
      if (courseId) query = query.eq('course_id', courseId);
      if (topicId) query = query.eq('topic_id', topicId);

      const { data } = await query;
      if (data && data.length > 0) {
        setQuestions(data);
      }
      setLoading(false);
    }

    initSimulation();
  }, [topicId, courseId]);

  // Countdown timer handler
  useEffect(() => {
    if (loading || isFinished || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishSimulation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, questions]);

  const handleRecordAnswer = (isCorrect: boolean) => {
    const currentQ = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: isCorrect }));

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishSimulation();
    }
  };

  const handleFinishSimulation = async () => {
    setIsFinished(true);
    setGeneratingFeedback(true);

    const total = questions.length;
    const correctCount = Object.values(answers).filter(Boolean).length;
    const wrongQuestions = questions
      .filter((q) => answers[q.id] === false)
      .map((q) => q.question_text.slice(0, 40))
      .join("; ");

    // Fetch AI Feedback from Server Action
    const feedback = await getAIFeedback(correctCount, total, wrongQuestions || "None");
    setAiFeedback(feedback);
    setGeneratingFeedback(false);

    // Save exam attempt summary to progress table
    const { data: { user } } = await supabase.auth.getUser();
    if (user && questions.length > 0) {
      await supabase.from('user_question_progress').upsert(
        questions.map((q) => ({
          user_id: user.id,
          question_id: q.id,
          attempts_count: 1,
          is_first_try_correct: answers[q.id] ?? false,
          last_reviewed_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,question_id' }
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Loading simulation exam...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white border rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Simulation Questions Found</h2>
        <p className="text-slate-500 text-sm">Upload past exams to populate questions for this course or topic.</p>
        <button
          onClick={() => router.push(courseId ? `/courses/${courseId}/setup` : '/dashboard')}
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
        >
          Upload Course Materials
        </button>
      </div>
    );
  }

  if (isFinished) {
    const total = questions.length;
    const correctCount = Object.values(answers).filter(Boolean).length;
    const percentage = Math.round((correctCount / Math.max(1, total)) * 100);

    return (
      <div className="max-w-2xl mx-auto pt-8 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 text-3xl font-black">
            📊
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Simulation Complete!</h1>
            <p className="text-slate-500 text-sm">Here is your score breakdown and AI recommendations.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Score</span>
              <span className="text-xl font-extrabold text-indigo-600">{percentage}%</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Correct</span>
              <span className="text-xl font-extrabold text-emerald-600">{correctCount} / {total}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Time Left</span>
              <span className="text-xl font-extrabold text-slate-700">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 text-left space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI Tutor Performance Analysis</span>
            <p className="text-xs leading-relaxed text-indigo-950 font-medium">
              {generatingFeedback ? "Analyzing your performance with Gemini AI..." : aiFeedback}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push(courseId ? `/courses/${courseId}` : '/dashboard')}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Return to Course Hub
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Retake Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto pt-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
              Q{currentIndex + 1} of {questions.length}
            </span>
            {currentQ?.is_trap && (
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-extrabold">
                🔥 Corner Trap
              </span>
            )}
          </div>

          <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
            timeLeft < 300 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-slate-100 text-slate-700"
          }`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question View */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-slate-800 leading-relaxed">
            {currentQ?.question_text}
          </h2>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
            <strong className="block font-semibold text-slate-900">Self-Evaluation & Self-Correction:</strong>
            <p>Formulate your full mathematical answer on paper, then mark your result below.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleRecordAnswer(true)}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Solved Correctly (🟢)
            </button>
            <button
              onClick={() => handleRecordAnswer(false)}
              className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Incorrect / Stuck (🔴)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamSimulationPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading simulation...</div>}>
      <TimedSimulationContent />
    </Suspense>
  );
}