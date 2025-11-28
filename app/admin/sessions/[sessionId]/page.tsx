'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Scoreboard from '@/components/Scoreboard';
import QuizControl from '@/components/QuizControl';
import SessionQrCode from '@/components/SessionQrCode';
import SessionScoreOverview from '@/components/SessionScoreOverview';

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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedQuestionToAdd, setSelectedQuestionToAdd] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'quiz-control' | 'questions' | 'participants' | 'scoreboard' | 'score-over-time'>('quiz-control');
  const [currentScoringMode, setCurrentScoringMode] = useState<'individual' | 'department'>('individual');

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

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/participants`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data: Participant[] = await response.json();
      setParticipants(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch participants:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSessionQuestions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/sessions/${sessionId}/questions`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSessionQuestions(data.data || []);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch session questions:', err);
      setSessionQuestions([]);
    }
  }, [sessionId]);

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
    
    // Fetch these in parallel for better performance
    Promise.all([
      fetchSessionDetails(),
      fetchParticipants(),
      fetchSessionQuestions(),
      fetchCategories()
    ]);
  }, [sessionId, fetchSessionDetails, fetchParticipants, fetchSessionQuestions, fetchCategories]);

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

      fetchParticipants();
    } catch (err) {
      alert(`Failed to remove participant: ${(err as Error).message}`);
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

      fetchSessionQuestions();
    } catch (err) {
      alert(`Failed to remove question: ${(err as Error).message}`);
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
      fetchSessionQuestions();
    } catch (err) {
      alert(`Failed to add question: ${(err as Error).message}`);
      console.error('Error adding question to session:', err);
    }
  };

  const handleScoringModeChange = useCallback((mode: 'individual' | 'department') => {
    setCurrentScoringMode(mode);
  }, []);

  return (
    <div className="relative space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{sessionDetails?.name || "Session Details"}</h1>
          <p className="text-gray-600 mt-2">
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
            Questions
          </button>
          <button
            onClick={() => setSelectedTab('participants')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'participants'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Participants
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
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">Loading participants...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Session Questions</h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedQuestionToAdd}
                  onChange={(e) => setSelectedQuestionToAdd(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="">Select a question</option>
                  {allQuestions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.text.length > 50 ? question.text.substring(0, 50) + '...' : question.text}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddQuestionToSession}
                  disabled={!selectedQuestionToAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">Loading questions...</p>
                </div>
              ) : sessionQuestions.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No questions added to this session yet.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question & Answers
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionQuestions.map((question) => (
                      <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 align-top">
                          <div className="max-w-md font-medium" title={question.text}>
                            {question.text}
                          </div>
                          <ul className="mt-2 space-y-1 text-xs">
                            <li className="text-emerald-700 font-semibold">✓ {question.answer}</li>
                            <li className="text-red-700">✗ {question.incorrect_option_1}</li>
                            <li className="text-red-700">✗ {question.incorrect_option_2}</li>
                            <li className="text-red-700">✗ {question.incorrect_option_3}</li>
                          </ul>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[question.category] || 'bg-gray-100 text-gray-700'}`}>
                            {question.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[question.difficulty as keyof typeof difficultyColors]}`}>
                            {question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                          <button
                            onClick={() => handleRemoveSessionQuestion(question.id)}
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