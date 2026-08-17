import os
import urllib.request
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

UTENSILS = [
    ("food_container", "tupperware,kitchen"),
    ("kitchen_scale", "kitchen,scale,digital"),
    ("measuring_jug", "measuring,jug,kitchen"),
    ("mixing_bowl", "mixing,bowl,kitchen"),
    ("whisk", "whisk,kitchen,baking"),
    ("blender", "blender,kitchen,appliance"),
    ("food_processor", "food,processor,kitchen"),
    ("saucepan", "saucepan,cooking,kitchen"),
    ("frying_pan", "frying,pan,skillet"),
    ("baking_tray", "baking,tray,pan"),
    ("spatula", "spatula,cooking,kitchen"),
    ("wooden_spoon", "wooden,spoon,kitchen")
]

os.makedirs("public/utensils", exist_ok=True)

for uid, tags in UTENSILS:
    # Try different locks until we get an image
    url = f"https://loremflickr.com/400/400/{tags}?lock=1"
    print(f"Downloading {uid} from {url}")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(f"public/utensils/{uid}.jpg", "wb") as f:
                f.write(response.read())
        print(f"Downloaded {uid}.jpg")
    except Exception as e:
        print(f"Error for {uid}: {e}")
    time.sleep(1)
