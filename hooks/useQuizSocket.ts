import { useState, useEffect, useRef, useCallback } from 'react';

export interface QuizState {
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

interface UseQuizSocketProps {
  sessionId: string;
  onScoringModeChange?: (mode: 'individual' | 'department') => void;
}

export function useQuizSocket({ sessionId, onScoringModeChange }: UseQuizSocketProps) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [finalLeaderboardScores, setFinalLeaderboardScores] = useState<Record<string, number> | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'admin', sessionId } }));
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (['QUIZ_STATE', 'QUIZ_STARTED', 'BUZZER_ACTIVATED', 'SCORES_UPDATED', 'NEW_QUESTION', 'TIMER_UPDATE', 'BUZZER_OPEN', 'QUIZ_ENDED', 'COUNTDOWN', 'START_QUIZ', 'COUNTDOWN_START'].includes(data.type)) {
        if (data.type === 'COUNTDOWN') {
          setCountdown(data.payload.countdown);
        } else if (data.type === 'COUNTDOWN_START') {
          setCountdown(4);
        } else {
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
            setFinalLeaderboardScores(null);
          }
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
        ws.current.close();
      }
    };
  }, [sessionId, onScoringModeChange]);

  const sendCommand = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    ws.current?.send(JSON.stringify({ type, payload: { ...payload, sessionId } }));
  }, [sessionId]);

  return {
    quizState,
    isConnected,
    countdown,
    finalLeaderboardScores,
    sendCommand,
    setFinalLeaderboardScores // Exported in case we need to manually clear it, though logic is mostly internal
  };
}
