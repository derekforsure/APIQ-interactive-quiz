'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Scoreboard from '@/components/Scoreboard';
import QuizControl from '@/components/QuizControl';
import SessionQrCode from '@/components/SessionQrCode';
import SessionScoreOverview from '@/components/SessionScoreOverview';

import { toast } from 'sonner';
import { useLiveCounts } from '@/hooks/useLiveCounts';
import { TableSkeleton, StatsSkeleton } from '@/components/ui/skeletons';

interface Participant {
  student_id: string;
  name: string;
}

interface Question {
  id: number;
  text: string;
  answer: string;
  incorrect_option_1: string;
  incorrect_option_2: string;
  incorrect_option_3: string;
  category: string;
  difficulty: number;
  topic: string;
  question_type: string;
  created_at: string;
  is_active: number;
}

interface SessionDetails {
  id: string;
  name: string;
  created_at: string;
  is_active: number;
}

const categoryColors: Record<string, string> = {
  'General Knowledge': 'bg-indigo-50 text-indigo-700',
  'English': 'bg-purple-50 text-purple-700',
  'Math': 'bg-blue-50 text-blue-700',
  'Social Study': 'bg-pink-50 text-pink-700',
  'IT': 'bg-cyan-50 text-cyan-700'
};

const difficultyColors = {
  1: 'bg-emerald-50 text-emerald-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-rose-50 text-rose-700'
};

export default function SessionParticipantsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  // Removed local participants and sessionQuestions state
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedQuestionToAdd, setSelectedQuestionToAdd] = useState<string>('');
  // loading state is now handled by useLiveCounts for participants/questions
  const [sessionLoading, setSessionLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'quiz-control' | 'questions' | 'participants' | 'scoreboard' | 'score-over-time'>('quiz-control');
  const [currentScoringMode, setCurrentScoringMode] = useState<'individual' | 'department'>('individual');

  // Use custom hook for live counts and polling
  const { 
    participants, 
    sessionQuestions, 
    loading: liveCountsLoading, 
    refresh: refreshLiveCounts 
  } = useLiveCounts(sessionId, selectedTab);

  const fetchSessionDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data: SessionDetails[] = await response.json();
      const currentSession = data.find(session => session.id === sessionId);
      if (currentSession) {
        setSessionDetails(currentSession);
      } else {
        setError("Session not found");
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch session details:', err);
    }
  }, [sessionId]);

  // Removed local fetchParticipants and fetchSessionQuestions


  const fetchAllQuestions = useCallback(async (category: string = 'all') => {
    try {
      const url = category === 'all' 
        ? '/api/questions' 
        : `/api/questions?category=${encodeURIComponent(category)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setAllQuestions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch all questions:', err);
      setAllQuestions([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/questions/categories');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setCategories(data.data || []);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    
    // Fetch session details and categories
    // Participants and questions are handled by useLiveCounts
    const loadInitialData = async () => {
      setSessionLoading(true);
      await Promise.all([
        fetchSessionDetails(),
        fetchCategories()
      ]);
      setSessionLoading(false);
    };

    loadInitialData();
  }, [sessionId, fetchSessionDetails, fetchCategories]);

  useEffect(() => {
    fetchAllQuestions(selectedCategoryFilter);
  }, [fetchAllQuestions, selectedCategoryFilter]);

  const handleRemoveParticipant = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_id: studentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove participant');
      }

      // Refresh participants list using the hook's refresh function
      await refreshLiveCounts();
      toast.success('Participant removed successfully');
    } catch (err) {
      toast.error(`Failed to remove participant: ${(err as Error).message}`);
      console.error('Error removing participant:', err);
    }
  };

  const handleRemoveSessionQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to remove this question from the session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove question from session');
      }

      // Refresh questions list using the hook's refresh function
      await refreshLiveCounts();
      toast.success('Question removed from session');
    } catch (err) {
      toast.error(`Failed to remove question: ${(err as Error).message}`);
      console.error('Error removing question from session:', err);
    }
  };

  const handleAddQuestionToSession = async () => {
    if (!selectedQuestionToAdd) {
      alert('Please select a question to add.');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question_id: parseInt(selectedQuestionToAdd) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add question to session');
      }

      setSelectedQuestionToAdd('');
      // Refresh questions list using the hook's refresh function
      await refreshLiveCounts();
      toast.success('Question added to session');
    } catch (err) {
      toast.error(`Failed to add question: ${(err as Error).message}`);
      console.error('Error adding question to session:', err);
    }
  };

  const handleScoringModeChange = useCallback((mode: 'individual' | 'department') => {
    setCurrentScoringMode(mode);
  }, []);

  const handleToggleActivation = async () => {
    if (!sessionDetails) return;
    
    try {
      const response = await fetch('/api/sessions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          is_active: !sessionDetails.is_active
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update session');
      }
      
      // Refresh session details
      await fetchSessionDetails();
    } catch (err) {
      alert(`Failed to toggle session: ${(err as Error).message}`);
      console.error('Error toggling session:', err);
    }
  };

  // Removed local polling useEffect as it's handled by useLiveCounts


  return (
    <div className="relative space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{sessionDetails?.name || "Session Details"}</h1>
            {sessionDetails && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                sessionDetails.is_active 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {sessionDetails.is_active ? '✓ Active' : 'Inactive'}
              </span>
            )}
            {sessionDetails && (
              <button
                onClick={handleToggleActivation}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sessionDetails.is_active
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {sessionDetails.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
          <p className="text-gray-600 mb-2 mt-2">
            Session ID: <span className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 text-sm">{sessionId}</span>
          </p>
        </div>
        <div className="flex-shrink-0">
          {sessionId && <SessionQrCode sessionId={sessionId} />}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setSelectedTab('quiz-control')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'quiz-control'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Quiz Control
          </button>
          <button
            onClick={() => setSelectedTab('questions')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'questions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions ({sessionQuestions.length})
          </button>
          <button
            onClick={() => setSelectedTab('participants')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'participants'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Participants ({participants.length})
          </button>
          <button
            onClick={() => setSelectedTab('scoreboard')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'scoreboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scoreboard
          </button>
          <button
            onClick={() => setSelectedTab('score-over-time')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'score-over-time'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Score Over Time
          </button>
        </nav>
      </div>

      <div>
        {selectedTab === 'participants' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
            </div>
            <div className="overflow-x-auto">
              {liveCountsLoading ? (
                <TableSkeleton />
              ) : participants.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No participants have joined this session yet.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participants.map((participant) => (
                      <tr key={participant.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            {participant.student_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {participant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleRemoveParticipant(participant.student_id)} 
                            className="text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'questions' && (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add Question to Session</h2>
              <div className="flex gap-4">
                <select
                  value={selectedQuestionToAdd}
                  onChange={(e) => setSelectedQuestionToAdd(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a question...</option>
                  {allQuestions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.text.substring(0, 100)}...
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddQuestionToSession}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Session Questions</h3>
                {liveCountsLoading ? (
                  <TableSkeleton />
                ) : sessionQuestions.length === 0 ? (
                  <p className="text-gray-500">No questions in this session yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {sessionQuestions.map((question) => (
                      <li key={question.id} className="py-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{question.text}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[question.category] || 'bg-gray-100 text-gray-800'}`}>
                              {question.category}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[question.difficulty as 1 | 2 | 3] || 'bg-gray-100 text-gray-800'}`}>
                              {question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSessionQuestion(question.id)}
                          className="ml-4 text-sm text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
              )}
            </div>
          </div>
          </div>
        )}

        {selectedTab === 'scoreboard' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <Scoreboard
              sessionId={sessionId}
              scoringMode={currentScoringMode}
            />
          </div>
        )}

        {selectedTab === 'quiz-control' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <QuizControl sessionId={sessionId} onScoringModeChange={handleScoringModeChange} />
          </div>
        )}

        {selectedTab === 'score-over-time' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <SessionScoreOverview sessionId={sessionId} />
          </div>
        )}
      </div>
    </div>
  );
}