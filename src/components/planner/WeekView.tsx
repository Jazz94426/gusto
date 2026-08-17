'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { PlannerEntry, MealType } from '@/types';
import { RecipeAssigner } from './RecipeAssigner';
import { useTranslation } from '@/hooks/useTranslation';

const MEAL_TYPE_IDS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

const DAYS_LABELS: Record<string, string[]> = {
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

// Format to YYYY-MM-DD
const formatDate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export function WeekView({ currentDate, onNavigateToDate }: { currentDate: Date; onNavigateToDate: (d: Date) => void }) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [assignerOpen, setAssignerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);
  const [dragOverMeal, setDragOverMeal] = useState<MealType | null>(null);
  
  // Local state for the specific day currently being viewed
  const [selectedDateStr, setSelectedDateStr] = useState(formatDate(currentDate));

  useEffect(() => {
    setSelectedDateStr(formatDate(currentDate));
  }, [currentDate]);

  // Compute week days (Monday to Sunday) for the top selector
  const getWeekDays = () => {
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(currentDate.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const startDateStr = formatDate(weekDays[0]);
  const endDateStr = formatDate(weekDays[6]);

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

  const handleOpenAssigner = (dateStr: string, mealType: MealType) => {
    setSelectedSlot({ date: dateStr, mealType });
    setAssignerOpen(true);
  };

  const handleRemoveEntry = async (id: string) => {
    await deleteDoc(doc(db, 'plannerEntries', id));
  };

  const handleDrop = async (e: React.DragEvent, targetMealType: MealType) => {
    e.preventDefault();
    setDragOverMeal(null);
    const entryId = e.dataTransfer.getData('entryId');
    if (!entryId) return;
    
    const entry = entries.find(en => en.id === entryId);
    if (entry && entry.mealType !== targetMealType) {
      await updateDoc(doc(db, 'plannerEntries', entryId), { mealType: targetMealType });
    }
  };

  const handleDragOver = (e: React.DragEvent, mealType: MealType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMeal !== mealType) {
      setDragOverMeal(mealType);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMeal(null);
  };

  const todayStr = formatDate(new Date());
  const dayLabels = DAYS_LABELS[language] || DAYS_LABELS.fr;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Week Days Selector */}
      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-1">
        {weekDays.map(day => {
          const dateStr = formatDate(day);
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === todayStr;
          return (
            <button 
              key={dateStr}
              onClick={() => setSelectedDateStr(dateStr)}
              className={`flex flex-col items-center min-w-[70px] sm:min-w-[80px] p-3 rounded-2xl transition-all border ${
                isSelected 
                  ? 'bg-terracotta text-white border-terracotta shadow-md' 
                  : isToday 
                    ? 'bg-cream text-terracotta border-terracotta/30' 
                    : 'bg-cream-dark text-stone border-transparent hover:bg-cream hover:border-stone/20'
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-white/80' : ''}`}>
                {dayLabels[day.getDay()].slice(0, 3)}
              </span>
              <span className={`text-2xl mt-1 ${isSelected || isToday ? 'font-bold' : 'font-medium'}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meal Cards for selected day */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-10">
        {MEAL_TYPE_IDS.map(mealId => {
          const mealEntries = entries.filter(e => e.date === selectedDateStr && e.mealType === mealId);
          const isDragOver = dragOverMeal === mealId;
          
          return (
            <div 
              key={mealId} 
              onDragOver={(e) => handleDragOver(e, mealId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, mealId)}
              className={`rounded-[24px] p-5 shadow-sm border transition-all ${
                isDragOver ? 'bg-terracotta/5 border-terracotta border-dashed' : 'bg-white border-stone/10'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-heading text-charcoal">{t(`planner.${mealId}`)}</h3>
                <button
                  onClick={() => handleOpenAssigner(selectedDateStr, mealId)}
                  className="w-10 h-10 rounded-full bg-cream-dark text-terracotta hover:bg-terracotta hover:text-white flex items-center justify-center transition-colors"
                  title={t("planner.assign_recipe")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              
              {mealEntries.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-stone/20 rounded-2xl bg-stone/5">
                  <p className="text-stone-400 text-sm">{t("planner.nothing_planned")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mealEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('entryId', entry.id);
                      }}
                      className="group relative bg-cream-dark rounded-2xl overflow-hidden border border-stone/20 hover:border-terracotta hover:shadow-sm transition-all flex items-center p-3 gap-4 cursor-grab active:cursor-grabbing"
                    >
                      {entry.recipeCoverURL ? (
                        <img src={entry.recipeCoverURL} alt="" className="w-16 h-16 rounded-xl object-cover border border-stone/10" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-stone/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-charcoal font-medium text-sm line-clamp-2 pr-6">{entry.recipeName}</h4>
                      </div>
                      <button 
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
                        title={t("planner.remove")}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assignerOpen && selectedSlot && (
        <RecipeAssigner 
          isOpen={assignerOpen} 
          onClose={() => setAssignerOpen(false)}
          date={selectedSlot.date}
          mealType={selectedSlot.mealType}
        />
      )}
    </div>
  );
}
