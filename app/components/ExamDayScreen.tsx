'use client';

import { useRouter } from 'next/navigation';

export default function ExamDayScreen({ onUnlockStudy }: { onUnlockStudy: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10 space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 text-2xl font-bold">
          🎉
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">It's Exam Day!</h1>
          <p className="text-slate-600 font-medium">You've put in the hours, and the data shows you are ready.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left text-sm text-slate-600 space-y-2">
          <span className="inline-block text-xs font-bold text-indigo-600 uppercase tracking-wider">Our Recommendation</span>
          <p className="leading-relaxed">
            Step away from active testing today. Your brain needs time to consolidate formulas and concepts. Taking a breather right now gives your recall memory the best chance to perform at peak capacity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => router.push('/')} 
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition text-sm"
          >
            Close & Rest (Recommended)
          </button>
          
          <button 
            onClick={onUnlockStudy}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition text-sm"
          >
            Free Course Review
          </button>
        </div>
      </div>
    </div>
  );
}