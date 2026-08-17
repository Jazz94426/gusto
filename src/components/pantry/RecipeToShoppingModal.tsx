'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { computeMissingIngredients } from '@/lib/ai';
import type { Recipe, PantryItem, Ingredient } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

export function RecipeToShoppingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [missingItems, setMissingItems] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const fetchRecipes = async () => {
      const q = query(
        collection(db, 'recipes'),
        where('ownerId', '==', user.uid),
        where('status', '==', 'validated')
      );
      const snapshot = await getDocs(q);
      const data: Recipe[] = [];
      snapshot.forEach(docSnap => data.push({ id: docSnap.id, ...docSnap.data() } as Recipe));
      setRecipes(data);
      setLoading(false);
    };
    
    fetchRecipes();
  }, [user, isOpen]);

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!user) return;
    
    // Cross-reference pantry
    const pantryQ = query(collection(db, 'pantryItems'), where('userId', '==', user.uid));
    const pantrySnap = await getDocs(pantryQ);
    const pantryItems: { name: string; quantity: number; unit: string }[] = [];
    pantrySnap.forEach(docSnap => {
      const d = docSnap.data() as PantryItem;
      pantryItems.push({ name: d.name, quantity: d.quantity, unit: d.unit });
    });

    const missing = computeMissingIngredients(recipe.ingredients || [], pantryItems);
    
    if (missing.length > 0) {
      setSelectedRecipe(recipe);
      setMissingItems(missing);
      setStep(2);
    } else {
      onClose();
    }
  };

  const handleAddMissingToShoppingList = async () => {
    if (!user || !selectedRecipe) return;
    
    for (const item of missingItems) {
      await addDoc(collection(db, 'shoppingList'), {
        userId: user.uid,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'pièce',
        checked: false,
        sourceRecipeId: selectedRecipe.id,
        sourceRecipeName: selectedRecipe.title,
        addedAt: new Date()
      });
    }
    onClose();
  };

  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 1 ? t("planner.assign_recipe") : t("pantry.ingredients_to_add")}>
      {step === 1 ? (
        <div className="flex flex-col h-full min-h-[400px]">
          <Input 
            placeholder={`${t("common.search")}...`} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="mb-4"
          />
          
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="text-center py-4 text-brown">{t("common.loading")}</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="flex flex-col bg-white rounded-xl overflow-hidden border border-stone/20 hover:border-terracotta hover:shadow-md transition-all text-left"
                  >
                    {recipe.coverImageURL ? (
                      <img src={recipe.coverImageURL} alt={recipe.title} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-cream-dark flex items-center justify-center text-brown">
                        {t("recipe.no_image")}
                      </div>
                    )}
                    <div className="p-2">
                      <h3 className="text-sm font-medium text-charcoal line-clamp-2">{recipe.title}</h3>
                    </div>
                  </button>
                ))}
                {filteredRecipes.length === 0 && (
                  <div className="col-span-full text-center py-8 text-brown">{t("empty_states.no_recipes")}</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-charcoal">{t("pantry.missing_ingredients")} <strong>{selectedRecipe?.title}</strong> :</p>
          
          <ul className="space-y-2 max-h-64 overflow-y-auto bg-cream-dark p-4 rounded-xl border border-stone/20">
            {missingItems.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span className="font-medium text-charcoal">{item.name}</span>
                <span className="text-sm text-brown">{item.quantity} {item.unit}</span>
              </li>
            ))}
          </ul>
          
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleAddMissingToShoppingList}>
              {t("recipe.add_to_shopping_list")}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t("pantry.ignore")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
