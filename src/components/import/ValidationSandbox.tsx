"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/types";
import { ManualEntryForm } from "./ManualEntryForm";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";

interface ValidationSandboxProps {
  recipeId: string;
}

export function ValidationSandbox({ recipeId }: ValidationSandboxProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, "recipes", recipeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Recipe;
          setRecipe({ ...data, id: docSnap.id });
          setIsPublic(data.visibility === "public");
        } else {
          setError(t('common.no_results'));
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, t]);

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer ce brouillon ?")) return;
    
    try {
      await deleteDoc(doc(db, "recipes", recipeId));
      router.push("/recipes/drafts");
    } catch (err) {
      console.error("Error deleting:", err);
      alert(t('common.error'));
    }
  };

  const handleValidate = async (updatedData: Partial<Recipe>) => {
    try {
      const docRef = doc(db, "recipes", recipeId);
      await updateDoc(docRef, {
        ...updatedData,
        visibility: isPublic ? "public" : "private",
        status: "validated",
        updatedAt: new Date(),
      });
      router.push("/recipes"); // Go to recipe list or detail page
    } catch (err) {
      console.error("Error validating:", err);
      alert(t('common.error'));
    }
  };

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;
  if (error || !recipe) return <div className="p-8 text-center text-red-500">{error}</div>;

  const extraActions = (
    <>
      <div className="flex items-center space-x-2 mr-4">
        <span className="text-sm text-charcoal">{t('recipe.private')}</span>
        <Toggle
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span className="text-sm text-charcoal">{t('recipe.public')}</span>
      </div>
      <Button variant="danger" onClick={handleDelete}>
        {t('common.delete')}
      </Button>
    </>
  );

  return (
    <div className="bg-cream-dark p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-serif text-charcoal mb-6">{t('import.validate_recipe')}</h2>
      
      <ManualEntryForm
        initialData={recipe}
        isSandbox={true}
        onSubmit={handleValidate}
        submitLabel={t('common.validate')}
        extraActions={extraActions}
      />
    </div>
  );
}
