"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PREDEFINED_UTENSILS } from "@/constants/utensils";
import { Check, X as XIcon } from "lucide-react";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { Recipe, Ingredient, Instruction } from "@/types";

const PREDEFINED_TAGS = [
  "Petit-déjeuner", "Déjeuner", "Dîner", "Goûter", "Dessert", 
  "Asiatique", "Européen", "Végétarien", "Vegan", "Rapide", "Healthy",
  "Sans gluten", "Épicé", "Salade", "Boisson"
];

export interface ManualEntryFormProps {
  initialData?: Partial<Recipe>;
  isSandbox?: boolean;
  onSubmit?: (data: Partial<Recipe>) => Promise<void>;
  submitLabel?: string;
  extraActions?: React.ReactNode;
}

export function ManualEntryForm({
  initialData,
  isSandbox = false,
  onSubmit,
  submitLabel,
  extraActions,
}: ManualEntryFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || [{ name: "", quantity: null, unit: "g" }],
  );
  const [instructions, setInstructions] = useState<Instruction[]>(() => {
    if (!initialData?.instructions) return [{ text: "" }];
    return initialData.instructions.map(i => typeof i === "string" ? { text: i } : i);
  });
  const [prepTime, setPrepTime] = useState<number>(initialData?.prepTime || 0);
  const [cookTime, setCookTime] = useState<number>(initialData?.cookTime || 0);
  const [servings, setServings] = useState<number>(initialData?.servings || 2);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    initialData?.difficulty || "medium",
  );

  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [utensils, setUtensils] = useState<string[]>(
    initialData?.utensils || [],
  );
  const [showUtensilsModal, setShowUtensilsModal] = useState(false);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>(
    initialData?.coverImageURL || "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setIngredients(
        initialData.ingredients || [{ name: "", quantity: null, unit: "g" }],
      );
      const rawInstructions = initialData.instructions || [{ text: "" }];
      setInstructions(rawInstructions.map(i => typeof i === "string" ? { text: i } : (i || { text: "" })));
      setPrepTime(initialData.prepTime || 0);
      setCookTime(initialData.cookTime || 0);
      setServings(initialData.servings || 2);
      setDifficulty(initialData.difficulty || "medium");
      setTags(initialData.tags || []);
      setNotes(initialData.notes || "");
      setUtensils(initialData.utensils || []);
      if (initialData.coverImageURL) {
        setCoverImagePreview(initialData.coverImageURL);
        setCropImageSrc(initialData.coverImageURL);
      }
    }
  }, [initialData]);

  const draftIdRef = useRef<string | null>(initialData?.id || null);
  const isDirtyRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    isDirtyRef.current = true;
  }, [
    title,
    description,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    difficulty,
    tags,
    notes,
    utensils,
  ]);

  useEffect(() => {
    if (isSandbox) return;
    const interval = setInterval(async () => {
      if (!isDirtyRef.current || !user || !title.trim()) return;
      isDirtyRef.current = false;
      const recipeData: Partial<Recipe> = {
        title,
        description,
        ingredients: ingredients.filter((i) => i.name.trim() !== ""),
        instructions: instructions.filter((i) => i?.text?.trim() !== ""),
        prepTime,
        cookTime,
        servings,
        difficulty,
        tags,
        notes,
        utensils,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || "Unknown",
        sourceType: initialData?.sourceType || "manual",
        status: "draft",
        visibility: "private",
      };

      try {
        if (draftIdRef.current) {
          await updateDoc(doc(db, "recipes", draftIdRef.current), {
            ...recipeData,
            updatedAt: serverTimestamp(),
          });
        } else {
          const docRef = await addDoc(collection(db, "recipes"), {
            ...recipeData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          draftIdRef.current = docRef.id;
        }
      } catch (err) {
        console.error("Autosave error", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [
    title,
    description,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    difficulty,
    tags,
    notes,
    utensils,
    user,
    isSandbox,
    initialData,
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCropImageSrc(URL.createObjectURL(file));
      setCropperOpen(true);
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBase64: string) => {
    try {
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
      setCoverImage(file);
      setCoverImagePreview(croppedBase64);
      setCropperOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: null, unit: "g" }]);
  };

  const handleUpdateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: any,
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, { text: "" }]);
  };

  const handleUpdateInstruction = (index: number, field: "text" | "section", value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = { ...newInstructions[index], [field]: value };
    setInstructions(newInstructions);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleMoveInstruction = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newInstructions = [...instructions];
      [newInstructions[index - 1], newInstructions[index]] = [
        newInstructions[index],
        newInstructions[index - 1],
      ];
      setInstructions(newInstructions);
    } else if (direction === "down" && index < instructions.length - 1) {
      const newInstructions = [...instructions];
      [newInstructions[index + 1], newInstructions[index]] = [
        newInstructions[index],
        newInstructions[index + 1],
      ];
      setInstructions(newInstructions);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let coverImageURL = coverImagePreview;

      if (coverImage) {
        // Compress and convert to base64
        coverImageURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(coverImage);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              // Convert to base64 JPEG with 70% quality to ensure small size
              resolve(canvas.toDataURL("image/jpeg", 0.7)); 
            };
            img.onerror = (error) => reject(error);
          };
          reader.onerror = (error) => reject(error);
        });
      }

      const recipeData: Partial<Recipe> = {
        title,
        description,
        coverImageURL,
        ingredients: ingredients.filter((i) => i.name.trim() !== ""),
        instructions: instructions.filter((i) => i?.text?.trim() !== ""),
        prepTime,
        cookTime,
        servings,
        difficulty,
        tags,
        notes,
        utensils,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || "Unknown",
        sourceType: initialData?.sourceType || "manual",
        ...(!isSandbox && {
          status: "validated",
          visibility: "private",
        }),
      };

      if (onSubmit) {
        await onSubmit(recipeData);
      } else {
        if (draftIdRef.current) {
          await updateDoc(doc(db, "recipes", draftIdRef.current), {
            ...recipeData,
            updatedAt: serverTimestamp(),
          });
          router.push(`/recipes/${draftIdRef.current}`);
        } else {
          const recipesRef = collection(db, "recipes");
          const docRef = await addDoc(recipesRef, {
            ...recipeData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          router.push(`/recipes/${docRef.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="grid md:grid-cols-12 gap-8 lg:gap-16">
        {/* Left Column */}
        <div className="md:col-span-7 lg:col-span-8 space-y-8">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              {t("recipe.title")}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tarte aux pommes"
              className="text-2xl font-heading font-black py-6"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-light/30 pb-6">
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("recipe.prep_time")} (min)
              </label>
              <Input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("recipe.cook_time")} (min)
              </label>
              <Input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("recipe.servings")}
              </label>
              <Input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("recipe.difficulty")}
              </label>
              <Select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "easy" | "medium" | "hard")
                }
                options={[
                  { value: "easy", label: t("recipe.difficulty_easy") },
                  { value: "medium", label: t("recipe.difficulty_medium") },
                  { value: "hard", label: t("recipe.difficulty_hard") },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              {t("recipe.description")}
            </label>
            <textarea
              className="w-full rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta text-brown"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une délicieuse tarte..."
            />
          </div>

          {/* Utensils Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading text-charcoal font-black">
                Ustensiles
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUtensilsModal(true)}
              >
                + Ajouter un ustensile
              </Button>
            </div>
            {utensils.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {utensils.map((uId) => {
                  const u = PREDEFINED_UTENSILS.find((x) => x.id === uId);
                  if (!u) return null;
                  return (
                    <div
                      key={u.id}
                      className="border border-stone/30 bg-cream/50 rounded-xl p-3 flex flex-col items-center text-center relative"
                    >
                      <button
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                        onClick={() =>
                          setUtensils(utensils.filter((id) => id !== u.id))
                        }
                      >
                        ×
                      </button>
                      {u.image && (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="w-16 h-16 object-cover rounded mb-2 mix-blend-multiply"
                        />
                      )}
                      <span className="text-sm font-medium text-charcoal">
                        {u.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-stone text-sm">Aucun ustensile sélectionné.</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-3xl font-heading text-charcoal font-black mb-6">
              {t("recipe.instructions")}
            </h3>
            <div className="space-y-4">
              {instructions.map((inst, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  <div className="flex space-x-4 items-start">
                    <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-cream-dark text-charcoal flex items-center justify-center font-heading font-black mt-1">
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex flex-col space-y-2">
                      <Input
                        className="w-full bg-transparent border-stone-light/50 text-sm"
                        value={inst.section || ""}
                        onChange={(e) => handleUpdateInstruction(idx, "section", e.target.value)}
                        placeholder="Sous-partie (ex: Pour le glaçage) - Optionnel"
                      />
                      <textarea
                        className="w-full rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta text-charcoal"
                        rows={2}
                        value={inst.text || ""}
                        onChange={(e) =>
                          handleUpdateInstruction(idx, "text", e.target.value)
                        }
                        placeholder="Étape de préparation..."
                      />
                    </div>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveInstruction(idx, "up")}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveInstruction(idx, "down")}
                      disabled={idx === instructions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="text-red-500"
                    >
                      <XIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddInstruction}
                className="mt-4"
              >
                + Ajouter une étape
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 lg:col-span-4 space-y-8">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Image de couverture
            </label>
            <div className="bg-cream rounded-xl p-4 border border-stone/30">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-charcoal mb-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
              />
              {coverImagePreview && (
                <div className="relative mt-4 group">
                  <img
                    src={coverImagePreview}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  {cropImageSrc && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setCropperOpen(true)}
                      className="absolute bottom-2 right-2 bg-white/90 shadow-sm text-xs py-1.5 px-3 h-auto"
                    >
                      {t("import.crop_image") || "Recadrer l'image"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-[#F8F5F2] p-6 rounded-2xl">
            <h3 className="text-2xl font-heading text-charcoal font-black mb-6">
              {t("recipe.ingredients")}
            </h3>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-stone/20"
                >
                  <Input
                    className="w-full bg-cream-light/50 border-stone-light/50 text-sm mb-1"
                    value={ing.section || ""}
                    onChange={(e) => handleUpdateIngredient(idx, "section", e.target.value)}
                    placeholder="Sous-partie (ex: Pour la pâte) - Optionnel"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={ing.quantity || ""}
                      onChange={(e) =>
                        handleUpdateIngredient(
                          idx,
                          "quantity",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Qté"
                    />
                    <Select
                      className="w-24"
                      value={ing.unit || ""}
                      onChange={(e) =>
                        handleUpdateIngredient(idx, "unit", e.target.value)
                      }
                      options={[
                        { value: "g", label: "g" },
                        { value: "kg", label: "kg" },
                        { value: "mL", label: "mL" },
                        { value: "L", label: "L" },
                        { value: "pièce", label: "pièce" },
                        { value: "c.à.s", label: "c.à.s" },
                        { value: "c.à.c", label: "c.à.c" },
                        { value: "pincée", label: "pincée" },
                      ]}
                    />
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="text-red-500 px-2"
                    >
                      <XIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <Input
                    className="w-full"
                    value={ing.name}
                    onChange={(e) =>
                      handleUpdateIngredient(idx, "name", e.target.value)
                    }
                    placeholder="Nom de l'ingrédient"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddIngredient}
                className="w-full mt-2 text-terracotta border border-terracotta/30"
              >
                + Ajouter un ingrédient
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              {t("recipe.tags")}
            </label>
            <div className="flex space-x-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                placeholder="Ajouter un tag"
              />
              <Button variant="secondary" onClick={handleAddTag}>
                {t("common.add")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cream text-terracotta border border-terracotta/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-terracotta hover:text-terracotta-dark"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            {/* Predefined tag suggestions */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-stone mb-2">
                Suggestions :
              </label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.filter(tag => !tags.includes(tag)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(tag)) setTags([...tags, tag]);
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-light/10 text-stone hover:bg-terracotta/10 hover:text-terracotta transition-colors border border-transparent hover:border-terracotta/30"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Notes (Optionnel)
            </label>
            <textarea
              className="w-full rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta bg-[#F8F5F2]"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Astuces, substitutions..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-12 flex items-center justify-end space-x-4 pt-6 border-t border-stone">
        {extraActions}
        <Button
          onClick={handleSave}
          isLoading={loading}
          className="bg-terracotta text-white hover:bg-terracotta-dark"
        >
          {submitLabel || "Sauvegarder la recette"}
        </Button>
      </div>

      {/* Utensil Modal */}
      {showUtensilsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-stone/20 flex justify-between items-center">
              <h2 className="text-2xl font-heading text-charcoal font-black">
                Sélectionner des ustensiles
              </h2>
              <button
                onClick={() => setShowUtensilsModal(false)}
                className="text-stone hover:text-charcoal text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {PREDEFINED_UTENSILS.map((u) => {
                const isSelected = utensils.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (isSelected) {
                        setUtensils(utensils.filter((id) => id !== u.id));
                      } else {
                        setUtensils([...utensils, u.id]);
                      }
                    }}
                    className={`relative p-3 rounded-xl border flex flex-col items-center text-center transition-all ${isSelected ? "border-terracotta bg-cream shadow-sm ring-1 ring-terracotta" : "border-stone/30 hover:border-stone/60"}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-terracotta text-white rounded-full p-1 shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {u.image && (
                      <img
                        src={u.image}
                        alt={u.name}
                        className="w-16 h-16 object-cover rounded mb-2 mix-blend-multiply"
                      />
                    )}
                    <span
                      className={`text-sm font-medium ${isSelected ? "text-terracotta" : "text-charcoal"}`}
                    >
                      {u.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-6 border-t border-stone/20 flex justify-end">
              <Button onClick={() => setShowUtensilsModal(false)}>
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {cropperOpen && (
        <ImageCropperModal
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // Square ratio
        />
      )}
    </div>
  );
}
