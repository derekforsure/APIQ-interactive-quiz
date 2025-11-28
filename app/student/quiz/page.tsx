
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="flex items-center justify-center h-screen">
        <p>You have not joined a quiz session.</p>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4">Quiz Ended!</h1>
          <h2 className="text-2xl font-bold mb-4">Final Scores</h2>
          {quizState?.scores ? (
            <ul>
              {Object.entries(quizState.scores).map(([name, score]) => (
                <li key={name} className={quizState.scoringMode === 'individual' && name === session.studentId ? 'font-bold' : ''}>
                  {quizState.scoringMode === 'individual' && name === session.studentId ? 'You' : name}: {score}
                </li>
              ))}
            </ul>
          ) : (
            <p>No final scores available.</p>
          )}
        </div>
      </div>
    );
  }

  if (!quizState || !quizState.isQuizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Waiting Lobby</h1>
        <p>Waiting for the admin to start the quiz...</p>
      </div>
    );
  }

  const amIActive = quizState.activeStudent === session.studentId;
  const amIIneligible = quizState.ineligibleStudents.includes(session.studentId ?? '');

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Question {quizState.currentQuestionIndex + 1}</h1>
        <p className="text-2xl mb-8">Time: {(quizState.remainingTime / 1000).toFixed(1)}s</p>

        <Button
          onClick={handleBuzz}
          disabled={!quizState.isBuzzerActive || !!quizState.activeStudent || amIIneligible}
          className="w-64 h-64 rounded-full text-3xl font-bold shadow-lg transform transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          BUZZ!
        </Button>

        <div className="mt-8 text-2xl">
          {quizState.activeStudent ? (
            <p>{amIActive ? 'You' : quizState.activeStudent} buzzed in!</p>
          ) : (
            <p>{quizState.isReadingPeriod ? 'Reading Period...' : (quizState.isBuzzerActive ? 'Buzzer is active!' : 'Waiting for next question...')}</p>
          )}
          {amIIneligible && <p className="text-red-500">You can&apos;t answer this question again.</p>}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Scores</h2>
          <ul>
            {Object.entries(quizState.scores).map(([name, score]) => (
              <li key={name} className={quizState.scoringMode === 'individual' && name === session.studentId ? 'font-bold' : ''}>
                {quizState.scoringMode === 'individual' && name === session.studentId ? 'You' : name}: {score}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
