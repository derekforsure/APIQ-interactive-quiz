'use client';

import { useState, useEffect, useRef } from 'react';

interface Question {
  id: number;
  text: string;
  answer: string;
}

interface QuizState {
  isQuizStarted: boolean;
  isQuizEnded: boolean;
  scoringMode: 'individual' | 'department';
  isBuzzerActive: boolean;
  activeStudent: string | null;
  currentQuestionIndex: number;
  scores: Record<string, number>;
  remainingTime: number;
  ineligibleStudents: string[];
  showAnswer: boolean;
}

interface QuizControlProps {
  sessionId: string;
  onScoringModeChange?: (mode: 'individual' | 'department') => void;
}

export default function QuizControl({ sessionId, onScoringModeChange }: QuizControlProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [finalLeaderboardScores, setFinalLeaderboardScores] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctSoundRef.current = new Audio('/sounds/Correct Tick Sound Effect.mp3');
    incorrectSoundRef.current = new Audio('/sounds/Wrong Tick Sound Effect.mp3');
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/questions`);
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.data);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [sessionId]);

  useEffect(() => {
    const wsUrl = `ws://localhost:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'admin', sessionId } }));
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (['QUIZ_STATE', 'QUIZ_STARTED', 'BUZZER_ACTIVATED', 'SCORES_UPDATED', 'NEW_QUESTION', 'TIMER_UPDATE', 'BUZZER_OPEN', 'QUIZ_ENDED'].includes(data.type)) {
        setQuizState(data.payload);
        if (data.payload.scoringMode && onScoringModeChange) {
          onScoringModeChange(data.payload.scoringMode);
        }

        if (data.type === 'QUIZ_ENDED') {
          try {
            const response = await fetch(`/api/sessions/${sessionId}/scores?mode=${data.payload.scoringMode}`);
            if (response.ok) {
              const scoresData = await response.json();
              const fetchedScores: Record<string, number> = {};
              scoresData.data.forEach((item: { name: string; score: number }) => {
                fetchedScores[item.name] = item.score;
              });
              setFinalLeaderboardScores(fetchedScores);
            } else {
              console.error('Failed to fetch final scores:', response.statusText);
              setFinalLeaderboardScores(null);
            }
          } catch (error) {
            console.error('Error fetching final scores:', error);
            setFinalLeaderboardScores(null);
          }
        } else if (data.type === 'START_QUIZ') {
          setFinalLeaderboardScores(null); // Clear final scores when a new quiz starts
        }
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error details:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
    };
  }, [sessionId, onScoringModeChange]);

  const sendCommand = (type: string, payload = {}) => {
    ws.current?.send(JSON.stringify({ type, payload: { ...payload, sessionId } }));
  };

  const handleNextQuestion = () => {
    if (!quizState) return;
    const nextQuestionIndex = quizState.currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      sendCommand('NEXT_QUESTION', { questionId: questions[nextQuestionIndex].id });
    } else {
      sendCommand('END_QUIZ');
    }
  };

  const handleJudgeAnswer = (correct: boolean) => {
    if (quizState?.activeStudent) {
      if (correct) {
        correctSoundRef.current?.play();
      } else {
        incorrectSoundRef.current?.play();
      }
      sendCommand('JUDGE_ANSWER', { correct, questionId: questions[quizState.currentQuestionIndex]?.id });
    }
  };

  const handleScoringModeChange = (mode: 'individual' | 'department') => {
    sendCommand('SET_SCORING_MODE', { mode });
    if (onScoringModeChange) {
      onScoringModeChange(mode);
    }
  };

  const openPresentationView = () => {
    window.open(`/presentation/${sessionId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  const currentQuestion = questions[quizState?.currentQuestionIndex ?? 0];
  const isQuizEnded = quizState?.isQuizEnded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quiz Control Panel</h2>
          <p className="text-sm text-gray-600 mt-1">
            {quizState?.isQuizEnded ? 'Quiz Ended' : quizState?.isQuizStarted ? 'In Progress' : 'Not Started'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mode:</span>
            <select
              value={quizState?.scoringMode || 'individual'}
              onChange={(e) => handleScoringModeChange(e.target.value as 'individual' | 'department')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={Boolean(quizState?.isQuizStarted)}
            >
              <option value="individual">Individual</option>
              <option value="department">Department</option>
            </select>
          </div>
          <button
            onClick={openPresentationView}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Presentation
          </button>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Question</h3>
          </div>
          <div className="p-5">
            {isQuizEnded ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-16 w-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-semibold text-gray-900 mt-4">Quiz Completed</p>
                <p className="text-sm text-gray-500 mt-1">All questions have been answered</p>
              </div>
            ) : quizState?.isQuizStarted ? (
              currentQuestion ? (
                <div className="space-y-6">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-3">
                      Question {quizState?.currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.text}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Answer</span>
                      {quizState.showAnswer && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Visible
                        </span>
                      )}
                    </div>
                    <p className={`text-base ${quizState.showAnswer ? 'text-gray-900' : 'text-gray-400 select-none'}`}>
                      {quizState.showAnswer ? currentQuestion.answer : '••••••••••••••••'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No more questions available</p>
                </div>
              )
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500 mt-2">Waiting to start quiz...</p>
              </div>
            )}
          </div>
          <div className="p-5 border-t border-gray-200 space-y-2">
            <div className="flex gap-2">
              {isQuizEnded ? (
                <button
                  onClick={() => sendCommand('START_QUIZ')}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start New Quiz
                </button>
              ) : Boolean(!quizState?.isQuizStarted && !isQuizEnded) ? (
                <button
                  onClick={() => sendCommand('START_QUIZ')}
                  disabled={Boolean(!isConnected || !quizState)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Quiz
                </button>
              ) : (
                <>
                  <button
                    onClick={handleNextQuestion}
                    disabled={Boolean(!quizState?.isQuizStarted || quizState.currentQuestionIndex >= questions.length - 1 || !!quizState.activeStudent || isQuizEnded)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Question
                  </button>
                  <button
                    onClick={() => sendCommand('TOGGLE_ANSWER_VISIBILITY')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {quizState?.showAnswer ? 'Hide' : 'Reveal'}
                  </button>
                </>
              )}
            </div>
            {Boolean(quizState?.isQuizStarted && !isQuizEnded) && (
              <button
                onClick={() => sendCommand('END_QUIZ')}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                End Quiz
              </button>
            )}
          </div>
        </div>

        {/* Scores Panel */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {isQuizEnded ? 'Final Leaderboard' : 'Current Round Leaderboard'}
            </h3>
          </div>
          <div className="p-5">
            {(isQuizEnded && finalLeaderboardScores) ? (
              <div className="space-y-2">
                {Object.entries(finalLeaderboardScores)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([name, score], index) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                          index === 0 ? 'bg-amber-100 text-amber-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{score}</span>
                    </div>
                  ))}
              </div>
            ) : (quizState?.scores && Object.keys(quizState.scores).length > 0) ? (
              <div className="space-y-2">
                {Object.entries(quizState.scores)
                  .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                  .map(([name, score], index) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                          index === 0 ? 'bg-amber-100 text-amber-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{score}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm text-gray-500 mt-2">No scores yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Live State Panel */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Live Status</h3>
          </div>
          <div className="p-5">
            {quizState ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Timer</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{(quizState.remainingTime / 1000).toFixed(1)}</p>
                      <span className="text-sm text-gray-500">seconds</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Buzzer Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${quizState.isBuzzerActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className={`text-sm font-medium ${quizState.isBuzzerActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {quizState.isBuzzerActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">Active Participant</span>
                  <div className="mb-4">
                    {quizState.activeStudent ? (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-indigo-900">{quizState.activeStudent}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJudgeAnswer(true)}
                      disabled={Boolean(quizState.activeStudent === null || isQuizEnded)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Correct
                    </button>
                    <button
                      onClick={() => handleJudgeAnswer(false)}
                      disabled={Boolean(quizState.activeStudent === null || isQuizEnded)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Incorrect
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">Ineligible Participants</span>
                  {quizState.ineligibleStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {quizState.ineligibleStudents.map((student) => (
                        <span key={student} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          {student}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">None</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                <p className="text-sm text-gray-500">Establishing connection...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}