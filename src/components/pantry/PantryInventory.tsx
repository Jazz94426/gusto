'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { PantryItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ReceiptScanner } from './ReceiptScanner';
import { BarcodeScanner } from './BarcodeScanner';
import { Plus, Trash2, ChevronRight, ScanLine, Barcode } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { PantryItemSkeleton } from '@/components/ui/skeletons/PantryItemSkeleton';

const CATEGORIES = [
  'Fruits & Légumes', 'Viandes', 'Produits laitiers', 'Boulangerie', 
  'Épicerie', 'Boissons', 'Surgelés', 'Condiments', 'Autre'
];

export function PantryInventory() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const translateDynamic = (type: 'items' | 'recipes', name: string) => {
    const key = `${type}.${name}`;
    const translated = t(key);
    return translated === key ? name : translated;
  };

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    return CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
  });
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pièce');
  const [newItemCat, setNewItemCat] = useState('Autre');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'pantryItems'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: PantryItem[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as PantryItem);
      });
      data.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;
    
    await addDoc(collection(db, 'pantryItems'), {
      userId: user.uid,
      name: newItemName.trim(),
      category: newItemCat,
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit,
      addedAt: new Date()
    });
    
    setNewItemName('');
    setNewItemQty('');
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'pantryItems', id));
  };

  const handleBarcodeScanResult = async (productName: string, barcode: string, imageUrl?: string) => {
    if (!user) return;
    
    await addDoc(collection(db, 'pantryItems'), {
      userId: user.uid,
      name: productName,
      category: 'Épicerie',
      quantity: 1,
      unit: 'pièce',
      barcode,
      imageUrl: imageUrl || null,
      addedAt: new Date()
    });
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-6 space-x-2">
        <Button variant="secondary" onClick={() => setIsBarcodeScannerOpen(true)} size="sm" className="bg-stone/5 hover:bg-stone/10 text-charcoal border-none">
          <Barcode className="w-4 h-4 mr-2" />
          {t("pantry.scan_barcode")}
        </Button>
        <Button variant="secondary" onClick={() => setIsScannerOpen(true)} size="sm" className="bg-stone/5 hover:bg-stone/10 text-charcoal border-none">
          <ScanLine className="w-4 h-4 mr-2" />
          {t("pantry.import_receipt")}
        </Button>
      </div>

      <form onSubmit={handleAddItem} className="grid grid-cols-2 md:grid-cols-12 gap-3 mb-8 items-center">
        <div className="col-span-2 md:col-span-4">
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
        <div className="col-span-1 md:col-span-2">
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
        <div className="col-span-2 md:col-span-3">
          <Select 
            options={CATEGORIES.map(c => ({label: t(`categories.${c}`) || c, value: c}))} 
            value={newItemCat}
            onChange={e => setNewItemCat(e.target.value)}
            className="h-[44px] !rounded-2xl"
          />
        </div>
        <div className="col-span-2 md:col-span-1 flex">
          <Button type="submit" size="md" className="w-full h-[44px] flex items-center justify-center rounded-2xl p-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="py-2">
            {[1, 2, 3].map(i => <PantryItemSkeleton key={i} />)}
          </div>
        ) : (
          CATEGORIES.map(cat => {
            const catItems = groupedItems[cat];
            if (catItems.length === 0) return null;
            
            return (
              <div key={cat} className="mb-6">
                <button 
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center w-full text-left py-2 mb-2 group transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 mr-2 text-stone-400 transition-transform ${expandedCats[cat] ? 'rotate-90' : ''}`} />
                  <h3 className="font-heading font-black text-lg text-charcoal flex-1">{t(`categories.${cat}`) || cat}</h3>
                  <span className="text-xs font-medium text-stone-500 bg-stone/5 px-2.5 py-1 rounded-full">{catItems.length}</span>
                </button>
                
                {expandedCats[cat] && (
                  <ul className="space-y-2">
                    {catItems.map(item => (
                      <li key={item.id} className="flex justify-between items-center group py-3 px-4 bg-white border border-stone-light/30 hover:border-terracotta/30 rounded-[16px] shadow-sm hover:shadow transition-all">
                        <div className="flex items-center flex-1 min-w-0 pr-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-contain bg-white rounded-md mr-3 border border-stone-light/30 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md mr-3 bg-stone/5 flex items-center justify-center border border-stone-light/30 flex-shrink-0">
                              <span className="text-xs text-stone-400 font-bold">{item.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <span className="font-medium text-charcoal truncate flex-1">{translateDynamic('items', item.name)}</span>
                        </div>
                        <div className="flex items-center justify-end w-24 flex-shrink-0 mr-3">
                          <span className="text-sm font-medium text-stone-400 bg-stone/5 px-2 py-0.5 rounded-md whitespace-nowrap">
                            {item.quantity} {item.unit === 'pièce' ? t('pantry.piece') : item.unit}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all focus:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 bg-stone/5 rounded-[24px] border border-dashed border-stone-light/50">
            <p className="text-stone-500 font-medium">{t("empty_states.pantry_empty")}</p>
          </div>
        )}
      </div>

      <BarcodeScanner 
        isOpen={isBarcodeScannerOpen} 
        onClose={() => setIsBarcodeScannerOpen(false)} 
        onScanResult={handleBarcodeScanResult} 
      />
      <ReceiptScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
}
