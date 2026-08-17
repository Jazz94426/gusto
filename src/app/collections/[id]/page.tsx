"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Collection, Recipe, Collaborator } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { compressImage } from "@/utils/imageUpload";
import { Search, ChevronDown, Check, Trash2, Link as LinkIcon, Plus, UserPlus, FileEdit, X, ArrowLeft, Upload, Utensils } from "lucide-react";

export default function CollectionDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add recipe modal
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [isAddingRecipes, setIsAddingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Collaboration panel
  const [isCollabExpanded, setIsCollabExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetchCollectionAndRecipes();
    }
  }, [user, id]);

  const fetchCollectionAndRecipes = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "collections", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const collData = { id: docSnap.id, ...docSnap.data() } as Collection;
        setCollectionData(collData);
        setEditName(collData.name);
        setEditDescription(collData.description || "");
        setCoverImagePreview(collData.coverImageURL || "");
        setCoverImage(null);

        if (collData.recipeIds && collData.recipeIds.length > 0) {
          // Fetch recipes whose IDs are in the collection
          // Note: Firestore 'in' query supports max 10 values. For safety, we chunk them if needed,
          // but for simplicity here we'll assume < 10 or fetch all and filter.
          
          // Workaround for > 10 items: fetch them individually or use chunks
          const recipePromises = collData.recipeIds.map(recipeId => 
            getDoc(doc(db, "recipes", recipeId))
          );
          
          const recipeSnaps = await Promise.all(recipePromises);
          const fetchedRecipes = recipeSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as Recipe));
          
          setRecipes(fetchedRecipes);
        } else {
          setRecipes([]);
        }
      } else {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!collectionData) return;
    setIsSaving(true);
    try {
      let finalCoverImageURL = collectionData.coverImageURL || "";
      if (coverImage) {
        finalCoverImageURL = await compressImage(coverImage);
      } else if (!coverImagePreview) {
        finalCoverImageURL = "";
      }

      const docRef = doc(db, "collections", id);
      await updateDoc(docRef, {
        name: editName,
        description: editDescription,
        coverImageURL: finalCoverImageURL
      });
      setCollectionData({ ...collectionData, name: editName, description: editDescription, coverImageURL: finalCoverImageURL });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating collection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!confirm(t("messages.confirm_delete_collection") || "Voulez-vous vraiment supprimer cette collection ?")) return;
    try {
      await deleteDoc(doc(db, "collections", id));
      router.push("/collections");
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    if (!collectionData) return;
    try {
      const docRef = doc(db, "collections", id);
      await updateDoc(docRef, {
        recipeIds: arrayRemove(recipeId)
      });
      setCollectionData({
        ...collectionData,
        recipeIds: collectionData.recipeIds.filter(rId => rId !== recipeId)
      });
      setRecipes(recipes.filter(r => r.id !== recipeId));
    } catch (error) {
      console.error("Error removing recipe:", error);
    }
  };

  const fetchUserRecipes = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "recipes"),
        where("ownerId", "==", user.uid),
        where("status", "==", "validated")
      );
      const snap = await getDocs(q);
      const userRecs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setUserRecipes(userRecs);
    } catch (error) {
      console.error("Error fetching user recipes:", error);
    }
  };

  const openAddRecipeModal = () => {
    fetchUserRecipes();
    setSelectedRecipeIds(new Set());
    setRecipeSearch("");
    setSelectedTag("");
    setIsAddRecipeModalOpen(true);
  };

  const toggleRecipeSelection = (recipeId: string) => {
    const newSet = new Set(selectedRecipeIds);
    if (newSet.has(recipeId)) {
      newSet.delete(recipeId);
    } else {
      newSet.add(recipeId);
    }
    setSelectedRecipeIds(newSet);
  };

  const handleAddSelectedRecipes = async () => {
    if (!collectionData || selectedRecipeIds.size === 0) return;
    setIsAddingRecipes(true);
    try {
      const docRef = doc(db, "collections", id);
      const idsToAdd = Array.from(selectedRecipeIds);
      
      // Update Firestore
      // Cannot use arrayUnion with multiple separate values easily unless spreading in some versions,
      // let's just update the whole array or use multiple arrayUnions
      const newRecipeIds = Array.from(new Set([...collectionData.recipeIds, ...idsToAdd]));
      await updateDoc(docRef, { recipeIds: newRecipeIds });
      
      setIsAddRecipeModalOpen(false);
      fetchCollectionAndRecipes(); // Refresh
    } catch (error) {
      console.error("Error adding recipes:", error);
    } finally {
      setIsAddingRecipes(false);
    }
  };

  const handleInvite = async () => {
    if (!collectionData || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      // In a real app, you would lookup the user by email to get their UID.
      // For this demo, we'll create a mock UID or assume it's just stored by email.
      // We will assume `collaborators` can just store what we need.
      const mockUid = "user_" + Math.random().toString(36).substring(2, 9);
      
      const newCollaborator: Collaborator = {
        uid: mockUid,
        email: inviteEmail.trim(),
        role: inviteRole
      };

      const docRef = doc(db, "collections", id);
      await updateDoc(docRef, {
        collaborators: arrayUnion(newCollaborator),
        collaboratorIds: arrayUnion(mockUid) // if using this pattern
      });

      setCollectionData({
        ...collectionData,
        collaborators: [...collectionData.collaborators, newCollaborator]
      });
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting:", error);
      alert(t("messages.error_inviting") || "Erreur lors de l'envoi des invitations");
    } finally {
      setIsInviting(false);
      alert(t("messages.invitations_sent") || "Invitations envoyées");
    }
  };

  const handleRemoveCollaborator = async (collaborator: Collaborator) => {
    if (!collectionData) return;
    try {
      const docRef = doc(db, "collections", id);
      await updateDoc(docRef, {
        collaborators: arrayRemove(collaborator),
        collaboratorIds: arrayRemove(collaborator.uid)
      });
      setCollectionData({
        ...collectionData,
        collaborators: collectionData.collaborators.filter(c => c.uid !== collaborator.uid)
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  }

  if (!collectionData || !user) return null;

  const isOwner = collectionData.ownerId === user.uid;

  return (
    <div className="page-container py-8 pb-24 space-y-8">
      <div className="mb-2">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-stone hover:text-terracotta transition-colors font-medium text-sm group"
        >
          <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-full md:w-48 h-48 bg-gradient-to-br from-terracotta/20 to-burnt-orange/20 rounded-2xl flex-shrink-0 overflow-hidden relative shadow-sm">
          {collectionData.coverImageURL && (
            <img src={collectionData.coverImageURL} alt={collectionData.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:justify-between items-start mb-4 gap-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-heading font-black text-charcoal mb-4 tracking-tight">{collectionData.name}</h1>
              <p className="text-stone-500 text-lg mb-4 max-w-2xl">{collectionData.description}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={() => setIsCollabExpanded(!isCollabExpanded)}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {t("collections.share_collection")}
              </Button>
              {isOwner && (
                <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                  {t("common.edit")}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-stone-500 font-semibold bg-cream-dark px-4 py-2 rounded-full w-fit">
            <span>{recipes.length} recettes</span>
            <span>•</span>
            <span>Créée le {(collectionData.createdAt as any)?.toDate ? (collectionData.createdAt as any).toDate().toLocaleDateString() : (collectionData.createdAt as any)?.toLocaleDateString ? (collectionData.createdAt as any).toLocaleDateString() : 'Récemment'}</span>
          </div>
        </div>
      </div>

      {/* Collaboration Panel */}
      {isCollabExpanded && (
        <Card className="border-t-4 border-t-sage">
          <h3 className="text-lg font-heading mb-4">Collaborateurs</h3>
          <div className="space-y-4">
            {collectionData.collaborators?.map(collab => (
              <div key={collab.uid} className="flex items-center justify-between bg-cream p-3 rounded-xl border border-stone/20">
                <div className="flex items-center space-x-3">
                  <Avatar initials={collab.email.charAt(0).toUpperCase()} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">{collab.email}</p>
                    <p className="text-xs text-brown capitalize">{collab.role}</p>
                  </div>
                </div>
                {isOwner && (
                  <button onClick={() => handleRemoveCollaborator(collab)} className="text-stone hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}

            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-stone/20 sm:items-center">
                <div className="flex-grow">
                  <Input
                    placeholder={`${t("common.search")}...`}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-[44px]"
                  />
                </div>
                <div className="sm:w-40 flex-shrink-0">
                  <Select
                    options={[
                      { label: "Lecteur", value: "viewer" },
                      { label: "Éditeur", value: "editor" }
                    ]}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "viewer" | "editor")}
                    className="h-[44px]"
                  />
                </div>
                <Button className="whitespace-nowrap h-[44px]" onClick={handleInvite} isLoading={isInviting} disabled={!inviteEmail}>
                  {t("common.invite")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recipes Section */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-heading font-black text-charcoal tracking-tight">Recettes</h2>
          <Button onClick={openAddRecipeModal} variant="ghost" className="text-terracotta font-bold hover:bg-terracotta/10">
            {t("collections.add_recipes")}
          </Button>
        </div>

        {recipes.length === 0 ? (
          <EmptyState
            title="Aucune recette"
            description="Ajoutez des recettes à cette collection pour les retrouver facilement."
            action={<Button onClick={openAddRecipeModal}>Ajouter des recettes</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recipes.map(recipe => (
              <div key={recipe.id} className="relative group h-full">
                <div 
                  className="absolute top-2 right-2 z-10 p-1.5 bg-cream rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm text-stone hover:text-red-500"
                  onClick={(e) => { e.stopPropagation(); handleRemoveRecipe(recipe.id); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div 
                  className="flex flex-col h-full cursor-pointer bg-white rounded-[24px] overflow-hidden hover:scale-105 transition-transform duration-300 shadow-sm border border-stone-light/30"
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                >
                  <div className="h-48 w-full bg-stone/20 relative">
                    {recipe.coverImageURL && (
                      <img src={recipe.coverImageURL} alt={recipe.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-heading font-black text-xl mb-2 text-charcoal line-clamp-1">{recipe.title}</h3>
                    <p className="text-sm text-stone-500 mb-4 line-clamp-2 flex-grow">{recipe.description}</p>
                    <div className="mt-auto flex items-center space-x-2">
                      <Badge variant="outline" size="sm" className="bg-cream-dark border-none text-stone-600">{recipe.prepTime + recipe.cookTime} min</Badge>
                      <Badge variant="outline" size="sm" className="bg-cream-dark border-none text-stone-600">{t(`recipe.difficulty_${recipe.difficulty}`)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier la collection">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Image de couverture</label>
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
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label={t("recipe.description")}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            multiline
            rows={3}
          />
          <div className="flex justify-between pt-4">
            <Button variant="danger" onClick={handleDeleteCollection}>
              {t("common.delete")}
            </Button>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleUpdateCollection} isLoading={isSaving}>{t("common.save")}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Recipe Modal */}
      <Modal 
        isOpen={isAddRecipeModalOpen} 
        onClose={() => setIsAddRecipeModalOpen(false)} 
        title={t("collections.add_recipes")}
        className="sm:max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <div className="w-full flex-grow relative">
              <input 
                type="text"
                placeholder={`${t("common.search")}...`}
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full pl-14 pr-4 py-4 bg-white border border-stone-light/30 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all text-charcoal font-medium placeholder:text-stone-500 text-lg"
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500">
                <Search className="w-6 h-6" />
              </div>
            </div>

            {Array.from(new Set(userRecipes.flatMap(r => r.tags || []))).length > 0 && (
              <div className="flex bg-white rounded-[24px] shadow-sm border border-stone-light/30 overflow-hidden relative sm:flex-shrink-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                   <Utensils className="w-5 h-5" />
                </div>
                <select 
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="appearance-none bg-transparent py-4 pl-11 pr-10 text-lg font-medium text-charcoal focus:outline-none cursor-pointer"
                >
                  <option value="">{t("collections.all_recipes")}</option>
                  {Array.from(new Set(userRecipes.flatMap(r => r.tags || []))).map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                   <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
          
          {userRecipes.length === 0 ? (
            <p className="text-stone-500 py-8 text-center bg-stone/5 rounded-2xl border border-dashed border-stone/20">Vous n'avez aucune recette validée à ajouter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {userRecipes
                .filter(r => {
                  const matchesSearch = r.title.toLowerCase().includes(recipeSearch.toLowerCase());
                  const matchesTag = selectedTag ? r.tags?.includes(selectedTag) : true;
                  return matchesSearch && matchesTag;
                })
                .map(recipe => (
                <div 
                  key={recipe.id} 
                  className={`flex items-center p-3 rounded-[16px] border cursor-pointer transition-all ${selectedRecipeIds.has(recipe.id) ? 'border-terracotta bg-terracotta/5 shadow-sm scale-[0.98]' : 'border-stone-light/30 bg-white hover:border-terracotta/50 shadow-sm'}`}
                  onClick={() => toggleRecipeSelection(recipe.id)}
                >
                  <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${selectedRecipeIds.has(recipe.id) ? 'bg-terracotta border-terracotta text-white' : 'border-stone-300'}`}>
                    {selectedRecipeIds.has(recipe.id) && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  {recipe.coverImageURL && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-stone/10">
                      <img src={recipe.coverImageURL} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-charcoal truncate">{recipe.title}</p>
                    <p className="text-xs text-stone-500 truncate">{recipe.prepTime + recipe.cookTime} min • {recipe.difficulty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t border-stone/20">
            <Button variant="ghost" onClick={() => setIsAddRecipeModalOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleAddSelectedRecipes} isLoading={isAddingRecipes} disabled={selectedRecipeIds.size === 0}>
              {t("collections.add_recipes")} {selectedRecipeIds.size > 0 ? `(${selectedRecipeIds.size})` : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
