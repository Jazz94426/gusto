import type { Ingredient } from "@/types";
import { GoogleGenAI } from "@google/genai";

// Initialize Google AI Studio SDK (Interactions API)
const client = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

// Use gemini-3.6-flash which is the latest standard model
const MODEL_NAME = "gemini-3.6-flash";

// ——————————————————————————————————————————
// Recipe Extraction from Text
// ——————————————————————————————————————————
export async function extractRecipeFromText(textContent: string) {
  const prompt = `Tu es un expert en extraction de recettes. Analyse le contenu textuel suivant (extrait d'une page web) et extrais la recette au format JSON.

Contenu texte:
${textContent}

Retourne un JSON avec cette structure exacte (sans aucun bloc markdown ni formatage supplémentaire, juste le JSON brut):
{
  "title": "string",
  "description": "string (courte description)",
  "ingredients": [{"name": "string", "quantity": number ou null, "unit": "string", "section": "string (optionnel, ex: 'Pour la pâte', 'Pour le glaçage')"}],
  "instructions": [
    {
      "text": "étape 1", 
      "section": "string (optionnel)",
      "ingredients": [{"name": "string", "quantity": number, "unit": "string"}] // Uniquement les ingrédients ajoutés à CETTE étape précise, avec la quantité EXACTE utilisée à ce moment-là.
    }
  ],
  "prepTime": number (en minutes, estimation si non trouvé),
  "cookTime": number (en minutes, estimation si non trouvé),
  "servings": number (estimation si non trouvée),
  "difficulty": "easy" | "medium" | "hard",
  "tags": ["tag1", "tag2"],
  "utensils": ["array of utensil ids (optionnel)"]
}

Règle CRUCIALE pour les instructions : Pour chaque étape, extrais dans le tableau \`ingredients\` uniquement les ingrédients physiquement incorporés ou manipulés lors de CETTE étape. Si une recette demande d'ajouter 120g de sucre en 3 fois, chaque étape d'incorporation devra lister "sucre" avec une quantité de 40g. Calcule les proportions nécessaires selon le texte. Si un ingrédient n'est pas utilisé dans une étape, son tableau \`ingredients\` sera vide.
SUIVI DES INGRÉDIENTS : Si un ingrédient est préparé/transformé dans une étape (ex: le poulet est découpé en dés à l'étape 1), et qu'il est ensuite manipulé dans une étape suivante (ex: "mélanger les dés de poulet" à l'étape 2), tu DOIS ajouter un tag d'ingrédient pour ce produit transformé à cette étape suivante (ex: nom: "dés de poulet", en reprenant la quantité totale correspondante).

Si des ustensiles spécifiques sont nécessaires, renvoie un tableau contenant uniquement leurs identifiants parmi cette liste stricte:
"food_container", "kitchen_scale", "measuring_jug", "mixing_bowl", "whisk", "blender", "oven", "microwave", "mold", "pan", "pastry_roll", "piping_bag".

Si tu ne trouves pas certaines informations, utilise null ou des valeurs par défaut raisonnables.
Convertis IMPÉRATIVEMENT toutes les unités impériales (comme "tasse" (cup), "once" (oz), "livre" (lb), etc.) en unités métriques (g, kg, ml, L) selon la densité de l'ingrédient.
Pour les conversions en grammes (g) ou en millilitres (ml), arrondis TOUJOURS à la dizaine la plus proche (par exemple, 312g devient 310g ou 320g, pas de valeurs précises inutiles) et évite absolument les nombres à virgule.`;

  const interaction = await client.interactions.create({
    model: MODEL_NAME,
    input: prompt,
  });

  const text = interaction.output_text || "";
  
  // Safe JSON parse in case markdown blocks are returned
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    if (match) return JSON.parse(match[1]);
    const match2 = text.match(/\`\`\`([\s\S]*?)\`\`\`/);
    if (match2) return JSON.parse(match2[1]);
    throw e;
  }
}

// ——————————————————————————————————————————
// Recipe Extraction from Multiple Images
// ——————————————————————————————————————————
export async function extractRecipeFromImages(images: {base64: string, mimeType: string}[]) {
  const prompt = `Tu es un expert en extraction de recettes à partir d'images de livres de cuisine ou de captures d'écran.
Analyse les images fournies qui constituent une seule et même recette, et extrais la recette complète au format JSON.

Retourne un JSON avec cette structure exacte:
{
  "title": "string",
  "description": "string (courte description)",
  "ingredients": [{"name": "string", "quantity": number ou null, "unit": "string", "section": "string (optionnel, ex: 'Pour la pâte', 'Pour le glaçage')"}],
  "instructions": [
    {
      "text": "étape 1", 
      "section": "string (optionnel)",
      "ingredients": [{"name": "string", "quantity": number, "unit": "string"}] // Uniquement les ingrédients ajoutés à CETTE étape précise, avec la quantité EXACTE utilisée à ce moment-là.
    }
  ],
  "prepTime": number (en minutes, estimation si non visible),
  "cookTime": number (en minutes, estimation si non visible),
  "servings": number (estimation si non visible),
  "difficulty": "easy" | "medium" | "hard",
  "tags": ["tag1", "tag2"],
  "utensils": ["array of utensil ids (optionnel)"]
}

Règle CRUCIALE pour les instructions : Pour chaque étape, extrais dans le tableau \`ingredients\` uniquement les ingrédients physiquement incorporés ou manipulés lors de CETTE étape. Si une recette demande d'ajouter 120g de sucre en 3 fois, chaque étape d'incorporation devra lister "sucre" avec une quantité de 40g. Calcule les proportions nécessaires selon le texte. Si un ingrédient n'est pas utilisé dans une étape, son tableau \`ingredients\` sera vide.
SUIVI DES INGRÉDIENTS : Si un ingrédient est préparé/transformé dans une étape (ex: le poulet est découpé en dés à l'étape 1), et qu'il est ensuite manipulé dans une étape suivante (ex: "mélanger les dés de poulet" à l'étape 2), tu DOIS ajouter un tag d'ingrédient pour ce produit transformé à cette étape suivante (ex: nom: "dés de poulet", en reprenant la quantité totale correspondante).

Si des ustensiles spécifiques sont nécessaires, renvoie un tableau contenant uniquement leurs identifiants parmi cette liste stricte:
"food_container", "kitchen_scale", "measuring_jug", "mixing_bowl", "whisk", "blender", "oven", "microwave", "mold", "pan", "pastry_roll", "piping_bag".

Ignore les zones blanches/masquées de l'image. Si du texte est partiellement visible, fais de ton mieux pour l'interpréter.
Convertis IMPÉRATIVEMENT toutes les unités impériales (comme "tasse" (cup), "once" (oz), "livre" (lb), etc.) en unités métriques (g, kg, ml, L) selon la densité de l'ingrédient.
Pour les conversions en grammes (g) ou en millilitres (ml), arrondis TOUJOURS à la dizaine la plus proche (par exemple, 312g devient 310g ou 320g, pas de valeurs précises inutiles) et évite absolument les nombres à virgule.`;

  const inputParts: any[] = [{ type: "text", text: prompt }];
  images.forEach(img => {
    inputParts.push({ type: "image", data: img.base64, mime_type: img.mimeType });
  });

  const interaction = await client.interactions.create({
    model: MODEL_NAME,
    input: inputParts,
  });

  const text = interaction.output_text || "";
  
  // Safe JSON parse in case markdown blocks are returned
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    if (match) return JSON.parse(match[1]);
    const match2 = text.match(/\`\`\`([\s\S]*?)\`\`\`/);
    if (match2) return JSON.parse(match2[1]);
    throw e;
  }
}

// ——————————————————————————————————————————
// Receipt Scanning (Grocery items extraction)
// ——————————————————————————————————————————
export async function extractItemsFromReceipt(imageBase64: string, mimeType: string) {
  const prompt = `Tu es un expert en lecture de tickets de caisse de supermarchés.
Analyse cette image de ticket de caisse et extrais tous les articles alimentaires.

Retourne un JSON avec cette structure:
{
  "items": [
    {
      "name": "string (nom de l'article nettoyé et normalisé)",
      "quantity": number (1 par défaut si non spécifié),
      "unit": "string (pièce, kg, g, L, mL, etc.)",
      "category": "string (Fruits & Légumes, Viandes, Poissons, Produits laitiers, Boulangerie, Épicerie, Boissons, Surgelés, Condiments, Autre)"
    }
  ]
}

Ignore les articles non-alimentaires (sacs, articles ménagers, etc.).
Normalise les noms: utilise des noms communs propres en français (ex: "TOMAT GRAPPE" -> "Tomates grappe").`;

  const interaction = await client.interactions.create({
    model: MODEL_NAME,
    input: [
      { type: "text", text: prompt },
      { type: "image", data: imageBase64, mime_type: mimeType }
    ],
  });

  const text = interaction.output_text || "";
  
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    if (match) return JSON.parse(match[1]);
    const match2 = text.match(/\`\`\`([\s\S]*?)\`\`\`/);
    if (match2) return JSON.parse(match2[1]);
    throw e;
  }
}

// ——————————————————————————————————————————
// Text Translation
// ——————————————————————————————————————————
export async function translateText(
  text: string,
  from: "fr" | "en",
  to: "fr" | "en"
): Promise<string> {
  if (from === to) return text;

  const fromLang = from === "fr" ? "français" : "anglais";
  const toLang = to === "fr" ? "français" : "anglais";

  const prompt = `Traduis ce texte du ${fromLang} au ${toLang}. Retourne uniquement la traduction, sans explication ni guillemets:

${text}`;

  const interaction = await client.interactions.create({
    model: MODEL_NAME,
    input: prompt,
  });

  return (interaction.output_text || "").trim();
}

// ——————————————————————————————————————————
// Smart Pantry Cross-Reference
// ——————————————————————————————————————————
export function computeMissingIngredients(
  recipeIngredients: Ingredient[],
  pantryItems: { name: string; quantity: number; unit: string }[]
): Ingredient[] {
  const missing: Ingredient[] = [];

  for (const ingredient of recipeIngredients) {
    const normalizedName = ingredient.name.toLowerCase().trim();

    // Find matching pantry item (fuzzy match on name)
    const pantryMatch = pantryItems.find((item) => {
      const pantryName = item.name.toLowerCase().trim();
      return (
        pantryName === normalizedName ||
        pantryName.includes(normalizedName) ||
        normalizedName.includes(pantryName)
      );
    });

    if (!pantryMatch) {
      // Not in pantry at all — add full amount
      missing.push(ingredient);
    } else if (
      ingredient.quantity !== null &&
      pantryMatch.unit === ingredient.unit &&
      pantryMatch.quantity < ingredient.quantity
    ) {
      // In pantry but insufficient quantity — add the difference
      missing.push({
        ...ingredient,
        quantity: ingredient.quantity - pantryMatch.quantity,
      });
    }
    // If pantry has enough or units don't match (can't compare), skip
  }

  return missing;
}
