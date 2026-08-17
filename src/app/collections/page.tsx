"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Library, Upload, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Collection } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { compressImage } from "@/utils/imageUpload";
import { CollectionCardSkeleton } from '@/components/ui/skeletons/CollectionCardSkeleton';

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const collectionsRef = collection(db, "collections");
      
      const ownerQuery = query(collectionsRef, where("ownerId", "==", user.uid));
      // Using collaboratorIds for the array-contains query pattern
      const collabQuery = query(collectionsRef, where("collaboratorIds", "array-contains", user.uid));

      const [ownerSnap, collabSnap] = await Promise.all([
        getDocs(ownerQuery),
        getDocs(collabQuery),
      ]);

      const merged = new Map<string, Collection>();
      
      ownerSnap.docs.forEach(doc => {
        merged.set(doc.id, { id: doc.id, ...doc.data() } as Collection);
      });
      
      collabSnap.docs.forEach(doc => {
        merged.set(doc.id, { id: doc.id, ...doc.data() } as Collection);
      });

      setCollections(Array.from(merged.values()));
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollectionName.trim()) return;
    setIsCreating(true);
    try {
      let finalCoverImageURL = "";
      if (coverImage) {
        finalCoverImageURL = await compressImage(coverImage);
      }

      await addDoc(collection(db, "collections"), {
        ownerId: user.uid,
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        coverImageURL: finalCoverImageURL,
        recipeIds: [],
        collaborators: [],
        collaboratorIds: [],
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setCoverImage(null);
      setCoverImagePreview("");
      fetchCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!authLoading && !loading && !user) return null;

  return (
    <div className="page-container py-8 pb-24">
      <div className="flex flex-wrap justify-between items-center mb-12 gap-4">
        <h1 className="font-heading text-5xl md:text-6xl font-black text-charcoal tracking-tight">
          {t("nav.collections")}
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("collections.new_collection")}
        </Button>
      </div>

      {(authLoading || (loading && collections.length === 0)) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-full">
              <CollectionCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>

      {collections.length === 0 && !loading ? (
        <div className="text-center py-20 bg-white rounded-[32px] border border-stone-light/30 shadow-sm flex flex-col items-center">
          <div className="mb-4 bg-terracotta/10 p-4 rounded-full">
            <Library className="w-12 h-12 text-terracotta" />
          </div>
          <h3 className="text-xl font-medium text-charcoal mb-4">{t("empty_states.no_collections")}</h3>
          <Button onClick={() => setIsModalOpen(true)}>
            {t("collections.new_collection")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((coll) => (
            <Card
              key={coll.id}
              variant="interactive"
              onClick={() => router.push(`/collections/${coll.id}`)}
              className="h-full flex flex-col rounded-[24px] overflow-hidden hover:scale-105 transition-transform duration-300 shadow-sm border border-stone-light/30"
              imageHeader={
                <div className="h-48 w-full bg-gradient-to-br from-terracotta/20 to-burnt-orange/20 relative">
                  {coll.coverImageURL && (
                    <img
                      src={coll.coverImageURL}
                      alt={coll.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              }
            >
              <div className="flex justify-between items-start mb-3 mt-4">
                <h3 className="text-xl font-heading font-black text-charcoal line-clamp-1">{coll.name}</h3>
                <Badge variant="primary" size="sm" className="bg-cream-dark text-stone-600 border-none">
                  {coll.recipeIds?.length || 0} recettes
                </Badge>
              </div>
              <p className="text-stone-500 text-sm line-clamp-2 flex-grow mb-4">
                {coll.description}
              </p>
              
              {coll.collaborators && coll.collaborators.length > 0 && (
                <div className="flex -space-x-2 overflow-hidden mt-auto">
                  {coll.collaborators.map((collaborator, index) => (
                    <Avatar
                      key={collaborator.uid}
                      initials={collaborator.email.charAt(0).toUpperCase()}
                      size="sm"
                      className="ring-2 ring-cream-dark z-10"
                      style={{ zIndex: 10 - index }}
                    />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("collections.new_collection")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">{t("collections.cover_image")}</label>
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24 bg-stone/10 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-dashed border-stone/30">
                {coverImagePreview ? (
                  <>
                    <img
                      src={coverImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setCoverImagePreview("");
                        setCoverImage(null);
                      }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Upload className="w-6 h-6 text-stone/50" />
                )}
              </div>
              <div className="flex-grow">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCoverImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-stone file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
                />
              </div>
            </div>
          </div>
          <Input
            label={t("recipe.title")}
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder={t("collections.collection_name")}
          />
          <Input
            label={t("recipe.description")}
            value={newCollectionDescription}
            onChange={(e) => setNewCollectionDescription(e.target.value)}
            multiline
            rows={3}
            placeholder={t("collections.optional_description")}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateCollection}
              isLoading={isCreating}
              disabled={!newCollectionName.trim()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
      </>
      )}
    </div>
  );
}
