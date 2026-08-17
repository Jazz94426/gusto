import urllib.request
import urllib.parse
import json
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

UTENSILS = [
    ("food_container", "Plastic_food_containers.jpg"),
    ("kitchen_scale", "Kitchen_scale.jpg"),
    ("measuring_jug", "Measuring_jug.jpg"),
    ("mixing_bowl", "Stainless_steel_mixing_bowl.jpg"),
    ("whisk", "Whisk.jpg"),
    ("blender", "Blender.jpg"),
    ("food_processor", "Food_processor.jpg"),
    ("saucepan", "Saucepan.jpg"),
    ("frying_pan", "Frying_pan_-_Teflon.jpg"),
    ("baking_tray", "Baking_sheet.jpg"),
    ("spatula", "Spatulas.jpg"),
    ("wooden_spoon", "Wooden_spoon.jpg")
]

results = []

for uid, file_name in UTENSILS:
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(file_name)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
        
        pages = res.get("query", {}).get("pages", {})
        thumb_url = None
        for page_id in pages:
            if "imageinfo" in pages[page_id]:
                thumb_url = pages[page_id]["imageinfo"][0].get("thumburl")
                break
        
        if thumb_url:
            print(f"'{uid}': '{thumb_url}',")
        else:
            print(f"'{uid}': None,")
    except Exception as e:
        print(f"'{uid}': 'ERROR {e}',")
    time.sleep(2)
