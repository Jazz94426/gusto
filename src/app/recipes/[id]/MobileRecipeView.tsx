import React from 'react';
import { Recipe } from '@/types';
import { ChevronLeft, Share, Heart, Flame, Plus, Shuffle, Sparkles, ChevronRight, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  recipe: Recipe;
  currentServings: number;
  changeServings: (delta: number) => void;
  checkedIngredients: Record<number, boolean>;
  toggleIngredient: (index: number) => void;
  isOwner: boolean;
  isPublic: boolean;
  handleSaveRecipe: () => void;
  isSaving: boolean;
}

export function MobileRecipeView({ 
  recipe, 
  currentServings, 
  changeServings, 
  checkedIngredients, 
  toggleIngredient,
  isOwner,
  isPublic,
  handleSaveRecipe,
  isSaving
}: Props) {
  const router = useRouter();

  const difficultyLevel = recipe.difficulty === 'hard' ? 3 : recipe.difficulty === 'medium' ? 2 : 1;
  const difficultyLabel = recipe.difficulty === 'hard' ? 'Hard' : recipe.difficulty === 'medium' ? 'Medium' : 'Beginner';
  const prepTime = recipe.prepTime || 0;
  const cookTime = recipe.cookTime || 0;
  const overallTime = prepTime + cookTime;

  // Calculate ready time
  const now = new Date();
  now.setMinutes(now.getMinutes() + overallTime);
  const readyTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  return (
    <div className="bg-[#090909] min-h-screen text-white pb-32 font-sans selection:bg-[#FDBF7E]/30">
      {/* Hero Section */}
      <div className="relative w-full h-[60vh]">
        {recipe.coverImageURL ? (
          <img 
            src={recipe.coverImageURL} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-stone-900 flex items-center justify-center">
            <span className="text-gray-500">No image</span>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#090909]"></div>

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center z-10">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
              <Share className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title and Author */}
        <div className="absolute bottom-6 left-5 right-5 z-10">
          <h1 className="text-[34px] leading-tight font-bold text-white mb-3 tracking-tight">
            {recipe.title}
          </h1>
          <div className="flex items-center text-[15px] text-gray-200">
            <div className="w-6 h-6 rounded-full bg-gray-600 mr-2 overflow-hidden flex items-center justify-center">
               <UserAvatar name={recipe.ownerName || "Unknown"} />
            </div>
            <span className="font-medium">{recipe.ownerName || "Unknown"}</span>
            <ChevronRight className="w-4 h-4 ml-1 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex overflow-x-auto gap-3 px-5 py-2 hide-scrollbar snap-x">
        <button className="snap-start flex-shrink-0 bg-[#FDBF7E] text-black px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 fill-black" /> Cook
        </button>
        <button className="snap-start flex-shrink-0 bg-[#1C1C1E] border border-white/5 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#FDBF7E]" /> Plan
        </button>
        <button className="snap-start flex-shrink-0 bg-[#1C1C1E] border border-white/5 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-[#FDBF7E]" /> Remix
        </button>
        <button className="snap-start flex-shrink-0 bg-[#1C1C1E] border border-white/5 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FDBF7E]" /> Ask
        </button>
        {(!isOwner && !isPublic) ? null : (!isOwner && isPublic) ? (
          <button 
            onClick={handleSaveRecipe}
            className="snap-start flex-shrink-0 bg-[#1C1C1E] border border-white/5 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2"
          >
            {isSaving ? "Saving..." : "Save Recipe"}
          </button>
        ) : null}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[15px] leading-relaxed text-[#8E8E93]">
            {recipe.description}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 px-5 py-5 border-b border-white/10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-[#8E8E93] text-[13px] font-medium">
            Level
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1.5 h-3 rounded-full ${i <= difficultyLevel ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
          <div className="font-bold text-[15px]">{difficultyLabel}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[#8E8E93] text-[13px] font-medium">Cooking</div>
          <div className="font-bold text-[15px]">{cookTime}m</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[#8E8E93] text-[13px] font-medium">Overall</div>
          <div className="font-bold text-[15px]">{overallTime}m</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[#8E8E93] text-[13px] font-medium">Ready</div>
          <div className="font-bold text-[15px]">{readyTime}</div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="px-5 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-bold text-white flex items-center gap-2">
            Ingredients <LayoutGrid className="w-5 h-5 text-gray-500" />
          </h2>
          <div className="flex items-center text-sm font-medium text-gray-400">
            <button className="p-2" onClick={() => changeServings(-1)}>-</button>
            <span className="mx-2 text-white">{currentServings} portions</span>
            <button className="p-2" onClick={() => changeServings(1)}>+</button>
          </div>
        </div>

        <ul className="space-y-4">
          {recipe.ingredients?.map((ing, i) => (
            <li key={i} className="flex items-start gap-4" onClick={() => toggleIngredient(i)}>
              <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checkedIngredients[i] ? 'bg-[#FDBF7E] border-[#FDBF7E]' : 'border-gray-600'}`}>
                {checkedIngredients[i] && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className={`text-[17px] ${checkedIngredients[i] ? 'text-gray-500 line-through' : 'text-white'}`}>
                <span className="font-bold mr-2 text-white/90">
                  {ing.quantity ? Math.round((ing.quantity * currentServings / Math.max(1, recipe.servings || 1)) * 10) / 10 : ''} {ing.unit}
                </span>
                <span className="text-gray-300">{ing.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Instructions */}
      <div className="px-5 py-4 pb-20">
        <h2 className="text-[22px] font-bold text-white mb-6">Instructions</h2>
        <div className="space-y-8">
          {recipe.instructions?.map((step, i) => {
            const isString = typeof step === "string";
            const text = isString ? step : step.text;
            return (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                </div>
                <div className="pt-0.5">
                  <p className="text-gray-300 leading-relaxed text-[17px]">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return <span className="text-xs text-white font-bold">{initial}</span>;
}
