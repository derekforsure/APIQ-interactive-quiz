import { useState, useEffect, useCallback } from 'react';

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

interface UseLiveCountsResult {
  participants: Participant[];
  sessionQuestions: Question[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLiveCounts(sessionId: string, selectedTab: string): UseLiveCountsResult {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/participants`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data: Participant[] = await response.json();
      
      setParticipants(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) {
          return data;
        }
        return prev;
      });
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch participants:', err);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [sessionId]);

  const fetchSessionQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      const questions: Question[] = data.data || [];
      
      setSessionQuestions(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(questions)) {
          return questions;
        }
        return prev;
      });
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch session questions:', err);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    if (sessionId) {
      Promise.all([
        fetchParticipants(true),
        fetchSessionQuestions()
      ]);
    }
  }, [sessionId, fetchParticipants, fetchSessionQuestions]);

  // Live polling
  useEffect(() => {
    const pollData = () => {
      if (document.visibilityState === 'visible' && 
          (selectedTab === 'questions' || selectedTab === 'participants')) {
        fetchParticipants(false);
        fetchSessionQuestions();
      }
    };

    const interval = setInterval(pollData, 5000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchParticipants, fetchSessionQuestions, selectedTab]);

  const refresh = async () => {
    await Promise.all([
      fetchParticipants(false),
      fetchSessionQuestions()
    ]);
  };

  return { participants, sessionQuestions, loading, error, refresh };
}
