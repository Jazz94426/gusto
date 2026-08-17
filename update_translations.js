const fs = require('fs');

const frUpdates = {
  "home": {
    "badge_highlight": "Découvrez des milliers",
    "badge_text": " d'options délicieuses",
    "title": "L'appli de recettes pour chaque cuisinier !",
    "subtitle": "Trouvez des recettes délicieuses, cuisinez en toute confiance et partagez vos créations. Tous vos besoins culinaires au même endroit.",
    "start_cooking": "Cuisiner",
    "create_account": "Créer un compte",
    "phone_user": "Chef Maison",
    "phone_title": "Qu'est-ce qu'on mange ?",
    "phone_search": "Rechercher",
    "cat_breakfast": "Petit-déj",
    "cat_lunch": "Déjeuner",
    "cat_dinner": "Dîner",
    "cat_snack": "Goûter",
    "cat_salad": "Salade",
    "cat_drink": "Boisson",
    "cat_dessert": "Dessert",
    "cat_more": "Plus",
    "trending": "Tendance",
    "feature1_img_badge1": "Recette importée !",
    "feature1_img_badge2": "12 ingrédients détectés",
    "feature1_title": "Importez vos recettes comme par magie",
    "feature1_desc": "Vous avez trouvé une recette en ligne ou dans un livre ? Collez l'URL ou prenez une photo. Notre IA extraira automatiquement les ingrédients, les instructions et le temps de cuisson.",
    "feature1_list1": "Fonctionne avec n'importe quel site web",
    "feature1_list2": "Scannez vos livres de cuisine",
    "feature1_list3": "Formatage automatique en étapes claires",
    "feature2_title": "Planifiez votre semaine facilement",
    "feature2_desc": "Fini le stress de ne pas savoir quoi manger. Glissez et déposez vos recettes préférées dans notre calendrier intelligent pour planifier vos repas de la semaine.",
    "feature2_cta": "Essayer le planificateur",
    "feature2_img_badge1": "Mardi",
    "feature2_img_badge2": "Pâtes Carbonara",
    "feature3_title": "Listes de courses automatiques",
    "feature3_desc": "Une fois vos repas planifiés, Gusto génère automatiquement une liste de courses intelligente, classée par rayon pour faciliter vos passages au supermarché.",
    "feature3_cta": "Découvrir le garde-manger",
    "feature3_img_badge1": "1 kg de Tomates",
    "feature3_img_badge2": "Basilic Frais"
  }
};

const enUpdates = {
  "home": {
    "badge_highlight": "Browse thousands",
    "badge_text": " of delicious options",
    "title": "The recipe app for every home chef!",
    "subtitle": "Find delicious recipes, cook with confidence, and share your creations. All your culinary needs organized in one place.",
    "start_cooking": "Start Cooking",
    "create_account": "Create an account",
    "phone_user": "Home Chef",
    "phone_title": "What's cooking today?",
    "phone_search": "Search here",
    "cat_breakfast": "Breakfast",
    "cat_lunch": "Lunch",
    "cat_dinner": "Dinner",
    "cat_snack": "Snack",
    "cat_salad": "Salad",
    "cat_drink": "Drink",
    "cat_dessert": "Dessert",
    "cat_more": "More",
    "trending": "Trending Recipe",
    "feature1_img_badge1": "Recipe Imported!",
    "feature1_img_badge2": "12 ingredients detected",
    "feature1_title": "Import recipes like magic",
    "feature1_desc": "Found a recipe you love online or in a cookbook? Just paste the URL or take a picture. Our AI will automatically extract the ingredients, instructions, and cooking time.",
    "feature1_list1": "Works with any website URL",
    "feature1_list2": "Scan printed cookbooks",
    "feature1_list3": "Auto-formats into beautiful steps",
    "feature2_title": "Plan your week perfectly",
    "feature2_desc": "Take the stress out of deciding what to eat. Drag and drop your favorite recipes onto our smart calendar to plan your meals for the whole week.",
    "feature2_cta": "Try the planner",
    "feature2_img_badge1": "Tuesday",
    "feature2_img_badge2": "Pasta Carbonara",
    "feature3_title": "Auto-generated shopping lists",
    "feature3_desc": "Once you've planned your meals, Gusto automatically generates a smart shopping list, categorizing items by aisle so you can breeze through the supermarket.",
    "feature3_cta": "Discover the pantry",
    "feature3_img_badge1": "2 lbs Tomatoes",
    "feature3_img_badge2": "Fresh Basil"
  }
};

['fr', 'en'].forEach(lang => {
  const path = `src/i18n/${lang}.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.home = lang === 'fr' ? frUpdates.home : enUpdates.home;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
});
