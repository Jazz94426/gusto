"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Recipe } from "@/types";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Filter, Flame, Clock, Utensils, Eye, Globe, Lock } from 'lucide-react';
import { RecipeCardSkeleton } from '@/components/ui/skeletons/RecipeCardSkeleton';

const VISIBILITIES = [
  { id: 'all', label: 'Toutes les visibilités' },
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Privé' }
];

const DIFFICULTIES = [
  { id: 'all', label: 'Toutes les difficultés' },
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyen' },
  { id: 'hard', label: 'Difficile' }
];

const TIMES = [
  { id: 'all', label: 'Tous les temps' },
  { id: '30', label: '< 30 min' },
  { id: '60', label: '< 1 heure' }
];

const DISH_TYPES = [
  { id: 'all', label: 'Tous les plats' },
  { id: 'breakfast', label: 'Petit-déjeuner' },
  { id: 'lunch', label: 'Déjeuner' },
  { id: 'dinner', label: 'Dîner' },
  { id: 'snack', label: 'Goûter' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'cocktail', label: 'Cocktail' }
];

export default function RecipesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [drafts, setDrafts] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "recipes"), where("ownerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedRecipes: Recipe[] = [];
        querySnapshot.forEach((doc) => {
          fetchedRecipes.push({ id: doc.id, ...doc.data() } as Recipe);
        });

        // Split into drafts and validated
        const userDrafts = fetchedRecipes.filter(r => r.status === "draft");
        const userValidated = fetchedRecipes.filter(r => r.status === "validated");
        
        // Sort drafts newest first
        userDrafts.sort((a, b) => {
           const dateA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds : 0;
           const dateB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds : 0;
           return dateB - dateA;
        });

        setDrafts(userDrafts);
        setRecipes(userValidated);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const handleDeleteDraft = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce brouillon ?")) {
      await deleteDoc(doc(db, "recipes", id));
      setDrafts(drafts.filter(d => d.id !== id));
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = recipe.title.toLowerCase().includes(q);
      const matchesTags = recipe.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchesTitle && !matchesTags) return false;
    }
    if (difficultyFilter !== 'all' && recipe.difficulty !== difficultyFilter) return false;
    if (visibilityFilter !== 'all' && recipe.visibility !== visibilityFilter) return false;
    
    if (timeFilter !== 'all') {
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (timeFilter === '30' && totalTime > 30) return false;
      if (timeFilter === '60' && totalTime > 60) return false;
    }
    
    if (typeFilter !== 'all') {
      const tagsString = (recipe.tags || []).join(' ').toLowerCase();
      if (typeFilter === 'breakfast' && !tagsString.includes('petit-déjeuner') && !tagsString.includes('breakfast')) return false;
      if (typeFilter === 'lunch' && !tagsString.includes('déjeuner') && !tagsString.includes('lunch')) return false;
      if (typeFilter === 'dinner' && !tagsString.includes('dîner') && !tagsString.includes('dinner')) return false;
      if (typeFilter === 'snack' && !tagsString.includes('goûter') && !tagsString.includes('snack')) return false;
      if (typeFilter === 'dessert' && !tagsString.includes('dessert')) return false;
      if (typeFilter === 'cocktail' && !tagsString.includes('cocktail') && !tagsString.includes('boisson')) return false;
    }
    
    return true;
  });

  const isFiltering = searchQuery !== '' || difficultyFilter !== 'all' || timeFilter !== 'all' || typeFilter !== 'all' || visibilityFilter !== 'all';

  if (!authLoading && !loading && !user) return null;

  return (
    <div className="page-container py-8 pb-24">
      <div className="flex flex-wrap justify-between items-center mb-12 gap-4">
        <h1 className="font-heading text-5xl md:text-6xl font-black text-charcoal tracking-tight">{t("nav.my_recipes")}</h1>
        <Button onClick={() => router.push("/import")}>{t("common.add")}</Button>
      </div>

      {(authLoading || loading) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-full">
              <RecipeCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>

      {drafts.length > 0 && (
        <section className="mb-12 bg-cream-dark rounded-[32px] p-6 md:p-8 border-2 border-dashed border-terracotta/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-heading font-black text-terracotta">Brouillons en attente</h2>
            <Link href="/recipes/drafts" className="text-terracotta text-sm hover:underline font-bold">
              Voir tout ({drafts.length})
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {drafts.slice(0, 4).map(draft => (
              <Card key={draft.id} className="bg-white shadow-sm border border-stone-light/30 flex flex-col rounded-[24px] p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading font-black text-charcoal text-xl line-clamp-1" title={draft.title}>{draft.title || "Nouvelle recette"}</h3>
                  <span className="text-xs font-bold bg-cream-dark text-stone-500 px-3 py-1.5 rounded-full uppercase tracking-wider">{draft.sourceType}</span>
                </div>
                <div className="mt-auto pt-4 flex gap-2">
                  <Button size="sm" variant="primary" className="flex-1 bg-terracotta hover:bg-terracotta-dark text-white rounded-full" onClick={() => router.push(`/import?edit=${draft.id}`)}>
                    Reprendre
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteDraft(draft.id)}>
                    {t("common.delete")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-8">
          <div className="max-w-2xl w-full mb-8 relative">
            <input 
              type="text"
              placeholder={`${t("common.search")}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-white border border-stone-light/30 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all text-charcoal font-medium placeholder:text-stone-500 text-lg"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center p-4 bg-cream-dark rounded-[24px] border border-stone-light/30 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500 font-medium mr-2">
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtres:</span>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm border border-stone-light/30 overflow-hidden relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                 <Utensils className="w-4 h-4" />
              </div>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-transparent py-2.5 pl-9 pr-8 text-sm font-semibold text-charcoal focus:outline-none cursor-pointer"
              >
                {DISH_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm border border-stone-light/30 overflow-hidden relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-terracotta">
                 <Flame className="w-4 h-4" />
              </div>
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none bg-transparent py-2.5 pl-9 pr-8 text-sm font-semibold text-charcoal focus:outline-none cursor-pointer"
              >
                {DIFFICULTIES.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm border border-stone-light/30 overflow-hidden relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                 <Clock className="w-4 h-4" />
              </div>
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="appearance-none bg-transparent py-2.5 pl-9 pr-8 text-sm font-semibold text-charcoal focus:outline-none cursor-pointer"
              >
                {TIMES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            
            <div className="flex bg-white rounded-xl shadow-sm border border-stone-light/30 overflow-hidden relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                 <Eye className="w-4 h-4" />
              </div>
              <select 
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="appearance-none bg-transparent py-2.5 pl-9 pr-8 text-sm font-semibold text-charcoal focus:outline-none cursor-pointer"
              >
                {VISIBILITIES.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {isFiltering && (
              <button 
                onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); setTimeFilter('all'); setTypeFilter('all'); setVisibilityFilter('all'); }}
                className="ml-auto text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-stone-light/30 shadow-sm flex flex-col items-center">
            <div className="mb-4 bg-terracotta/10 p-4 rounded-full">
              <Utensils className="w-12 h-12 text-terracotta" />
            </div>
            <h3 className="text-xl font-medium text-charcoal mb-2">{t("empty_states.no_recipes")}</h3>
            <p className="text-brown">Essayez de modifier vos filtres ou créez une nouvelle recette.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
