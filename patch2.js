const fs = require('fs');
let code = fs.readFileSync('src/app/recipes/[id]/MobileRecipeView.tsx', 'utf8');

// Title section (on gradient)
code = code.replace(/text-white mb-3/g, 'text-black mb-3');

// Buttons
code = code.replace(/bg-\[#1C1C1E\] border border-white\/5 text-white/g, 'bg-[#F2F2F7] text-black');

// Borders
code = code.replace(/border-white\/10/g, 'border-black/5');

// Stats section
code = code.replace(/bg-white' : 'bg-white\/20/g, 'bg-black\' : \'bg-gray-300');

// Ingredients section
code = code.replace(/text-white flex items-center gap-2/g, 'text-black flex items-center gap-2');
code = code.replace(/text-white">\{currentServings/g, 'text-black">{currentServings');
code = code.replace(/text-white'\}/g, 'text-black\'}');
code = code.replace(/text-white\/90/g, 'text-black');
code = code.replace(/text-gray-300/g, 'text-gray-700');
code = code.replace(/bg-white\/10 text-white/g, 'bg-gray-100 text-black');
code = code.replace(/text-white mb-6">Instructions/g, 'text-black mb-6">Instructions');

fs.writeFileSync('src/app/recipes/[id]/MobileRecipeView.tsx', code);
