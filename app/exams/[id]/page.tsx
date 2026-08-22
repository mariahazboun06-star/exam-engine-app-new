'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { getAIFeedback } from '@/app/actions'; // <-- Importing our new AI action!

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
}

export default function TakeExamPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function fetchExamData() {
      try {
        const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
        setExam(examData);

        const { data: questionsData } = await supabase.from('questions').select('*').eq('exam_id', examId);
        setQuestions(questionsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (examId) fetchExamData();
  }, [examId]);

  const handleOptionSelect = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
  };

  const handleSubmit = async () => {
    setIsGrading(true); // Start the loading animation
    
    let currentScore = 0;
    let wrongAnswersContext = "";
    
    // Grade the exam and collect wrong answers for the AI
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        currentScore += 1;
      } else {
        wrongAnswersContext += `Question: "${q.question_text}" (They guessed: ${answers[q.id]}). `;
      }
    });

    const finalScore = (currentScore / questions.length) * 100;
    setScore(finalScore);

    // 🤖 CALL THE AI! 🤖
    const aiMessage = await getAIFeedback(currentScore, questions.length, wrongAnswersContext);
    setFeedback(aiMessage);

    // Save result AND AI feedback to the database
    try {
      await supabase.from('submissions').insert([
        { exam_id: examId, score: finalScore, ai_feedback: aiMessage }
      ]);
    } catch (err) {
      console.error(err);
    }

    setIsGrading(false);
    setSubmitted(true);
  };

  if (loading) return <div className="p-10 text-center">Loading exam...</div>;
  if (!exam) return <div className="p-10 text-center text-red-600">Exam not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white shadow-lg rounded-lg border border-gray-100">
      <h1 className="text-3xl font-bold mb-2 text-blue-600">{exam.title}</h1>
      <p className="text-gray-600 mb-8 pb-4 border-b border-gray-200">{exam.description}</p>

      {isGrading ? (
        <div className="p-12 text-center">
          <div className="text-4xl mb-4 animate-bounce">🤖</div>
          <h2 className="text-2xl font-bold text-gray-800 animate-pulse">AI is grading your exam...</h2>
        </div>
      ) : submitted ? (
        <div className="space-y-6">
          <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center shadow-inner">
            <h2 className="text-3xl font-bold text-green-700 mb-3">Exam Completed!</h2>
            <p className="text-xl text-green-900">Your Score: <span className="font-black">{score.toFixed(1)}%</span></p>
          </div>
          
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <span>✨</span> AI Teacher Feedback
            </h3>
            <p className="text-blue-900 leading-relaxed">{feedback}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">{index + 1}. {q.question_text}</h3>
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt}
                      onChange={() => handleOptionSelect(q.id, opt)}
                      className="h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="w-full py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-bold shadow-md transition-all disabled:bg-gray-400"
          >
            Submit Exam
          </button>
        </div>
      )}
    </div>
  );
}