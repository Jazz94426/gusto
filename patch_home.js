const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(/bg-cream/g, 'bg-gray-50');
code = code.replace(/text-brown/g, 'text-gray-500');
code = code.replace(/text-charcoal/g, 'text-black');
code = code.replace(/text-stone-dark/g, 'text-gray-800');
code = code.replace(/text-stone/g, 'text-gray-500');

fs.writeFileSync('src/app/page.tsx', code);
