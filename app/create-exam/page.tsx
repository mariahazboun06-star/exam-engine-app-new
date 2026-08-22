'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface QuestionInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export default function CreateExamPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updated = [...questions];
    if (field === 'questionText') updated[index].questionText = value;
    if (field === 'correctAnswer') updated[index].correctAnswer = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Insert Exam into Database
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert([{ title, description }])
        .select()
        .single();

      if (examError) throw examError;

      // 2. Prepare & Insert Questions
      const questionsToInsert = questions.map((q) => ({
        exam_id: examData.id,
        question_text: q.questionText,
        options: q.options,
        correct_answer: q.correctAnswer,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setMessage('Exam created and saved to Supabase successfully!');
      setTitle('');
      setDescription('');
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    } catch (err: any) {
      setMessage(`Error saving exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Exam</h1>

      {message && (
        <div className={`p-4 mb-4 rounded ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Mathematics Midterm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Covers chapters 1 through 4"
          />
        </div>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-xl font-semibold text-gray-800">Questions</h2>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
            <h3 className="font-medium text-gray-700">Question {qIdx + 1}</h3>

            <div>
              <input
                type="text"
                required
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter question text"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Option {oIdx + 1}</label>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${oIdx + 1}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>
              <input
                type="text"
                required
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Must match one option exactly"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
        >
          + Add Another Question
        </button>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Saving Exam...' : 'Save Exam to Database'}
          </button>
        </div>
      </form>
    </div>
  );
}