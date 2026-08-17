// User
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  language: 'fr' | 'en';
  createdAt: Date;
}

// Recipe
export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string;
  section?: string;
}

export interface Instruction {
  text: string;
  section?: string;
}

export interface Recipe {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  coverImageURL: string;
  ingredients: Ingredient[];
  instructions: (string | Instruction)[];
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  tags: string[];
  visibility: 'public' | 'private';
  status: 'draft' | 'validated';
  sourceURL?: string;
  sourceType: 'manual' | 'url' | 'image';
  utensils?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Collection
export interface Collaborator {
  uid: string;
  email: string;
  role: 'viewer' | 'editor';
}

export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  coverImageURL?: string;
  recipeIds: string[];
  collaborators: Collaborator[];
  createdAt: Date;
}

// Pantry
export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  barcode?: string;
  imageUrl?: string;
  addedAt: Date;
  expiresAt?: Date;
}

// Shopping List
export interface ShoppingItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  imageUrl?: string;
  sourceRecipeId?: string;
  sourceRecipeName?: string;
  addedAt: Date;
}

// Planner
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannerEntry {
  id: string;
  userId: string;
  recipeId: string;
  recipeName: string;
  recipeCoverURL?: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  createdAt: Date;
}
