const fs = require('fs');
let code = fs.readFileSync('src/app/recipes/[id]/MobileRecipeView.tsx', 'utf8');

code = code.replace(/bg-\[#090909\] min-h-screen text-white/g, 'bg-white min-h-screen text-black');
code = code.replace(/to-\[#090909\]/g, 'to-white');
code = code.replace(/text-gray-200/g, 'text-gray-800');
code = code.replace(/text-gray-400/g, 'text-gray-500');
code = code.replace(/bg-black\/40/g, 'bg-black/30');
code = code.replace(/text-white mb-3/g, 'text-black mb-3'); // Title is on the white gradient now, so it should be black. 
// Wait, the title is over the gradient! 
// Let's manually replace specific lines to be safe.
fs.writeFileSync('src/app/recipes/[id]/MobileRecipeView.tsx', code);
