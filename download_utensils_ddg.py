import os
import time
from duckduckgo_search import DDGS
import urllib.request

UTENSILS = [
    ("food_container", "tupperware container kitchen photography"),
    ("kitchen_scale", "digital kitchen scale white photography"),
    ("measuring_jug", "glass measuring jug liquid kitchen photography"),
    ("mixing_bowl", "metal mixing bowl kitchen photography"),
    ("whisk", "kitchen wire whisk photography"),
    ("blender", "kitchen blender smoothie photography"),
    ("food_processor", "kitchen food processor photography"),
    ("saucepan", "stainless steel saucepan photography"),
    ("frying_pan", "black non-stick frying pan photography"),
    ("baking_tray", "metal baking sheet pan photography"),
    ("spatula", "silicone kitchen spatula photography"),
    ("wooden_spoon", "wooden spoon kitchen photography")
]

os.makedirs("public/utensils", exist_ok=True)
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
    time.sleep(1)
