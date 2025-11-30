'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      toast.success('Signup successful! Please check your email to verify.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-indigo-100 opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-purple-100 opacity-40 animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-blue-100 opacity-45 animate-pulse-slow animation-delay-4000"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-lg bg-indigo-200 opacity-50 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 rounded-lg bg-purple-200 opacity-50 animate-float animation-delay-3000"></div>
        <div className="absolute top-1/4 right-1/3 w-20 h-20 rounded-lg bg-blue-200 opacity-50 animate-float animation-delay-5000"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/5 left-2/3 w-24 h-24 rounded-full bg-indigo-50 opacity-60 animate-float animation-delay-1500"></div>
        <div className="absolute bottom-1/3 right-1/5 w-32 h-32 rounded-full bg-purple-50 opacity-60 animate-float animation-delay-3500"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 text-center">
            <div className="mx-auto w-50 h-50 mb-4">
              <Image src="/icon.svg" alt="APIQ Logo" width={1000} height={1000} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Create Admin Account</h1>
            <p className="text-sm text-gray-600 mt-1">Sign up to get a <span className="font-semibold text-indigo-600">7-day free trial</span></p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <p className="text-xs text-center text-gray-500">
              Already have an account? <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-3500 {
          animation-delay: 3.5s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-5000 {
          animation-delay: 5s;
        }
      `}</style>
    </div>
  );
}
