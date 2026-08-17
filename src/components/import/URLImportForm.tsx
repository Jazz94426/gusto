"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { extractRecipeFromText } from "@/lib/ai";
import { fetchUrlText } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface URLImportFormProps {
  onSuccess: (data: any) => void;
}

export function URLImportForm({ onSuccess }: URLImportFormProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          // Progress goes up to 90% over 15 seconds (15000ms / 100ms = 150 ticks -> ~0.6 per tick)
          if (p >= 90) return 90;
          return p + 0.6;
        });
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { text, image } = await fetchUrlText(url);
      const data = await extractRecipeFromText(text);
      if (image && !data.coverImageURL) {
        data.coverImageURL = image;
      }
      setProgress(100);
      // Wait for progress bar to reach 100 before transitioning
      setTimeout(() => {
        onSuccess({...data, sourceType: "url"});
      }, 300);
    } catch (err) {
      console.error("Extraction error:", err);
      setError(t('common.error'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-serif text-charcoal mb-2">{t('import.url')}</h2>
        <p className="text-sm text-brown">Collez l'URL d'une recette pour l'importer automatiquement.</p>
      </div>

      <div className="flex space-x-2">
        <Input
          className="flex-1"
          placeholder="https://www.marmiton.org/recettes/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <Button onClick={handleExtract} isLoading={loading} disabled={!url.trim()}>
          Extraire la recette
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-full bg-stone/20 rounded-full h-2.5 max-w-md overflow-hidden">
            <div 
              className="bg-terracotta h-2.5 rounded-full transition-all duration-100 ease-linear" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-terracotta animate-pulse">
            {progress < 30 ? "Récupération du site..." : progress < 80 ? "L'IA analyse la recette..." : "Finalisation..."}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">
          <p className="mb-2">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleExtract}>
            {t('common.retry')}
          </Button>
        </div>
      )}
    </div>
  );
}
