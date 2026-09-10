const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ing1 = "Bœuf haché";
const text1 = "faire cuire le bœuf haché avec le sel";
const regex1 = new RegExp('(^|[^\\p{L}])' + escapeRegExp(ing1) + '([^\\p{L}]|$)', 'iu');
console.log("1:", regex1.test(text1));

const ing2 = "Sel et poivre noir";
const text2 = "le sel, le poivre";
// Just to test if we can do better matching
const normalize = (str) => str.toLowerCase().replace(/[^\p{L}0-9]/gu, ' ').split(' ').filter(w => w.length > 2 && !['les', 'des', 'une'].includes(w));
console.log("2:", normalize(ing2), normalize(text2));

