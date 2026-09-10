const fs = require('fs');
let code = fs.readFileSync('src/app/recipes/page.tsx', 'utf8');

code = code.replace(/bg-cream-dark/g, 'bg-gray-50');
code = code.replace(/border-stone-light\/30/g, 'border-black/5');
code = code.replace(/text-stone-500/g, 'text-gray-500');
code = code.replace(/text-charcoal/g, 'text-black');
code = code.replace(/bg-white/g, 'bg-white');

fs.writeFileSync('src/app/recipes/page.tsx', code);
