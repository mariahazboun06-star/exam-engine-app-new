"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContextInputPage() {
  const router = useRouter();
  const [examDate, setExamDate] = useState('');
  const [studyHours, setStudyHours] = useState<number>(15);
  const [targetGrade, setTargetGrade] = useState('A');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Construct the context payload
    const contextData = {
      courseId: '00000000-0000-0000-0000-000000000001', // Mock ID for V1
      examDate,
      studyHoursPerWeek: studyHours,
      targetGrade
    };

    try {
      // We will create this API route in the Plan Simulator phase
      console.log("Submitting context data:", contextData);
      
      // Simulating a network request delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      alert("Study parameters saved! Ready to generate your optimal plan.");
      // router.push('/simulator'); // We will redirect here later
      
    } catch (error) {
      console.error("Failed to save context", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-blue-600">
          <h2 className="text-2xl font-bold text-white">Study Plan Parameters</h2>
          <p className="mt-1 text-blue-100 text-sm">
            Tell us about your schedule and goals so the AI can build a feasible plan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Exam Date Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Final Exam Date</label>
            <p className="text-xs text-gray-500 mb-2">When is the big day?</p>
            <input 
              type="date" 
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Study Hours Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Available Study Hours (Per Week)
            </label>
            <p className="text-xs text-gray-500 mb-4">Be realistic about how much time you can dedicate.</p>
            
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="1" 
                max="40" 
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-bold text-blue-600 w-12 text-center">
                {studyHours}h
              </span>
            </div>
          </div>

          {/* Target Grade Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Target Grade</label>
            <p className="text-xs text-gray-500 mb-2">What score are you aiming for?</p>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Pass">Just Pass (C / ~70%)</option>
              <option value="B">Good (B / ~80%)</option>
              <option value="A">Excellent (A / ~90%)</option>
              <option value="A+">Mastery (A+ / 95%+)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {isSubmitting ? 'Saving Parameters...' : 'Confirm Parameters'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}