
'use client';

import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, AlertCircle } from 'lucide-react';

interface SessionData {
  studentId?: string;
  quizSessionId?: string;
}

interface QuizState {
  isQuizStarted: boolean;
  scoringMode: 'individual' | 'department';
  isBuzzerActive: boolean;
  activeStudent: string | null;
  currentQuestionIndex: number;
  scores: Record<string, number>;
  remainingTime: number;
  ineligibleStudents: string[];
  isReadingPeriod: boolean;
}

export default function StudentQuizPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);
  const buzzSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    buzzSoundRef.current = new Audio('/sounds/Button Sound Effects 8.mp3');
  }, []);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (!session?.quizSessionId || !session?.studentId) return;

    const wsUrl = `ws://${window.location.hostname}:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'student', sessionId: session.quizSessionId, studentId: session.studentId } }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['QUIZ_STATE', 'QUIZ_STARTED', 'BUZZER_ACTIVATED', 'SCORES_UPDATED', 'NEW_QUESTION', 'TIMER_UPDATE', 'BUZZER_OPEN'].includes(data.type)) {
        setQuizState(data.payload);
      } else if (data.type === 'QUIZ_ENDED') {
        setQuizState(data.payload);
        setQuizEnded(true);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.current?.close();
    };
  }, [session]);

  const handleBuzz = () => {
    if (quizState?.isBuzzerActive && !quizState.ineligibleStudents.includes(session?.studentId ?? '')) {
      buzzSoundRef.current?.play();
      ws.current?.send(JSON.stringify({ type: 'BUZZ', payload: { sessionId: session?.quizSessionId, studentId: session?.studentId } }));
    }
  };

  if (loading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!session || !session.quizSessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Session</h2>
          <p className="text-gray-600">You have not joined a quiz session yet.</p>
        </Card>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <CardTitle className="text-3xl font-bold text-gray-900">Quiz Ended!</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-4 text-center">Final Scores</h3>
            <div className="space-y-2">
              {quizState?.scores ? (
                Object.entries(quizState.scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, score], index) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        name === session.studentId ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`font-medium ${name === session.studentId ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {name === session.studentId ? 'You' : name}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">{score} pts</span>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500">No final scores available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizState || !quizState.isQuizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-white p-6 rounded-full shadow-xl">
              <Clock className="w-20 h-20 text-indigo-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Waiting Lobby</h1>
            <p className="text-gray-600">Waiting for the admin to start the quiz...</p>
          </div>
          <div className="flex justify-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </motion.div>
      </div>
    );
  }

  const amIActive = quizState.activeStudent === session.studentId;
  const amIIneligible = quizState.ineligibleStudents.includes(session.studentId ?? '');
  const isBuzzerEnabled = quizState.isBuzzerActive && !quizState.activeStudent && !amIIneligible;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Q{quizState.currentQuestionIndex + 1}
          </Badge>
          <span className="font-medium text-gray-900">
            {quizState.isReadingPeriod ? 'Reading...' : 'Answering...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-indigo-600 font-mono font-bold">
          <p className="text-2xl mb-8">Time: {(quizState.remainingTime / 1000).toFixed(1)}s</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pulse when Buzzer Active */}
        {isBuzzerEnabled && (
          <div className="absolute inset-0 bg-indigo-50 animate-pulse pointer-events-none opacity-50"></div>
        )}

        <AnimatePresence mode="wait">
          {amIActive ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center z-10"
            >
              <div className="w-64 h-64 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto shadow-lg border-4 border-green-200">
                <Trophy className="w-32 h-32 text-green-600 animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold text-green-700 mb-2">You Buzzed In!</h2>
              <p className="text-green-600">Get ready to answer!</p>
            </motion.div>
          ) : quizState.activeStudent ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center z-10"
            >
              <div className="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center mb-6 mx-auto border-4 border-gray-200">
                <span className="text-6xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">{quizState.activeStudent}</h2>
              <p className="text-gray-500">is answering...</p>
            </motion.div>
          ) : (
            <motion.button
              key="buzzer"
              initial={{ scale: 0.9 }}
              animate={{ 
                scale: isBuzzerEnabled ? [1, 1.05, 1] : 1,
                boxShadow: isBuzzerEnabled 
                  ? "0 0 0 0 rgba(99, 102, 241, 0.7)" 
                  : "none"
              }}
              transition={{ 
                scale: { repeat: isBuzzerEnabled ? Infinity : 0, duration: 1.5 },
                boxShadow: { repeat: isBuzzerEnabled ? Infinity : 0, duration: 1.5 }
              }}
              whileTap={isBuzzerEnabled ? { scale: 0.95 } : {}}
              onClick={handleBuzz}
              disabled={!isBuzzerEnabled}
              className={`
                w-72 h-72 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 z-10
                ${isBuzzerEnabled 
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white cursor-pointer hover:shadow-indigo-500/50 border-8 border-indigo-400' 
                  : amIIneligible
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-8 border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-8 border-gray-200'
                }
              `}
            >
              <span className="text-4xl font-black tracking-wider mb-2">BUZZ</span>
              <span className="text-sm font-medium opacity-80 uppercase tracking-widest">
                {amIIneligible ? 'Locked Out' : isBuzzerEnabled ? 'Tap Now!' : 'Wait...'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Status Message */}
        <div className="mt-12 text-center h-8">
          <p className="text-lg font-medium text-gray-600">
            {quizState.isReadingPeriod 
              ? 'Reading Period...' 
              : !quizState.isBuzzerActive && !quizState.activeStudent
                ? 'Waiting for buzzer...'
                : ''}
          </p>
        </div>
      </div>

      {/* Mini Scoreboard */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Top Scores</h3>
            <Badge variant="secondary" className="text-xs">
              {quizState.scoringMode === 'individual' ? 'Individual' : 'Department'}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(quizState.scores)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([name, score]) => (
                <div 
                  key={name} 
                  className={`text-center p-2 rounded-lg border ${
                    name === session.studentId ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 truncate w-full">
                    {name === session.studentId ? 'You' : name}
                  </div>
                  <div className="font-bold text-gray-900">{score}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
