"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ManualEntryForm } from "@/components/import/ManualEntryForm";
import { URLImportForm } from "@/components/import/URLImportForm";
import { ImageMaskingTool } from "@/components/import/ImageMaskingTool";
import { ValidationSandbox } from "@/components/import/ValidationSandbox";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";

function ImportContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"manual" | "url" | "image">("manual");
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8 text-center">{t('common.loading')}</div>;

  if (editId) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <ValidationSandbox recipeId={editId} />
      </div>
    );
  }

  const handleExtractionSuccess = async (data: any) => {
    if (!user) return;
    
    if (activeTab === "image" || activeTab === "url") {
      setExtractedData(data);
      setActiveTab("manual");
      return;
    }

    // Manual tab submission saving
    try {
      const recipesRef = collection(db, "recipes");
      const docRef = await addDoc(recipesRef, {
        ...data,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || "Unknown",
        sourceType: data.sourceType || "manual",
        status: "validated",
        visibility: "private",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/recipes/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-serif text-charcoal mb-6">{t('common.import')}</h1>
      
      <div className="flex space-x-2 mb-6 border-b border-stone pb-2">
        <Button
          variant={activeTab === "manual" ? "primary" : "ghost"}
          onClick={() => setActiveTab("manual")}
        >
          {t('import.manual')}
        </Button>
        <Button
          variant={activeTab === "url" ? "primary" : "ghost"}
          onClick={() => setActiveTab("url")}
        >
          {t('import.url')}
        </Button>
        <Button
          variant={activeTab === "image" ? "primary" : "ghost"}
          onClick={() => setActiveTab("image")}
        >
          {t('import.image')}
        </Button>
      </div>

      <div className="bg-cream-dark p-6 rounded-2xl shadow-sm">
        {activeTab === "manual" && <ManualEntryForm initialData={extractedData} />}
        {activeTab === "url" && <URLImportForm onSuccess={handleExtractionSuccess} />}
        {activeTab === "image" && <ImageMaskingTool onSuccess={handleExtractionSuccess} />}
      </div>
    </div>
  );
}

function TranslatedLoading() {
  const { t } = useTranslation();
  return <div className="p-8 text-center">{t('common.loading')}</div>;
}

export default function ImportPage() {
  return (
    <Suspense fallback={<TranslatedLoading />}>
      <ImportContent />
    </Suspense>
  );
}
