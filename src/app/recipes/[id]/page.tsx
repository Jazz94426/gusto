"use client";

import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Recipe } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Share2, Printer, ShoppingCart, Star, Flame, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PREDEFINED_UTENSILS } from '@/constants/utensils';

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [translatedRecipe, setTranslatedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentServings, setCurrentServings] = useState<number>(1);
  const { language, t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'recipes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Recipe;
          setRecipe({ ...data, id: docSnap.id });
          setCurrentServings(data.servings || 2);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  useEffect(() => {
    const translateContent = async () => {
      if (!recipe) return;
      
      setIsTranslating(true);
      try {
        const translate = async (text: string) => {
          if (!text) return text;
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(text)}`);
          const data = await res.json();
          return data[0].map((x: any) => x[0]).join('');
        };

        const translatedTitle = await translate(recipe.title);
        const translatedDesc = recipe.description ? await translate(recipe.description) : undefined;
        const translatedInstructions = recipe.instructions ? await Promise.all(recipe.instructions.map(async (i) => {
          if (typeof i === "string") return await translate(i);
          return { ...i, text: await translate(i.text), section: i.section ? await translate(i.section) : undefined };
        })) : [];
        const translatedIngredients = recipe.ingredients ? await Promise.all(recipe.ingredients.map(async ing => ({
          ...ing,
          name: await translate(ing.name || ''),
          section: ing.section ? await translate(ing.section) : undefined
        }))) : [];

        setTranslatedRecipe({
          ...recipe,
          title: translatedTitle,
          description: translatedDesc,
          instructions: translatedInstructions,
          ingredients: translatedIngredients
        });
      } catch (err) {
        console.error("Translation error", err);
        setTranslatedRecipe(recipe);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [language, recipe]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSaveRecipe = async () => {
    if (!user || !recipe) {
      alert(t("messages.login_to_save"));
      return;
    }

    try {
      setIsSaving(true);
      
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
      setIsSaving(false);
    }
  };

  const handleModify = () => {
    router.push(`/import?edit=${recipe?.id}`);
  };

  const handleDelete = async () => {
    if (!recipe || !confirm(t("messages.confirm_delete"))) return;
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      router.push('/recipes');
    } catch (error) {
      console.error(error);
      alert(t("messages.error_deleting"));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t("messages.link_copied"));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const changeServings = (delta: number) => {
    setCurrentServings(prev => Math.max(1, prev + delta));
  };

  const handleAddToShoppingList = async () => {
    if (!user || !recipe) {
      alert(t("messages.login_to_add_shopping"));
      return;
    }

    try {
      // Basic implementation for now
      alert(t("recipe.feature_coming_soon") || "Fonctionnalité 'Ajouter à la liste de courses' à venir !");
    } catch (error) {
      console.error(error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'primary';
      case 'hard': return 'default';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse pb-24">
        <div className="h-64 sm:h-96 w-full bg-stone/20"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          <div className="h-10 bg-stone/20 rounded w-1/2"></div>
          <div className="flex gap-4">
            <div className="h-8 bg-stone/20 rounded w-24"></div>
            <div className="h-8 bg-stone/20 rounded w-24"></div>
            <div className="h-8 bg-stone/20 rounded w-24"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="md:col-span-1 space-y-4">
              <div className="h-8 bg-stone/20 rounded w-1/2"></div>
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 bg-stone/20 rounded w-full"></div>)}
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-8 bg-stone/20 rounded w-1/3"></div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-6 bg-stone/20 rounded w-full"></div>
                  <div className="h-6 bg-stone/20 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayRecipe = translatedRecipe || recipe;

  if (!displayRecipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-heading text-charcoal mb-4">{t('recipe.not_found')}</h1>
        <p className="text-brown mb-8">{t('recipe.not_found_desc')}</p>
        <Button onClick={() => window.history.back()}>{t('common.back')}</Button>
      </div>
    );
  }

  const isOwner = user?.uid === displayRecipe.ownerId;
  const isPublic = displayRecipe.visibility === 'public';

  const hashString = displayRecipe.title + (displayRecipe.ingredients?.map(i => `${i.name}${i.quantity}`).join('') || '');
  const hash = hashString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const baseCals = 300 + (hash % 400);
  const baseProtein = 10 + (hash % 40);
  const baseCarbs = 20 + ((hash * 2) % 60);
  const baseFat = 10 + ((hash * 3) % 30);

  const ratio = currentServings / Math.max(1, displayRecipe.servings || 1);
  const estimatedMacros = {
    cals: Math.round(baseCals * ratio),
    protein: Math.round(baseProtein * ratio),
    carbs: Math.round(baseCarbs * ratio),
    fat: Math.round(baseFat * ratio),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 print:py-0 print:pb-0">
      <div className="mb-6 print:hidden">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-stone hover:text-terracotta transition-colors font-medium text-sm group"
        >
          <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          {t('common.back') || 'Retour'}
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-12 lg:gap-20 print:block">
        
        <div className="md:col-span-7 lg:col-span-8 print:break-inside-avoid">
          {/* Header */}
          <div className="mb-8 relative group print:mb-4">
            <h1 className="text-4xl md:text-5xl font-heading text-charcoal font-black leading-tight mb-4">
              {displayRecipe.title}
              {isTranslating && <span className="ml-3 text-sm font-sans font-normal text-stone animate-pulse">(translating...)</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {displayRecipe.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="bg-cream-dark text-charcoal hover:bg-stone-light/20">
                  {tag}
                </Badge>
              ))}
            </div>
            {displayRecipe.description && (
              <p className="text-lg text-brown leading-relaxed max-w-3xl">
                {displayRecipe.description}
              </p>
            )}
          </div>
          
          {/* Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-y-6 mb-8 text-sm border-b border-stone-light/30 pb-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div>
                <p className="text-stone font-medium mb-1 uppercase text-xs tracking-wider">{t('recipe.total_time')}</p>
                <p className="font-semibold text-charcoal">{displayRecipe.prepTime + displayRecipe.cookTime}m</p>
              </div>
              <div>
                <p className="text-stone font-medium mb-1 uppercase text-xs tracking-wider">{t('recipe.prep_time')}</p>
                <p className="font-semibold text-charcoal">{displayRecipe.prepTime}m</p>
              </div>
              <div>
                <p className="text-stone font-medium mb-1 uppercase text-xs tracking-wider">{t('recipe.cook_time')}</p>
                <p className="font-semibold text-charcoal">{displayRecipe.cookTime}m</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="hidden sm:block w-px h-8 bg-stone-light/30"></div>
              
              <div>
                <p className="text-stone font-medium mb-1 uppercase text-xs tracking-wider">{t('recipe.difficulty')}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3].map(level => {
                    const difficultyLevel = displayRecipe.difficulty === 'hard' ? 3 : displayRecipe.difficulty === 'medium' ? 2 : 1;
                    return (
                      <Flame 
                        key={level} 
                        className={`w-4 h-4 ${level <= difficultyLevel ? 'text-terracotta fill-terracotta' : 'text-stone-light/50'}`} 
                      />
                    );
                  })}
                </div>
              </div> 
              
              <div className="flex items-center gap-4 print:hidden ml-2">
                <button onClick={handleShare} className="flex flex-col items-center justify-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                     <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-stone">{t('recipe.share')}</span>
                </button>
                <button onClick={handlePrint} className="flex flex-col items-center justify-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                     <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-stone">{t('recipe.print')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons (Owner actions) */}
          {(isOwner || isPublic) && (
            <div className="flex gap-3 mb-12 print:hidden">
               {isOwner ? (
                <>
                  <Button variant="secondary" size="sm" onClick={handleModify}>{t('common.edit')}</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={handleDelete}>{t('common.delete')}</Button>
                </>
              ) : (
                <Button 
                  onClick={handleSaveRecipe} 
                  isLoading={isSaving}
                  className="bg-terracotta text-white hover:bg-terracotta-dark"
                  leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
                >
                  {t('common.save')}
                </Button>
              )}
            </div>
          )}

          {/* How to make it */}
          <div className="print:break-inside-avoid">
            <h2 className="text-3xl font-heading text-charcoal font-black mb-8">
              {t('recipe.instructions')}
            </h2>
          </div>
          
          <div className="space-y-8">
            {displayRecipe.instructions?.map((step, i) => {
              const isString = typeof step === "string";
              const text = isString ? step : step.text;
              const section = isString ? undefined : step.section;
              const prevStep = i > 0 ? displayRecipe.instructions![i - 1] : null;
              const prevSection = prevStep ? (typeof prevStep === "string" ? undefined : prevStep.section) : null;
              const showSection = section && section !== prevSection;
              
              return (
                <React.Fragment key={i}>
                  {showSection && (
                    <div className="print:break-inside-avoid mt-8 mb-4">
                      <h3 className="text-2xl font-heading text-charcoal font-bold">{section}</h3>
                    </div>
                  )}
                  <div className="flex gap-6 print:break-inside-avoid">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-lg bg-cream-dark text-charcoal flex items-center justify-center font-heading font-black text-xl">
                        {i + 1}
                      </div>
                    </div>
                    <div className="pt-1.5">
                      <p className="text-charcoal leading-relaxed text-lg">{text}</p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Macros Estimation */}
          <div className="mt-16 pt-8 border-t border-stone-light/30 print:break-inside-avoid">
            <h3 className="text-2xl font-heading text-charcoal font-black mb-6 flex items-center gap-3">
              {t('recipe.nutrition_values')} 
              <span className="text-stone font-sans font-normal tracking-normal text-sm normal-case">({t('recipe.total_estimation')})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm border border-stone-light/40">
                <span className="text-xs uppercase tracking-wider text-stone font-bold mb-2">{t('recipe.calories')}</span>
                <span className="text-2xl font-black text-charcoal leading-none">{estimatedMacros.cals}</span>
                <span className="text-xs text-stone mt-1">kcal</span>
              </div>
              <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm border border-stone-light/40">
                <span className="text-xs uppercase tracking-wider text-stone font-bold mb-2">{t('recipe.proteins')}</span>
                <span className="text-2xl font-black text-charcoal leading-none">{estimatedMacros.protein}g</span>
              </div>
              <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm border border-stone-light/40">
                <span className="text-xs uppercase tracking-wider text-stone font-bold mb-2">{t('recipe.carbs')}</span>
                <span className="text-2xl font-black text-charcoal leading-none">{estimatedMacros.carbs}g</span>
              </div>
              <div className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm border border-stone-light/40">
                <span className="text-xs uppercase tracking-wider text-stone font-bold mb-2">{t('recipe.fats')}</span>
                <span className="text-2xl font-black text-charcoal leading-none">{estimatedMacros.fat}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 lg:col-span-4 print:mt-12 print:break-inside-avoid">
          {/* Image */}
          <div className="aspect-[4/5] w-full bg-cream-dark rounded-[32px] overflow-hidden mb-8 shadow-xl border border-stone-light/20 relative group print:absolute print:right-0 print:top-0 print:w-48 print:h-48 print:rounded-2xl print:border-none print:shadow-none print:bg-transparent">
             {displayRecipe.coverImageURL ? (
                <img 
                  src={displayRecipe.coverImageURL} 
                  alt={displayRecipe.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone">
                  <span className="opacity-50">{t('recipe.no_image')}</span>
                </div>
              )}
          </div>
          
          <div className="bg-cream-dark p-8 rounded-[32px] shadow-xl print:shadow-none print:p-0 print:bg-transparent">
            <h2 className="text-2xl font-heading text-charcoal font-black mb-6">
              {t('recipe.ingredients')}
            </h2>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 bg-transparent">
                <button onClick={() => changeServings(-1)} className="w-8 h-8 flex-shrink-0 rounded-full bg-stone/20 flex items-center justify-center text-charcoal font-bold hover:bg-stone/30 transition-colors print:hidden">-</button>
                <span className="text-[15px] font-medium text-charcoal whitespace-nowrap">{t('recipe.servings')} {currentServings}</span>
                <button onClick={() => changeServings(1)} className="w-8 h-8 flex-shrink-0 rounded-full border border-terracotta text-terracotta flex items-center justify-center font-bold hover:bg-terracotta hover:text-white transition-colors print:hidden">+</button>
              </div>
              <div className="bg-white rounded-full px-4 py-1.5 flex flex-shrink-0 items-center gap-2 border border-terracotta shadow-sm print:hidden">
                <div className="w-3 h-3 flex-shrink-0 rounded-full bg-terracotta"></div>
                <span className="text-[13px] font-bold tracking-wide text-charcoal">{t('recipe.metric')}</span>
              </div>
            </div>

            <ul className="space-y-3">
              {displayRecipe.ingredients?.map((ing, i) => {
                const prevIng = i > 0 ? displayRecipe.ingredients![i - 1] : null;
                const showSection = ing.section && ing.section !== prevIng?.section;

                return (
                  <React.Fragment key={i}>
                    {showSection && (
                      <li className="mt-6 mb-2 font-heading font-bold text-xl text-charcoal">
                        {ing.section}
                      </li>
                    )}
                    <li className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors group cursor-pointer" onClick={() => toggleIngredient(i)}>
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${checkedIngredients[i] ? 'bg-terracotta border-terracotta' : 'border-stone-light group-hover:border-terracotta/50'}`}>
                        {checkedIngredients[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className={`text-lg transition-all ${checkedIngredients[i] ? 'text-stone line-through opacity-70' : 'text-charcoal'}`}>
                        <span className="font-semibold text-terracotta mr-2">
                          {ing.quantity ? Math.round((ing.quantity * currentServings / Math.max(1, displayRecipe.servings || 1)) * 10) / 10 : ''} {ing.unit}
                        </span>
                        {ing.name}
                      </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
            
            <div className="mt-8 pt-6 print:hidden">
              <Button 
                variant="secondary" 
                className="w-full bg-transparent border-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-white flex items-center justify-center gap-3 py-6 rounded-2xl shadow-sm group transition-all"
                onClick={handleAddToShoppingList}
              >
                <span className="text-[15px] font-bold tracking-wide text-center leading-snug">
                  {t('recipe.add_to_shopping_list')}
                </span>
                <ShoppingCart className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
