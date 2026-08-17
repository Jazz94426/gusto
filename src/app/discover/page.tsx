"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Filter, Flame, Clock, Utensils, Star, TrendingUp } from 'lucide-react';
import { RecipeCardSkeleton } from '@/components/ui/skeletons/RecipeCardSkeleton';

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

export default function DiscoverPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New modern filter states
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const recipesRef = collection(db, 'recipes');
      const q = query(
        recipesRef,
        where('visibility', '==', 'public'),
        where('status', '==', 'validated'),
        orderBy('createdAt', 'desc'),
        limit(100) // Fetched more to allow good trending/favorites sections
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedRecipes: Recipe[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedRecipes.push({ id: doc.id, ...doc.data() } as Recipe);
      });
      
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSaveRecipe = async (recipe: Recipe, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert(t("messages.login_to_save"));
      return;
    }

    try {
      setSavingId(recipe.id);
      
      const { id, ...recipeData } = recipe; 
      
      const newRecipeData = {
        ...recipeData,
        ownerId: user.uid,
        ownerName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        visibility: 'private',
        status: 'validated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sourceRecipeId: recipe.id,
      };
      
      await addDoc(collection(db, 'recipes'), newRecipeData);
      
      alert(t("messages.recipe_saved"));
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert(t("messages.error_saving"));
    } finally {
      setSavingId(null);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    // Basic local text search
    if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Difficulty
    if (difficultyFilter !== 'all' && recipe.difficulty !== difficultyFilter) {
      return false;
    }
    
    // Time
    if (timeFilter !== 'all') {
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (timeFilter === '30' && totalTime > 30) return false;
      if (timeFilter === '60' && totalTime > 60) return false;
    }
    
    // Type (Dish Type based on tags)
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

  const isFiltering = searchQuery !== '' || difficultyFilter !== 'all' || timeFilter !== 'all' || typeFilter !== 'all';

  // Sections (Curated views when not filtering)
  const trendingRecipes = recipes.slice(0, 4);
  const favoriteRecipes = recipes.slice(4, 8);
  const otherRecipes = recipes.slice(8);

  const renderRecipeGrid = (recipeList: Recipe[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {recipeList.map(recipe => (
        <div key={recipe.id} className="relative h-full">
          <RecipeCard 
            recipe={recipe} 
            showSaveButton={user ? user.uid !== recipe.ownerId : true}
            onSave={(e) => handleSaveRecipe(recipe, e)}
          />
          {savingId === recipe.id && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[24px] flex items-center justify-center z-10">
              <div className="animate-spin text-terracotta">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-container py-8 pb-24">
      <div className="mb-12">
        <h1 className="font-heading text-5xl md:text-6xl font-black text-charcoal mb-8 tracking-tight">Découvrir</h1>
        
        {/* Search Bar */}
        <div className="max-w-2xl w-full mb-8 relative">
          <input 
            type="text" 
            placeholder="Rechercher une recette, un ingrédient..."
            className="w-full pl-14 pr-4 py-4 bg-white border border-stone-light/30 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all text-charcoal font-medium placeholder:text-stone-500 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Modern Filter System */}
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

          {isFiltering && (
            <button 
              onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); setTimeFilter('all'); setTypeFilter('all'); }}
              className="ml-auto text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-full">
              <RecipeCardSkeleton />
            </div>
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        
        isFiltering ? (
          /* Search Results View */
          <div>
            <h2 className="text-2xl font-heading font-black text-charcoal mb-6">Résultats de la recherche ({filteredRecipes.length})</h2>
            {renderRecipeGrid(filteredRecipes)}
          </div>
        ) : (
          /* Default Curated View */
          <div className="space-y-16">
            
            {trendingRecipes.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h2 className="text-3xl font-heading font-black text-charcoal tracking-tight">Tendances</h2>
                </div>
                {renderRecipeGrid(trendingRecipes)}
              </section>
            )}

            {favoriteRecipes.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                    <Star className="w-5 h-5 fill-yellow-600" />
                  </div>
                  <h2 className="text-3xl font-heading font-black text-charcoal tracking-tight">Coups de cœur de la communauté</h2>
                </div>
                {renderRecipeGrid(favoriteRecipes)}
              </section>
            )}

            {otherRecipes.length > 0 && (
              <section>
                <h2 className="text-3xl font-heading font-black text-charcoal tracking-tight mb-6">Toutes les recettes</h2>
                {renderRecipeGrid(otherRecipes)}
              </section>
            )}

          </div>
        )
      ) : (
        <div className="text-center py-20 bg-white rounded-[32px] border border-stone-light/30 shadow-sm">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-xl font-medium text-charcoal mb-2">Aucune recette trouvée</h3>
          <p className="text-brown">Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      )}
    </div>
  );
}
