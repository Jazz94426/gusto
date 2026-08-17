'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PantryInventory } from '@/components/pantry/PantryInventory';
import { ShoppingList } from '@/components/pantry/ShoppingList';
import { useTranslation } from '@/hooks/useTranslation';

export default function PantryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping'>('pantry');
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!loading && !user) return null;
  
  if (!user) return null;

  return (
    <div className="page-container py-8 pb-24">
      <h1 className="font-heading text-5xl md:text-6xl font-black text-charcoal tracking-tight mb-8">
        {t("nav.pantry")}
      </h1>
      
      {/* Segmented Control Tab (Always Visible) */}
      <div className="flex p-1 bg-stone/5 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex-1 py-3 px-4 rounded-[12px] font-medium transition-all text-sm ${
            activeTab === 'pantry' 
              ? 'bg-white text-charcoal shadow-sm' 
              : 'text-stone-500 hover:text-charcoal'
          }`}
        >
          {t("pantry.pantry")}
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 py-3 px-4 rounded-[12px] font-medium transition-all text-sm ${
            activeTab === 'shopping' 
              ? 'bg-white text-charcoal shadow-sm' 
              : 'text-stone-500 hover:text-charcoal'
          }`}
        >
          {t("pantry.shopping_list")}
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:gap-10">
        <div className={`flex-1 ${activeTab !== 'pantry' ? 'hidden' : 'block'}`}>
          <div className="bg-white border border-stone-light/30 rounded-[32px] p-5 sm:p-8 min-h-[60vh] shadow-sm flex flex-col">
            <PantryInventory />
          </div>
        </div>

        <div className={`flex-1 ${activeTab !== 'shopping' ? 'hidden' : 'block'}`}>
          <div className="bg-white border border-stone-light/30 rounded-[32px] p-5 sm:p-8 min-h-[60vh] shadow-sm flex flex-col">
            <ShoppingList />
          </div>
        </div>
      </div>
    </div>
  );
}
