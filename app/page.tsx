import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl font-black text-blue-700 mb-6 tracking-tight">
        Welcome to ExamEngine
      </h1>
      <p className="text-xl text-gray-600 mb-12 max-w-2xl">
        The ultimate platform for creating, managing, and taking exams. 
        Choose your role below to get started!
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link 
          href="/exams"
          className="px-8 py-4 bg-white border-2 border-blue-600 text-blue-700 rounded-lg text-lg font-bold hover:bg-blue-50 transition-all shadow-sm"
        >
          🎓 I am a Student
        </Link>

        <Link 
          href="/create-exam"
          className="px-8 py-4 bg-blue-600 border-2 border-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-all shadow-md"
        >
          📝 I am a Teacher
        </Link>
      </div>
    </div>
  );
}