'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Check if a user is already logged in when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Listen for any login or logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Send them back to the home page after logging out
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-blue-700 tracking-tight">
          ExamEngine
        </Link>
        
        <div className="space-x-4 flex items-center">
          <Link href="/exams" className="text-gray-600 hover:text-blue-600 font-medium">
            Student View
          </Link>

          {/* This is the smart part! If 'user' exists, show Teacher tools. If not, show Login. */}
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
                Teacher Dashboard
              </Link>
              <Link href="/create-exam" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
                + Create Exam
              </Link>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors ml-4"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium transition-colors ml-4">
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}