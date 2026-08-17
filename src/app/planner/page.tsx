'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { WeekView } from '@/components/planner/WeekView';
import { MonthView } from '@/components/planner/MonthView';
import { Button } from '@/components/ui/Button';
import { PlannerDaySkeleton } from '@/components/ui/skeletons/PlannerDaySkeleton';

import { useTranslation } from '@/hooks/useTranslation';

export default function PlannerPage() {
  const { t, language } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!loading && !user) return null;

  const navigatePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const navigateNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format header
  const formatHeader = () => {
    const locale = language === 'en' ? 'en-US' : 'fr-FR';
    const opts: Intl.DateTimeFormatOptions = 
      view === 'month' 
        ? { month: 'long', year: 'numeric' }
        : { month: 'short', year: 'numeric' };
    return currentDate.toLocaleDateString(locale, opts).replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:max-w-7xl flex flex-col h-[calc(100vh-80px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-heading text-charcoal">{t("nav.planner")}</h1>
        
        <div className="flex items-center bg-cream-dark p-1 rounded-xl">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'week' ? 'bg-white shadow-sm text-charcoal' : 'text-brown'
            }`}
          >
            {t("planner.week")}
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'month' ? 'bg-white shadow-sm text-charcoal' : 'text-brown'
            }`}
          >
            {t("planner.month")}
          </button>
        </div>
      </div>

      <div className="bg-cream-dark rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-charcoal">{formatHeader()}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={navigateToday} size="sm" className="hidden sm:inline-flex">{t("planner.today")}</Button>
            <div className="flex bg-cream rounded-xl p-1">
              <button onClick={navigatePrev} className="p-2 hover:bg-cream-dark rounded-lg text-stone hover:text-charcoal transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={navigateNext} className="p-2 hover:bg-cream-dark rounded-lg text-stone hover:text-charcoal transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {(loading || !user) ? (
            <div className="flex-1 overflow-x-auto hide-scrollbar snap-x snap-mandatory flex gap-6 pb-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => <PlannerDaySkeleton key={i} />)}
            </div>
          ) : view === 'week' ? (
            <WeekView currentDate={currentDate} onNavigateToDate={setCurrentDate} />
          ) : (
            <MonthView currentDate={currentDate} onNavigateToWeek={(date) => { setCurrentDate(date); setView('week'); }} />
          )}
        </div>
      </div>
    </div>
  );
}
