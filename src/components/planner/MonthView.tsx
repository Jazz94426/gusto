'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { PlannerEntry } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

const DAYS_LABELS_MON: Record<string, string[]> = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// Format to YYYY-MM-DD
const formatDate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export function MonthView({ currentDate, onNavigateToWeek }: { currentDate: Date; onNavigateToWeek: (d: Date) => void }) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const dayLabels = DAYS_LABELS_MON[language] || DAYS_LABELS_MON.fr;

  // Compute calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week of first day (0 = Sunday, we want 0 = Monday)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  const startDateStr = formatDate(calendarDays[0]);
  const endDateStr = formatDate(calendarDays[calendarDays.length - 1]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'plannerEntries'), 
      where('userId', '==', user.uid),
      where('date', '>=', startDateStr),
      where('date', '<=', endDateStr)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: PlannerEntry[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as PlannerEntry);
      });
      setEntries(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, startDateStr, endDateStr]);

  const todayStr = formatDate(new Date());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map(day => (
          <div key={day} className="text-center text-sm font-medium text-brown py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 grid grid-cols-7 gap-1 min-h-[400px]">
        {calendarDays.map(day => {
          const dateStr = formatDate(day);
          const isToday = dateStr === todayStr;
          const isCurrentMonth = day.getMonth() === currentMonth;
          
          const dayEntries = entries.filter(e => e.date === dateStr);
          
          return (
            <button
              key={dateStr}
              onClick={() => onNavigateToWeek(day)}
              className={`
                relative p-2 border border-stone/20 rounded-xl flex flex-col items-center justify-start hover:border-terracotta transition-colors
                ${!isCurrentMonth ? 'opacity-40 bg-stone/5' : 'bg-white'}
                ${isToday ? 'ring-2 ring-terracotta ring-inset' : ''}
                ${dayEntries.length > 0 ? 'bg-cream/30' : ''}
              `}
            >
              <span className={`text-sm font-medium mb-1 ${isToday ? 'text-terracotta' : 'text-charcoal'}`}>
                {day.getDate()}
              </span>
              
              <div className="flex flex-wrap justify-center gap-1 mt-auto pb-1">
                {dayEntries.slice(0, 4).map((entry, idx) => (
                  <div 
                    key={idx} 
                    className="w-2 h-2 rounded-full bg-terracotta"
                    title={entry.recipeName}
                  />
                ))}
                {dayEntries.length > 4 && (
                  <div className="w-2 h-2 rounded-full bg-stone text-[8px] flex items-center justify-center text-white leading-none">
                    +
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
