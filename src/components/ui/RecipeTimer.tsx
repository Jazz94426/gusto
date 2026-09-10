'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Timer as TimerIcon, BellRing } from 'lucide-react';

interface RecipeTimerProps {
  durationMinutes: number;
  label?: string;
}

export default function RecipeTimer({ durationMinutes, label }: RecipeTimerProps) {
  const totalSeconds = Math.round(durationMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [ringCount, setRingCount] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Create AudioContext and load sound (Web Audio API won't stop background music)
    const initAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        audioContextRef.current = new AudioContextClass();
        
        const response = await fetch('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        const arrayBuffer = await response.arrayBuffer();
        
        audioContextRef.current.decodeAudioData(arrayBuffer, (buffer) => {
          audioBufferRef.current = buffer;
        }, (error) => {
          console.error('Audio decode error', error);
        });
      } catch (err) {
        console.error('Failed to init audio', err);
      }
    };
    
    initAudio();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setRingCount(prev => prev + 1);
    };
    
    source.start(0);
    currentSourceRef.current = source;
  };

  const stopAudio = () => {
    if (currentSourceRef.current) {
      currentSourceRef.current.onended = null;
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isFinished) {
      if (ringCount < 6) { // Ring 6 times max (~30 seconds total)
        timeout = setTimeout(() => {
          playAudio();
        }, ringCount === 0 ? 0 : 5000); // 0 delay for the first ring, 5 seconds cooldown after
      } else {
        // Automatically stop after max rings
        setIsFinished(false);
        setTimeLeft(totalSeconds);
        setIsRunning(false);
        setRingCount(0);
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isFinished, ringCount, totalSeconds]);

  const handleFinish = () => {
    setIsRunning(false);
    setIsFinished(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
       new Notification("Minuteur terminé !", { 
         body: label || "L'étape est terminée.",
         icon: '/icons/icon-192x192.png'
       });
    }
  };

  const toggleTimer = () => {
    if (isFinished) {
      // Stop the alarm and reset the timer back to its initial state
      setIsFinished(false);
      setTimeLeft(totalSeconds);
      setIsRunning(false);
      setRingCount(0);
      stopAudio();
    } else {
      if (!isRunning) {
        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        
        // iOS Audio Unlock: resume the audio context on user interaction
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
      setIsRunning(!isRunning);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rm = m % 60;
      return `${h}h${rm.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <button 
      onClick={toggleTimer}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm text-sm font-semibold transition-all group ${
        isFinished ? 'bg-green-100 text-green-700 border border-green-200 animate-pulse' :
        isRunning ? 'bg-terracotta text-white border border-terracotta/20' : 
        'bg-white text-stone border border-stone-light/40 hover:border-terracotta/50 hover:text-terracotta'
      }`}
      title="Démarrer le minuteur"
    >
      {isFinished ? (
        <BellRing className="w-4 h-4 animate-bounce" />
      ) : isRunning ? (
        <Square className="w-3.5 h-3.5 fill-current opacity-80" />
      ) : (
        <TimerIcon className="w-4 h-4 text-terracotta group-hover:scale-110 transition-transform" />
      )}
      <span className={!isFinished && !isRunning ? 'text-charcoal group-hover:text-terracotta' : ''}>
        {isFinished ? 'Terminé' : formatTime(timeLeft)}
      </span>
    </button>
  );
}
