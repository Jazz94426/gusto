const fs = require('fs');
let code = fs.readFileSync('src/components/recipes/RecipeCard.tsx', 'utf8');

code = code.replace(/aspect-\[4\/3\]/g, 'aspect-[4/5]');
code = code.replace(/rounded-\[24px\] group/g, 'rounded-[32px] group');
code = code.replace(/bg-white shadow-sm overflow-hidden rounded-\[24px\]/g, 'bg-white shadow-xl shadow-black/5 overflow-hidden rounded-[32px] border-none');
code = code.replace(/border border-stone-light\/30 /g, '');
code = code.replace(/text-stone-light\/30 fill-stone-light\/10/g, 'text-gray-300 fill-gray-300');
code = code.replace(/text-terracotta fill-terracotta/g, 'text-black fill-black');
code = code.replace(/bg-cream/g, 'bg-gray-100');
code = code.replace(/text-charcoal\/70/g, 'text-black');

fs.writeFileSync('src/components/recipes/RecipeCard.tsx', code);
