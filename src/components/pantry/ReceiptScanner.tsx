'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { extractItemsFromReceipt } from '@/lib/ai';
import { ImagePlus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
}

export function ReceiptScanner({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ReceiptItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setImagePreview(null);
    setImageBase64(null);
    setMimeType('');
    setExtractedItems([]);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result.split(',')[1]); // get base64 data
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !mimeType) return;
    setIsLoading(true);
    try {
      const data = await extractItemsFromReceipt(imageBase64, mimeType);
      const items = (data.items || []).map((item: any) => ({
        ...item,
        checked: true
      }));
      setExtractedItems(items);
    } catch (error) {
      console.error('Failed to extract items', error);
      alert('Erreur lors de l\'analyse du reçu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user) return;
    const selectedItems = extractedItems.filter(i => i.checked);
    for (const item of selectedItems) {
      await addDoc(collection(db, 'pantryItems'), {
        userId: user.uid,
        name: item.name,
        category: item.category,
        quantity: item.quantity || 1,
        unit: item.unit || 'pièce',
        addedAt: new Date()
      });
    }
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("pantry.scan_receipt") || "Scanner un reçu"}>
      <div className="flex flex-col gap-4">
        {!imagePreview ? (
          <div className="flex flex-col gap-4">
            <div 
              className="border-[3px] border-dashed border-stone-light/40 bg-stone/5 rounded-[24px] py-8 px-6 text-center cursor-pointer hover:bg-stone/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mb-4 flex justify-center">
                <ImagePlus className="w-12 h-12 text-[#8B7E70]" strokeWidth={1.5} />
              </div>
              <p className="text-[22px] text-charcoal mb-2 font-medium tracking-tight">{t("pantry.click_to_upload") || "Cliquez pour importer un reçu"}</p>
              <p className="text-base text-[#8B7E70]">{t("pantry.receipt_formats") || "PNG, JPG scannez ou photographiez votre reçu"}</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {extractedItems.length === 0 ? (
              <>
                <img src={imagePreview} alt={t("pantry.receipt_preview") || "Aperçu du reçu"} className="max-h-64 object-contain rounded-xl border border-stone mx-auto" />
                <Button 
                  onClick={handleAnalyze} 
                  isLoading={isLoading} 
                  className="w-full"
                >
                  Analyser le reçu
                </Button>
                <Button variant="ghost" onClick={resetState}>Changer d'image</Button>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium text-charcoal">Articles détectés</h3>
                <div className="max-h-64 overflow-y-auto border border-stone/30 rounded-xl p-2 bg-cream-dark/50">
                  {extractedItems.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 hover:bg-cream rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.checked}
                        onChange={(e) => {
                          const newItems = [...extractedItems];
                          newItems[idx].checked = e.target.checked;
                          setExtractedItems(newItems);
                        }}
                        className="w-4 h-4 text-terracotta rounded border-stone focus:ring-terracotta"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal">{item.name}</p>
                        <p className="text-xs text-brown">{item.quantity} {item.unit} • {item.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button onClick={handleAddItem} className="w-full">
                  Ajouter au garde-manger
                </Button>
                <Button variant="ghost" onClick={resetState}>Recommencer</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
