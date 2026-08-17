import os
import urllib.request
import urllib.parse
import json
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

UTENSILS = [
    ("food_container", "Plastic_food_container", "File:Plastic_food_containers.jpg"),
    ("kitchen_scale", "Kitchen_scale", "File:Kitchen_scale.jpg"),
    ("measuring_jug", "Measuring_cup", "File:Measuring_jug.jpg"),
    ("mixing_bowl", "Mixing_bowl", "File:Stainless_steel_mixing_bowl.jpg"),
    ("whisk", "Whisk", "File:Whisk.jpg"),
    ("blender", "Blender_(device)", "File:Blender.jpg"),
    ("food_processor", "Food_processor", "File:Food_processor.jpg"),
    ("saucepan", "Saucepan", "File:Saucepan.jpg"),
    ("frying_pan", "Frying_pan", "File:Frying_pan_-_Teflon.jpg"),
    ("baking_tray", "Sheet_pan", "File:Baking_sheet.jpg"),
    ("spatula", "Spatula", "File:Spatulas.jpg"),
    ("wooden_spoon", "Wooden_spoon", "File:Wooden_spoon.jpg")
]

os.makedirs("public/utensils", exist_ok=True)

for uid, search_term, file_name in UTENSILS:
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_name)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
        
        pages = res.get("query", {}).get("pages", {})
        thumb_url = None
        for page_id in pages:
            if "imageinfo" in pages[page_id]:
                thumb_url = pages[page_id]["imageinfo"][0].get("thumburl")
                break
        
        if not thumb_url:
            print(f"Could not find exact file for {uid}, falling back to page image search...")
            # Fallback to page image
            url2 = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=400&titles={urllib.parse.quote(search_term)}"
            req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req2) as response2:
                res2 = json.loads(response2.read().decode())
            pages2 = res2.get("query", {}).get("pages", {})
            for page_id in pages2:
                if "thumbnail" in pages2[page_id]:
                    thumb_url = pages2[page_id]["thumbnail"]["source"]
                    break

        if thumb_url:
            print(f"Found URL for {uid}: {thumb_url}")
            req_img = urllib.request.Request(thumb_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_img) as response:
                img_data = response.read()
                
            with open(f"public/utensils/{uid}.jpg", "wb") as f:
                f.write(img_data)
            print(f"Downloaded {uid}.jpg")
        else:
            print(f"Could not find ANY image for {uid}")

    except Exception as e:
        print(f"Error downloading {uid}: {e}")
    time.sleep(2)  # Generous sleep to avoid 429
