'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Leaderboard from '@/components/Leaderboard'; // Import the Leaderboard component

interface Question {
  id: number;
  text: string;
  answer: string;
}

interface QuizState {
  scoringMode: 'individual' | 'department';
  isBuzzerActive: boolean;
  activeStudent: string | null;
  currentQuestionIndex: number;
  scores: Record<string, number>;
  remainingTime: number;
  showAnswer: boolean;
  isQuizEnded: boolean; // Added
}

export default function PresentationPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [finalLeaderboardScores, setFinalLeaderboardScores] = useState<Record<string, number> | null>(null); // Added
  const [loading, setLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Quiz Timer Music.mp3');
      audioRef.current.loop = true;
    }

    if (quizState?.isBuzzerActive && quizState.remainingTime > 0) {
      audioRef.current.play().catch(error => console.error("Audio play failed:", error));
    } else {
      audioRef.current.pause();
    }
  }, [quizState?.isBuzzerActive, quizState?.remainingTime]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      if (!sessionId) return;
      try {
        const response = await fetch(`/api/sessions/${sessionId}/questions`);
        if (!response.ok) {
          throw new Error(`Error fetching questions: ${response.status}`);
        }
        const data = await response.json();
        setQuestions(data.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `ws://${window.location.hostname}:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected for presentation');
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'spectator', sessionId } }));
    };

    ws.current.onmessage = async (event) => { // Added async
      const data = JSON.parse(event.data);
      if (['QUIZ_STATE', 'QUIZ_STARTED', 'BUZZER_ACTIVATED', 'SCORES_UPDATED', 'NEW_QUESTION', 'TIMER_UPDATE', 'BUZZER_OPEN', 'QUIZ_ENDED'].includes(data.type)) { // Added QUIZ_ENDED
        setQuizState(data.payload);

        if (data.type === 'QUIZ_ENDED') {
          // Fetch final scores
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
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected from presentation');
    };

    return () => {
      ws.current?.close();
    };
  }, [sessionId]);

  if (loading) {
    return <Skeleton className="h-screen w-full bg-gray-900" />;
  }

  const currentQuestion = questions[quizState?.currentQuestionIndex ?? 0];
  const timerExpired = quizState && quizState.remainingTime <= 0;

  return (
    <div className="relative bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-900 text-white h-screen overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-12">
        {quizState?.isQuizEnded && finalLeaderboardScores ? (
          <Leaderboard scores={finalLeaderboardScores} />
        ) : !quizState ? (
          <div className="text-center animate-fade-in">
            <div className="mb-8 inline-block">
              <div className="w-32 h-32 border-8 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 animate-pulse">
              Waiting for quiz to start...
            </h1>
          </div>
        ) : (
          <div className="text-center max-w-5xl w-full animate-fade-in">
            {/* Question number badge */}
            <div className="inline-flex items-center justify-center mb-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-2xl transform hover:scale-105 transition-transform">
              <span className="text-3xl font-bold">Question {quizState.currentQuestionIndex + 1}</span>
              <span className="ml-4 text-2xl opacity-75">/ {questions.length}</span>
            </div>
            
            {/* Question text */}
            {currentQuestion ? (
              <div className="mb-12 p-10 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl transform transition-all hover:scale-[1.02]">
                <p className="text-5xl font-semibold leading-tight">{currentQuestion.text}</p>
              </div>
            ) : (
              <div className="mb-12 p-10 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl">
                <p className="text-5xl font-semibold">No more questions.</p>
              </div>
            )}
            
            {/* Answer or Timer display */}
            {quizState.showAnswer && currentQuestion ? (
              <div className="animate-bounce-in">
                <div className="inline-block px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl shadow-2xl transform animate-pulse">
                  <p className="text-6xl font-bold">Answer: {currentQuestion.answer}</p>
                </div>
              </div>
            ) : timerExpired && !quizState.activeStudent && currentQuestion ? (
              <div className="animate-bounce-in">
                <div className="inline-block px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl shadow-2xl">
                  <p className="text-6xl font-bold">Answer: {currentQuestion.answer}</p>
                </div>
              </div>
            ) : (
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative px-16 py-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl">
                  <div className="text-9xl font-bold font-mono tabular-nums">
                    {(quizState.remainingTime / 1000).toFixed(1)}<span className="text-6xl">s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active student buzzer indicator */}
            {quizState.activeStudent && (
              <div className="mt-12 animate-bounce-in">
                <div className="inline-flex items-center gap-6 px-12 py-8 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-3xl shadow-2xl animate-pulse">
                  <div className="w-8 h-8 bg-white rounded-full animate-ping"></div>
                  <span className="text-5xl font-bold text-gray-900">{quizState.activeStudent} buzzed in!</span>
                  <div className="w-8 h-8 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}