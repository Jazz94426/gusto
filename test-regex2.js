const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function matchIngredient(ingName, text) {
  const exactRegex = new RegExp('(^|[^\\p{L}])' + escapeRegExp(ingName) + '([^\\p{L}]|$)', 'iu');
  if (exactRegex.test(text)) return true;
  
  const stopWords = ['et', 'ou', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'en', 'au', 'aux', 'pour', 'avec', 'noir', 'blanc'];
  const words = ingName.toLowerCase().replace(/[^\p{L}0-9]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
  
  if (words.length >= 1) {
    let matchCount = 0;
    for (const w of words) {
      const wRegex = new RegExp('(^|[^\\p{L}])' + escapeRegExp(w) + '([^\\p{L}]|$)', 'iu');
      if (wRegex.test(text)) matchCount++;
    }
    
    // For single word like "chili" from "Poudre de chili"
    if (words.length === 1 && matchCount === 1) return true;
    // For multiple words, require at least the majority
    if (words.length > 1 && matchCount >= Math.ceil(words.length / 2)) return true;
  }
  
  return false;
}

const text = "Dans une grande poêle, faire cuire le bœuf haché avec le sel, le poivre, l'ail en poudre, le chili et le cumin jusqu'à ce qu'il soit bien doré.";

console.log("Bœuf haché:", matchIngredient("Bœuf haché", text));
console.log("Sel et poivre noir:", matchIngredient("Sel et poivre noir", text));
console.log("Ail en poudre:", matchIngredient("Ail en poudre", text));
console.log("Poudre de chili:", matchIngredient("Poudre de chili", text));
console.log("Cumin:", matchIngredient("Cumin", text));
console.log("Tomates:", matchIngredient("Tomates", text)); // Should be false
