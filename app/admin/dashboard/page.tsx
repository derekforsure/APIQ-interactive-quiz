'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsSkeleton } from '@/components/ui/skeletons';


interface DashboardStats {
  totalQuestions: number;
  activeSessions: number;
  totalStudents: number;
  totalGroups: number;
  recentSessions: Array<{ id: string; name: string; created_at: string; is_active: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [questionsRes, sessionsRes, studentsRes, deptRes, recentSessionsRes, categoriesRes] = await Promise.all([
          fetch('/api/stats/total-questions'),
          fetch('/api/stats/active-sessions'),
          fetch('/api/stats/total-students'),
          fetch('/api/stats/total-groups'),
          fetch('/api/sessions?limit=3'),
          fetch('/api/questions/categories'),
        ]);

        const [questions, sessions, students, departments, recentSessions, categories] = await Promise.all([
          questionsRes.json(),
          sessionsRes.json(),
          studentsRes.json(),
          deptRes.json(),
          recentSessionsRes.json(),
          categoriesRes.json(),
        ]);

        setStats({
          totalQuestions: questions.total_questions || 0,
          activeSessions: sessions.active_sessions || 0,
          totalStudents: students.data?.total_students || 0,
          totalGroups: departments.total_departments || 0,
          recentSessions: recentSessions.data || [],
          categoryBreakdown: categories.data || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <StatsSkeleton />
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'General Knowledge': 'bg-indigo-500',
    'English': 'bg-purple-500',
    'Math': 'bg-blue-500',
    'Social Study': 'bg-pink-500',
    'IT': 'bg-cyan-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your quiz platform activity and statistics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalQuestions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeSessions || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Groups</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalGroups || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalStudents || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              <Link href="/admin/sessions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Session</p>
                  <p className="text-xs text-gray-500">Start a new quiz session</p>
                </div>
              </Link>

              <Link href="/admin/questions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Question</p>
                  <p className="text-xs text-gray-500">Expand your question bank</p>
                </div>
              </Link>

              <Link href="/admin/studentmag" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Students</p>
                  <p className="text-xs text-gray-500">Add or edit student accounts</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <Link href="/admin/sessions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              View all →
            </Link>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                stats.recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${session.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{session.name}</p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {session.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No sessions yet. Create your first one!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Questions by Category</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {stats.categoryBreakdown.map((cat) => {
                  const total = stats.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
                  const percentage = total > 0 ? (cat.count / total) * 100 : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm text-gray-500">{cat.count} questions</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${categoryColors[cat.category] || 'bg-gray-400'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Performance Overview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
          </div>
          <div className="p-5">
            <div className="space-y-6">
              {/* Session Activity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Session Activity</h3>
                  <span className="text-xs text-gray-500">Last 3 sessions</span>
                </div>
                {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            session.is_active ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            <svg className={`w-4 h-4 ${session.is_active ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{session.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.is_active 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {session.is_active ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-xs text-gray-500">No sessions yet</p>
                  </div>
                )}
              </div>

              {/* Question Bank Stats */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Question Bank</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Total Questions</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.totalQuestions || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-600 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.categoryBreakdown?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}