'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { ShoppingItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, CheckCircle2, Circle, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { RecipeToShoppingModal } from './RecipeToShoppingModal';
import { ChefHat } from 'lucide-react';
import { PantryItemSkeleton } from '@/components/ui/skeletons/PantryItemSkeleton';

export function ShoppingList() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const translateDynamic = (type: 'items' | 'recipes', name: string) => {
    const key = `${type}.${name}`;
    const translated = t(key);
    return translated === key ? name : translated;
  };

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pièce');
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'shoppingList'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ShoppingItem[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as ShoppingItem);
      });
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;
    
    await addDoc(collection(db, 'shoppingList'), {
      userId: user.uid,
      name: newItemName.trim(),
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit,
      checked: false,
      addedAt: new Date()
    });
    
    setNewItemName('');
    setNewItemQty('');
  };

  const toggleCheck = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'shoppingList', id), { checked: !current });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'shoppingList', id));
  };

  const handleDeleteSource = async (sourceName: string) => {
    if (!user) return;
    const itemsToDelete = items.filter(i => i.sourceRecipeName === sourceName);
    for (const item of itemsToDelete) {
      await deleteDoc(doc(db, 'shoppingList', item.id));
    }
  };

  const moveToPantry = async () => {
    if (!user) return;
    const checkedItems = items.filter(i => i.checked);
    for (const item of checkedItems) {
      await addDoc(collection(db, 'pantryItems'), {
        userId: user.uid,
        name: item.name,
        category: 'Autre', // Default category since shopping list doesn't strictly have one
        quantity: item.quantity,
        unit: item.unit,
        addedAt: new Date()
      });
      await deleteDoc(doc(db, 'shoppingList', item.id));
    }
  };

  // Grouping logic
  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

  const groupedUnchecked = uncheckedItems.reduce((acc, item) => {
    const source = item.sourceRecipeName || t('import.manual');
    if (!acc[source]) acc[source] = [];
    acc[source].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const hasCheckedItems = checkedItems.length > 0;

  return (
    <div className="flex flex-col h-full relative pb-16">
      <form onSubmit={handleAddItem} className="grid grid-cols-2 md:grid-cols-12 gap-3 mb-8 items-center">
        <div className="col-span-2 md:col-span-5">
          <input 
            type="text"
            placeholder={t("pantry.product")} 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
            className="w-full bg-stone/5 border border-transparent rounded-2xl px-4 text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-all text-sm h-[44px]"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <input 
            type="number"
            placeholder={t("pantry.qty")} 
            value={newItemQty} 
            onChange={e => setNewItemQty(e.target.value)} 
            className="w-full bg-stone/5 border border-transparent rounded-2xl px-4 text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-all text-sm h-[44px]"
          />
        </div>
        <div className="col-span-1 md:col-span-3">
          <Select 
            options={[
              {label: t("pantry.piece"), value: 'pièce'}, 
              {label: 'kg', value: 'kg'}, 
              {label: 'g', value: 'g'}, 
              {label: 'L', value: 'L'}, 
              {label: 'mL', value: 'mL'}
            ]} 
            value={newItemUnit}
            onChange={e => setNewItemUnit(e.target.value)}
            className="h-[44px] !rounded-2xl"
          />
        </div>
        <div className="col-span-2 md:col-span-2 flex gap-2">
          <Button type="submit" size="md" className="flex-1 h-[44px] flex items-center justify-center rounded-2xl p-0">
            <Plus className="w-5 h-5" />
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            size="md" 
            onClick={() => setIsRecipeModalOpen(true)}
            className="flex-1 h-[44px] flex items-center justify-center rounded-2xl p-0 border-terracotta text-terracotta hover:bg-terracotta/10"
            title={t("planner.assign_recipe")}
          >
            <ChefHat className="w-5 h-5" />
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        {loading ? (
          <div className="py-2">
            {[1, 2, 3].map(i => <PantryItemSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {Object.entries(groupedUnchecked).map(([source, groupItems]) => (
              <div key={source} className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    {source === 'Manuelle' ? t('pantry.manual') : translateDynamic('recipes', source)}
                  </h3>
                  {source !== 'Manuelle' && (
                    <button 
                      onClick={() => handleDeleteSource(source)}
                      className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                      title={t("pantry.remove_recipe") || "Retirer cette recette"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {groupItems.map(item => (
                    <li key={item.id} className={`flex items-center gap-3 p-3 sm:px-4 bg-white border ${item.checked ? 'border-stone-light/40 bg-stone/5' : 'border-stone-light/30 hover:border-terracotta/30'} rounded-[16px] shadow-sm hover:shadow transition-all group`}>
                      <button 
                        onClick={() => toggleCheck(item.id, item.checked)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-terracotta border-terracotta' : 'border-stone-light group-hover:border-terracotta/50'}`}
                      >
                        {item.checked && <Check className="w-4 h-4 text-white" />}
                      </button>
                      
                      {(item as any).imageUrl ? (
                        <img src={(item as any).imageUrl} alt={item.name} className={`w-8 h-8 object-contain bg-white rounded-md border border-stone-light/30 ${item.checked ? 'opacity-50' : ''}`} />
                      ) : (
                        <div className={`w-8 h-8 rounded-md bg-stone/5 flex items-center justify-center border border-stone-light/30 ${item.checked ? 'opacity-50' : ''}`}>
                          <span className="text-xs text-stone-400 font-bold">{item.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-4 flex items-center">
                        <span className={`font-medium truncate flex-1 ${item.checked ? 'text-stone-400 line-through' : 'text-charcoal'}`}>
                          {translateDynamic('items', item.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end w-24 flex-shrink-0 mr-3">
                        <span className="text-sm font-medium text-stone-400 bg-stone/5 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {item.quantity} {item.unit === 'pièce' ? t('pantry.piece') : item.unit}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all focus:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasCheckedItems && (
              <div className="mt-8">
                <h3 className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-wider">{t("common.done")}</h3>
                <ul className="space-y-2">
                  {checkedItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 bg-stone/5 border border-transparent p-3 sm:px-4 rounded-[16px] group transition-all cursor-pointer opacity-75" onClick={() => toggleCheck(item.id, item.checked)}>
                      <button className="flex-shrink-0 text-terracotta focus:outline-none">
                        <CheckCircle2 className="w-6 h-6" fill="currentColor" stroke="white" strokeWidth={1.5} />
                      </button>

                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-contain bg-white rounded-md border border-stone-light/30 opacity-50" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-stone/5 flex items-center justify-center border border-stone-light/30 opacity-50">
                          <span className="text-xs text-stone-400 font-bold">{item.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-4 flex items-center line-through text-stone-400">
                        <span className="font-medium truncate flex-1">
                          {translateDynamic('items', item.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end w-24 flex-shrink-0 mr-3">
                        <span className="text-sm font-medium text-stone-400 bg-stone/5 px-2 py-0.5 rounded-md whitespace-nowrap line-through">
                          {item.quantity} {item.unit === 'pièce' ? t('pantry.piece') : item.unit}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {!loading && items.length === 0 && (
              <div className="text-center py-12 bg-stone/5 rounded-[24px] border border-dashed border-stone-light/50">
                <p className="text-stone-500 font-medium">{t("empty_states.pantry_empty")}</p>
              </div>
            )}
          </>
        )}
      </div>

      {hasCheckedItems && (
        <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent">
          <Button onClick={moveToPantry} className="w-full shadow-lg rounded-2xl py-6 text-base font-bold bg-charcoal hover:bg-black text-white h-[44px]">
            {t("pantry.move_to_pantry")} ({checkedItems.length})
          </Button>
        </div>
      )}

      <RecipeToShoppingModal 
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
      />
    </div>
  );
}
