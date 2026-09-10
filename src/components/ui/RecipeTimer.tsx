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
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create AudioContext (Web Audio API won't stop background music)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playAudio = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const now = ctx.currentTime;
    activeOscillatorsRef.current = [];
    
    // A soft, pleasant chime sequence (like a modern phone alarm)
    // Notes: Eb5, F5, G5, Bb5 (Pentatonic, very harmonious)
    const melody = [
      { f: 622.25, time: 0 },
      { f: 698.46, time: 0.15 },
      { f: 783.99, time: 0.30 },
      { f: 932.33, time: 0.45 },
    ];
    
    // Two bursts per ring cycle
    const bursts = [0, 1.2];
    
    bursts.forEach(burstStart => {
      melody.forEach(note => {
        const time = burstStart + note.time;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Sine wave is very soft and pleasant (no harsh harmonics)
        osc.type = 'sine';
        osc.frequency.value = note.f;
        
        // Percussive bell-like envelope
        gain.gain.setValueAtTime(0, now + time);
        // Quick attack
        gain.gain.linearRampToValueAtTime(0.15, now + time + 0.02);
        // Smooth, long decay
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + time);
        osc.stop(now + time + 0.6);
        
        activeOscillatorsRef.current.push(osc);
      });
    });
    
    // Schedule the next loop trigger after the bursts finish
    alarmTimeoutRef.current = setTimeout(() => {
      setRingCount(prev => prev + 1);
    }, 2500);
  };

  const stopAudio = () => {
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    activeOscillatorsRef.current = [];
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
