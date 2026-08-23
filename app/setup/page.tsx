"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [textbook, setTextbook] = useState<File | null>(null);
  const [exams, setExams] = useState<File[]>([]);
  const [hasSolutions, setHasSolutions] = useState(false);
  const [currentLecturer, setCurrentLecturer] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExamUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setExams((prev) => [...prev, ...filesArray]);
    }
  };

  const removeExam = (indexToRemove: number) => {
    setExams((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    // Initial Client-Side Validation
    if (!syllabus) {
      setError("Please upload a syllabus.");
      setIsUploading(false);
      return;
    }
    if (!textbook) {
      setError("Please upload a textbook.");
      setIsUploading(false);
      return;
    }
    if (exams.length < 20) {
      setError(`A minimum of 20 past exams is required. You have uploaded ${exams.length}.`);
      setIsUploading(false);
      return;
    }

    // Construct Form Data
    const formData = new FormData();
    // Using a temporary Course ID for V1 prototyping. In a full app, this comes from a "Create Course" step.
    formData.append('courseId', '00000000-0000-0000-0000-000000000001'); 
    formData.append('syllabus', syllabus);
    formData.append('textbook', textbook);
    exams.forEach(exam => formData.append('exams', exam));
    
    // Note: To fully map the toggles to the database, we would append them here 
    // and update our API route to parse them, but for this step we focus on the UI state.
    formData.append('hasSolutions', String(hasSolutions));
    formData.append('currentLecturer', String(currentLecturer));

    try {
      const response = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files.');
      }

      setSuccessMessage("Files successfully uploaded and queued for AI processing!");
      // Optionally redirect to the Plan Simulator or Dashboard here
      // setTimeout(() => router.push('/dashboard'), 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-blue-600">
          <h2 className="text-2xl font-bold text-white">Course Setup & Ingestion</h2>
          <p className="mt-1 text-blue-100 text-sm">
            Upload your course materials to generate your optimized study plan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Syllabus Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Course Syllabus (Required)</label>
            <div className="mt-2 flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> your syllabus PDF
                  </p>
                  {syllabus && <p className="mt-2 text-sm text-blue-600 font-medium">{syllabus.name}</p>}
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setSyllabus(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Textbook Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Course Textbook (Required)</label>
            <div className="mt-2 flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> your textbook PDF
                  </p>
                  {textbook && <p className="mt-2 text-sm text-blue-600 font-medium">{textbook.name}</p>}
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setTextbook(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Past Exams Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Past Exams (Minimum 20 Required)
            </label>
            <p className="text-xs text-gray-500 mb-2">Used strictly for AI training and final simulations.</p>
            <div className="mt-2 flex items-center justify-center w-full mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> multiple exam PDFs
                  </p>
                </div>
                <input type="file" accept=".pdf" multiple className="hidden" onChange={handleExamUpload} />
              </label>
            </div>
            
            {exams.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Exams: {exams.length} / 20+</p>
                <ul className="space-y-2">
                  {exams.map((exam, index) => (
                    <li key={index} className="flex justify-between items-center text-sm text-gray-600 bg-white p-2 rounded border shadow-sm">
                      <span className="truncate max-w-[80%]">{exam.name}</span>
                      <button type="button" onClick={() => removeExam(index)} className="text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700">Exam Context</h3>
            
            <label className="flex items-start cursor-pointer">
              <div className="flex items-center h-5">
                <input type="checkbox" checked={hasSolutions} onChange={(e) => setHasSolutions(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-gray-900">Exams contain solutions</span>
                <p className="text-gray-500">The system will separate and hide solutions during the training phase.</p>
              </div>
            </label>

            <label className="flex items-start cursor-pointer">
              <div className="flex items-center h-5">
                <input type="checkbox" checked={currentLecturer} onChange={(e) => setCurrentLecturer(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-gray-900">Current Lecturer</span>
                <p className="text-gray-500">Prioritize these exams to match your specific lecturer's patterns.</p>
              </div>
            </label>
          </div>

          {/* Feedback Messages */}
          {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
          {successMessage && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">{successMessage}</div>}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {isUploading ? 'Uploading & Processing...' : 'Upload Course Materials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}