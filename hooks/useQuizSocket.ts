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
  const [clientId, setClientId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [finalLeaderboardScores, setFinalLeaderboardScores] = useState<Record<string, number> | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

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

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:3001`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      // Register as a spectator by default. The component can then send a more specific registration.
      ws.current?.send(JSON.stringify({ type: 'REGISTER', payload: { role: 'spectator', sessionId } }));
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      // Handle server shutdown message
      if (data.type === 'SERVER_SHUTDOWN') {
        console.log('Server is shutting down');
        shouldReconnectRef.current = false;
        setIsConnected(false);
        return;
      }

      if (data.type === 'CLIENT_ID') {
        setClientId(data.payload.clientId);
        return;
      }



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
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);

      // Attempt reconnection with exponential backoff
      if (shouldReconnectRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    };

    ws.current.onerror = (error) => {
      // Only log if we're not already handling reconnection
      if (ws.current?.readyState !== WebSocket.CLOSED && ws.current?.readyState !== WebSocket.CLOSING) {
        console.error('WebSocket error occurred. State:', ws.current?.readyState);
      }
    };
  }, [sessionId, onScoringModeChange]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendCommand = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload: { ...payload, sessionId } }));
    } else {
      console.warn('WebSocket is not connected. Command not sent:', type);
    }
  }, [sessionId]);

  return {
    quizState,
    isConnected,
    clientId,
    countdown,
    finalLeaderboardScores,
    sendCommand,
    setFinalLeaderboardScores
  };
}
