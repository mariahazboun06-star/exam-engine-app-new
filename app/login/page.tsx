'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      alert('Sign up successful! You can now log in.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard'); // Send them to the dashboard after logging in!
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-8 mt-20 bg-white shadow-lg rounded-lg border border-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Welcome Back</h1>
      
      {error && <p className="text-red-500 bg-red-50 p-3 rounded mb-4 text-sm">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="teacher@school.com"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="flex-1 bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Processing...' : 'Log In'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            className="flex-1 bg-white text-blue-600 border-2 border-blue-600 p-3 rounded-md font-bold hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}