"use client";

import React from 'react';
import Link from 'next/link';
import { Recipe } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, Flame, Utensils } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  showSaveButton?: boolean;
  onSave?: (e: React.MouseEvent) => void;
}

export function RecipeCard({ recipe, showSaveButton, onSave }: RecipeCardProps) {
  const difficultyLevel = recipe.difficulty === 'hard' ? 3 : recipe.difficulty === 'medium' ? 2 : 1;

  const coverImage = (
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-cream-dark">
      {recipe.coverImageURL ? (
        <img 
          src={recipe.coverImageURL} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone/50">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {showSaveButton && onSave && (
        <div className="absolute top-3 right-3">
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-white/90 hover:bg-white border-none shadow-sm text-terracotta"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(e);
            }}
          >
            Sauvegarder
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 rounded-[24px] group">
      <Card variant="interactive" imageHeader={coverImage} className="h-full flex flex-col border border-stone-light/30 bg-white shadow-sm overflow-hidden rounded-[24px]">
        <h3 className="font-heading text-[1.5rem] font-black text-charcoal mb-4 line-clamp-2 leading-tight">
          {recipe.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-[15px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map(level => (
              <Flame 
                key={level} 
                className={`w-[15px] h-[15px] ${level <= difficultyLevel ? 'text-terracotta fill-terracotta' : 'text-stone-light/30 fill-stone-light/10'}`} 
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4" />
            <span>{recipe.servings} serv.</span>
          </div>
        </div>
        
        <div className="mt-auto pt-1">
          <div className="flex flex-wrap gap-2">
            {recipe.tags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[13px] font-medium px-3.5 py-1 bg-cream rounded-full text-charcoal/70">
                {tag}
              </span>
            ))}
            {(recipe.tags?.length || 0) > 3 && (
              <span className="text-[13px] font-medium px-3.5 py-1 bg-cream rounded-full text-charcoal/70">
                +{(recipe.tags?.length || 0) - 3}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
