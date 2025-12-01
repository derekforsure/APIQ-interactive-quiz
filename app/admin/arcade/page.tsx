"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminArcadePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎮 Arcade</h1>
        <p className="text-gray-600 mt-1">Fun games and activities for your students</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="bg-indigo-50 p-6 rounded-full mb-6">
          <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h2>
        <p className="text-gray-500 text-center max-w-md">
          We're working hard to bring you exciting new game modes. 
          Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}
