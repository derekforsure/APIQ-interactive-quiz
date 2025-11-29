'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Leaderboard from '@/components/Leaderboard';

interface Question {
  id: number;
  text: string;
  answer: string;
  incorrect_option_1: string;
  incorrect_option_2: string;
  incorrect_option_3: string;
}

interface QuizState {
  scoringMode: 'individual' | 'department';
  isBuzzerActive: boolean;
  activeStudent: string | null;
  currentQuestionIndex: number;
  scores: Record<string, number>;
  remainingTime: number;
  showAnswer: boolean;
  isQuizEnded: boolean;
  isQuizStarted: boolean;
  isReadingPeriod: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function PresentationPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [finalLeaderboardScores, setFinalLeaderboardScores] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [localCountdownActive, setLocalCountdownActive] = useState<boolean>(false);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const quizMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const leaderboardAudioRef = useRef<HTMLAudioElement | null>(null); // Ref for leaderboard music
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [countdownProgress, setCountdownProgress] = useState<number>(100);
  const countdownStartTimeRef = useRef<number | null>(null);

  const currentQuestion = questions[quizState?.currentQuestionIndex ?? 0];

  useEffect(() => {
    // Initialize audio refs
    if (!countdownAudioRef.current) {
      countdownAudioRef.current = new Audio('/sounds/Countdown Sound Effect.mp3');
      countdownAudioRef.current.volume = 0.7;
    }
    if (!leaderboardAudioRef.current) {
      leaderboardAudioRef.current = new Audio('/sounds/Holiday Giveaway Music.mp3');
      leaderboardAudioRef.current.loop = true;
    }

    if (!localCountdownActive) {
      setCountdown(null);
      countdownStartTimeRef.current = null;
      countdownAudioRef.current?.pause();
      countdownAudioRef.current?.load();
      return;
    }

    if (!countdownStartTimeRef.current) {
      countdownStartTimeRef.current = Date.now();
      setCountdown(4);
      countdownAudioRef.current?.play().catch(error => console.error("Countdown audio play failed:", error));
    }
    
    const countdownStartTime = countdownStartTimeRef.current;

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - countdownStartTime;
      const totalDuration = 4000;
      const remaining = Math.max(0, totalDuration - elapsed);
      
      let countdownValue = Math.ceil(remaining / 1000);
      if (countdownValue === 0 && remaining > 0) countdownValue = 1;
      
      setCountdown(countdownValue > 0 ? countdownValue : null);
      setCountdownProgress(Math.max(0, (remaining / totalDuration) * 100));

      if (remaining <= 0) {
        setLocalCountdownActive(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 50);
    
    return () => {
      clearInterval(interval);
    };
  }, [localCountdownActive]);

  useEffect(() => {
    if (currentQuestion) {
      setShuffledOptions(shuffleArray([
        currentQuestion.answer,
        currentQuestion.incorrect_option_1,
        currentQuestion.incorrect_option_2,
        currentQuestion.incorrect_option_3,
      ]));
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (!quizMusicAudioRef.current) {
      quizMusicAudioRef.current = new Audio('/sounds/Quiz Timer Music.mp3');
      quizMusicAudioRef.current.loop = true;
    }

    if ((quizState?.isBuzzerActive || quizState?.isReadingPeriod) && quizState.remainingTime > 0) {
      quizMusicAudioRef.current.play().catch(error => console.error("Quiz music audio play failed:", error));
    } else {
      quizMusicAudioRef.current.pause();
    }
  }, [quizState?.isBuzzerActive, quizState?.isReadingPeriod, quizState?.remainingTime]);

  // Effect for leaderboard music
  useEffect(() => {
    if (quizState?.isQuizEnded && finalLeaderboardScores) {
      quizMusicAudioRef.current?.pause();
      leaderboardAudioRef.current?.play().catch(error => console.error("Leaderboard audio play failed:", error));
    } else {
      leaderboardAudioRef.current?.pause();
    }
    return () => {
      leaderboardAudioRef.current?.pause();
    };
  }, [quizState?.isQuizEnded, finalLeaderboardScores]);

  useEffect(() => {
    return () => {
      quizMusicAudioRef.current?.pause();
      countdownAudioRef.current?.pause();
      leaderboardAudioRef.current?.pause();
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

    async function fetchParticipants() {
      if (!sessionId) return;
      try {
        const response = await fetch(`/api/sessions/${sessionId}/participants`);
        if (!response.ok) {
          throw new Error(`Error fetching participants: ${response.status}`);
        }
        const data = await response.json();
        const namesMap: Record<string, string> = {};
        data.forEach((p: { student_id: string; name: string }) => {
          namesMap[p.student_id] = p.name;
        });
        setStudentNames(namesMap);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    }

    // Fetch both in parallel for better performance
    Promise.all([fetchQuestions(), fetchParticipants()]);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `ws://${window.location.hostname}:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected for presentation');
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'spectator', sessionId } }));
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (['QUIZ_STATE', 'QUIZ_STARTED', 'BUZZER_ACTIVATED', 'SCORES_UPDATED', 'NEW_QUESTION', 'TIMER_UPDATE', 'BUZZER_OPEN', 'QUIZ_ENDED', 'COUNTDOWN', 'START_QUIZ', 'COUNTDOWN_START'].includes(data.type)) {
        if (data.type === 'COUNTDOWN_START') {
          setLocalCountdownActive(true);
          setIsCountingDown(true);
        } else if (data.type === 'START_QUIZ') {
          setQuizState(data.payload);
          setFinalLeaderboardScores(null);
        } else if (data.type === 'QUIZ_STARTED') {
          setQuizState(data.payload);
          setFinalLeaderboardScores(null);
          setIsCountingDown(false);
        } else {
          setQuizState(data.payload);

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

  const timerExpired = quizState && quizState.remainingTime <= 0;
  const showAnswerHighlight = quizState?.showAnswer || (timerExpired && !quizState?.activeStudent);

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white h-screen overflow-hidden">
      {/* Animated spotlight effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Scanlines for retro TV effect */}
      <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none"></div>

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-8">
              Get Ready!
            </p>
            <div className="relative w-64 h-64">
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="10" />
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  fill="none"
                  stroke="url(#countdownGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(countdownProgress / 100) * 597} 597`}
                  className="transition-all duration-100"
                />
              </svg>
              {/* Countdown number */}
              <div className="absolute inset-0 flex items-center justify-center animate-bounce-in" key={countdown}>
                <span className="text-9xl font-black text-white drop-shadow-[0_5px_15px_rgba(255,255,255,0.3)]">{countdown}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col">
        {quizState?.isQuizEnded && finalLeaderboardScores ? (
          <div className="flex-1 flex items-center justify-center">
            <Leaderboard scores={finalLeaderboardScores} />
          </div>
        ) : !quizState || (!quizState.isQuizStarted && !isCountingDown) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="mb-12 relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-40 h-40 border-8 border-t-purple-400 border-r-blue-400 border-b-purple-400 border-l-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-6 animate-pulse tracking-tight">
                GET READY
              </h1>
              <p className="text-3xl font-light text-gray-300 tracking-wider">Quiz starting soon...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Bar */}
            <div className="px-12 py-8 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-blue-900/80 backdrop-blur-xl border-b-4 border-purple-500/50 shadow-2xl">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                  <div className="px-8 py-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                    <div className="text-sm font-semibold text-purple-100 uppercase tracking-wider mb-1">Question</div>
                    <div className="text-4xl font-black">{quizState.currentQuestionIndex + 1}<span className="text-2xl text-purple-200 mx-2">/</span><span className="text-3xl text-purple-200">{questions.length}</span></div>
                  </div>
                  <div className="h-16 w-1 bg-gradient-to-b from-transparent via-purple-400 to-transparent"></div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Mode</div>
                    <div className="text-2xl font-bold text-white capitalize">{quizState.scoringMode}</div>
                  </div>
                </div>
                
                {!showAnswerHighlight && quizState.isQuizStarted && !quizState.isQuizEnded && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
                    <div className="relative px-12 py-6 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl shadow-2xl border-4 border-yellow-300/50">
                      <div className="text-7xl font-black font-mono tabular-nums text-white drop-shadow-lg">
                        {(quizState.remainingTime / 1000).toFixed(1)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-12 py-8">
              <div className="w-full max-w-7xl animate-fade-in">
                {/* Question Card */}
                {currentQuestion ? (
                  <div className="mb-12 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative px-16 py-12 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-purple-500/30 shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                      <p className="text-5xl font-bold leading-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-100">
                        {currentQuestion.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-12 relative">
                    <div className="relative px-16 py-12 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-purple-500/30 shadow-2xl">
                      <p className="text-5xl font-bold text-center">No more questions.</p>
                    </div>
                  </div>
                )}

                {/* Answer Options Grid */}
                {!quizState.isReadingPeriod && currentQuestion && (
                  <div className="grid grid-cols-2 gap-6">
                    {shuffledOptions.map((option, index) => {
                      const isCorrect = option === currentQuestion.answer;
                      const shouldHighlight = showAnswerHighlight && isCorrect;
                      
                      return (
                        <div
                          key={index}
                          className={`relative group transition-all duration-500 animate-fade-in ${
                            shouldHighlight ? 'scale-105' : 'hover:scale-102'
                          }`}
                          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                        >
                          <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                            shouldHighlight 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 opacity-60 animate-pulse' 
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-30'
                          }`}></div>
                          <div className={`relative px-10 py-8 rounded-2xl border-4 transition-all duration-500 ${
                            shouldHighlight
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300 shadow-2xl'
                              : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-purple-500/40 backdrop-blur-xl shadow-xl hover:border-purple-400/60'
                          }`}>
                            <div className="flex items-center gap-6">
                              <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-black text-3xl transition-all duration-500 ${
                                shouldHighlight
                                  ? 'bg-white text-emerald-600'
                                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                              }`}>
                                {optionLabels[index]}
                              </div>
                              <p className={`text-3xl font-bold flex-1 transition-colors duration-500 ${
                                shouldHighlight ? 'text-white' : 'text-gray-100'
                              }`}>
                                {option}
                              </p>
                              {shouldHighlight && (
                                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce-in">
                                  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Buzzer Indicator */}
                {quizState.activeStudent && (
                  <div className="mt-12 text-center animate-bounce-in">
                    <div className="inline-block relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-75 animate-pulse"></div>
                      <div className="relative px-16 py-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-2xl border-4 border-yellow-200">
                        <div className="flex items-center gap-6">
                          <div className="w-6 h-6 bg-white rounded-full animate-ping"></div>
                          <span className="text-5xl font-black text-white drop-shadow-lg uppercase tracking-wide">
                            {studentNames[quizState.activeStudent] || quizState.activeStudent}
                          </span>
                          <div className="w-6 h-6 bg-white rounded-full animate-ping"></div>
                        </div>
                        <div className="mt-2 text-xl font-bold text-yellow-900 uppercase tracking-widest">Buzzed In!</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            transform: scale(1.1) translateY(0);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .bg-scanlines {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}