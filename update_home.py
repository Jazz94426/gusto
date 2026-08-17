import re

with open("src/app/page.tsx", "r") as f:
    content = f.read()

# Make Feature Section 1 transparent and add a white box to its text
# Old: <section className="py-24 bg-white relative z-10">
# New: <section className="py-24 relative z-10">
content = content.replace('<section className="py-24 bg-white relative z-10">', '<section className="py-24 relative z-10">')

# We need to change the order-1 lg:order-2 div to have bg-white
# Old: className="order-1 lg:order-2"
# New: className="order-1 lg:order-2 bg-white p-10 lg:p-12 rounded-[40px] shadow-2xl"
old_text = 'className="order-1 lg:order-2"\n          >'
new_text = 'className="order-1 lg:order-2 bg-white p-10 lg:p-12 rounded-[40px] shadow-xl border border-stone-light/20"\n          >'
content = content.replace(old_text, new_text)

# Change the image used
old_img = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'
new_img = 'https://loremflickr.com/800/800/cookbook,recipe?lock=10'
content = content.replace(old_img, new_img)

# Move the circles to overlap. Let's adjust the bottom-0 of circles.
# Old: className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none"
# New: className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none z-0"
content = content.replace('className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none"', 'className="absolute -bottom-[400px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none z-0"')

with open("src/app/page.tsx", "w") as f:
    f.write(content)

print("Updated page.tsx")
