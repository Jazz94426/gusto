"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { Recipe } from "@/types";
import Link from "next/link";

export default function DraftsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [drafts, setDrafts] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "recipes"), 
          where("ownerId", "==", user.uid),
          where("status", "==", "draft")
        );
        const querySnapshot = await getDocs(q);
        const fetchedDrafts: Recipe[] = [];
        querySnapshot.forEach((doc) => {
          fetchedDrafts.push({ id: doc.id, ...doc.data() } as Recipe);
        });

        // Sort drafts newest first
        fetchedDrafts.sort((a, b) => {
           const dateA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds : 0;
           const dateB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds : 0;
           return dateB - dateA;
        });

        setDrafts(fetchedDrafts);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const handleDelete = async () => {
    if (!draftToDelete) return;
    try {
      await deleteDoc(doc(db, "recipes", draftToDelete));
      setDrafts(drafts.filter(d => d.id !== draftToDelete));
      setDraftToDelete(null);
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 max-w-4xl">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-stone hover:text-charcoal mb-4 inline-block">
          &larr; Retour à mes recettes
        </Link>
        <h1 className="text-3xl font-heading text-charcoal">Tous mes brouillons</h1>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 bg-cream-dark rounded-2xl">
          <p className="text-brown mb-4">Aucun brouillon. Importez une recette pour commencer !</p>
          <Button onClick={() => router.push("/import")}>{t("common.import")}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map(draft => (
            <Card key={draft.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-stone/20">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-heading text-lg">{draft.title || "Recette sans titre"}</h3>
                  <span className="text-xs bg-stone/10 text-stone px-2 py-1 rounded-full uppercase tracking-wider">
                    {draft.sourceType}
                  </span>
                </div>
                <p className="text-sm text-brown">
                  Créé le {(draft.createdAt as any)?.seconds ? new Date((draft.createdAt as any).seconds * 1000).toLocaleDateString() : 'Date inconnue'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => router.push(`/import?edit=${draft.id}`)}>
                  {t("common.edit")}
                </Button>
                <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDraftToDelete(draft.id)}>
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!draftToDelete}
        onClose={() => setDraftToDelete(null)}
        title="Supprimer le brouillon"
      >
        <p className="mb-6 text-brown">Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDraftToDelete(null)}>{t("common.cancel")}</Button>
          <Button variant="danger" onClick={handleDelete}>{t("common.delete")}</Button>
        </div>
      </Modal>
    </div>
  );
}
