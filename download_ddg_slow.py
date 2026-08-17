import os
import time
from duckduckgo_search import DDGS
import urllib.request

UTENSILS = [
    ("blender", "kitchen blender appliance clear photography"),
    ("food_processor", "kitchen food processor appliance photography"),
    ("saucepan", "stainless steel saucepan pot photography"),
    ("frying_pan", "black non stick frying pan photography"),
    ("baking_tray", "metal baking sheet pan photography"),
    ("spatula", "silicone kitchen spatula photography"),
    ("wooden_spoon", "wooden spoon kitchen photography")
]

ddgs = DDGS()

for uid, search_term in UTENSILS:
    try:
        results = list(ddgs.images(search_term, max_results=1))
        if results:
            img_url = results[0]["image"]
            print(f"Downloading {uid} from {img_url}")
            
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
            with urllib.request.urlopen(req, timeout=10) as response:
                img_data = response.read()
                
            with open(f"public/utensils/{uid}.jpg", "wb") as f:
                f.write(img_data)
        else:
            print(f"No results for {uid}")
    except Exception as e:
        print(f"Error for {uid}: {e}")
    
    print("Waiting 15 seconds to avoid ratelimit...")
    time.sleep(15)
