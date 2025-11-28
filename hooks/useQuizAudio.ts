import { useEffect, useRef } from 'react';

export function useQuizAudio() {
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctSoundRef.current = new Audio('/sounds/Correct Tick Sound Effect.mp3');
    incorrectSoundRef.current = new Audio('/sounds/Wrong Buzzer Sound Effect.mp3');
  }, []);

  const playCorrect = () => {
    correctSoundRef.current?.play();
  };

  const playIncorrect = () => {
    incorrectSoundRef.current?.play();
  };

  return { playCorrect, playIncorrect };
}
