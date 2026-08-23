"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch the most recently created plan for this user
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setPlan(data);
      setLoading(false);
    }

    fetchLatestPlan();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading your study hub...</div>;
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-700 mb-2">No active study plan found.</h2>
        <button onClick={() => router.push('/context-input')} className="text-blue-600 hover:underline">
          Create a Study Plan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-blue-600">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Study Hub</h1>
            <p className="text-sm text-gray-500 mt-1">Target Grade: <span className="font-semibold text-gray-700">{plan.target_grade}</span> | Exam Date: <span className="font-semibold text-gray-700">{new Date(plan.exam_date).toLocaleDateString()}</span></p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${plan.is_feasible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {plan.is_feasible ? 'Goal is Feasible' : 'High Risk: Adjust Hours'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Required Effort</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{plan.total_required_hours} <span className="text-lg font-medium text-gray-500">hrs</span></p>
            <p className="text-xs text-gray-400 mt-1">Based on knowledge map complexity & target grade.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Available Time</h3>
            <p className={`text-3xl font-extrabold mt-2 ${plan.total_available_hours >= plan.total_required_hours ? 'text-blue-600' : 'text-red-600'}`}>
              {plan.total_available_hours} <span className="text-lg font-medium text-gray-500">hrs</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Based on your commitment of {plan.study_hours_per_week} hrs/week.</p>
          </div>
        </div>

        {/* Weekly Schedule Chunking */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Weekly Focus</h3>
          </div>
          <div className="p-6">
            {plan.schedule_data && plan.schedule_data.length > 0 ? (
              <div className="space-y-6">
                {plan.schedule_data.map((weekData: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-700 mb-3 border-b pb-2">Week {weekData.week}</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {weekData.focus.map((item: any, i: number) => (
                        <li key={i} className="text-sm bg-gray-50 p-2 rounded flex flex-col">
                          <span className="text-xs text-gray-500">{item.topicName}</span>
                          <span className="font-medium text-gray-800">{item.conceptName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No specific concepts could be extracted to form a schedule.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}