import os
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

UTENSILS = [
    ("food_container", "tupperware container"),
    ("kitchen_scale", "kitchen scale digital"),
    ("measuring_jug", "glass measuring jug"),
    ("mixing_bowl", "stainless steel mixing bowl"),
    ("whisk", "kitchen wire whisk"),
    ("blender", "kitchen blender appliance"),
    ("food_processor", "food processor appliance"),
    ("saucepan", "stainless steel saucepan"),
    ("frying_pan", "frying pan nonstick"),
    ("baking_tray", "metal baking sheet pan"),
    ("spatula", "silicone spatula cooking"),
    ("wooden_spoon", "wooden spoon kitchen")
]

os.makedirs("public/utensils", exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

for uid, search_term in UTENSILS:
    try:
        if os.path.exists(f"public/utensils/{uid}.jpg"):
            print(f"Skipping {uid}, already exists")
            continue
            
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(search_term)}"
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        soup = BeautifulSoup(html, 'html.parser')
        # Bing images are usually stored in 'm' attribute as JSON
        img_url = None
        for a in soup.find_all('a', class_='iusc'):
            m_data = a.get('m')
            if m_data:
                import json
                try:
                    data = json.loads(m_data)
                    img_url = data.get('murl')
                    if img_url:
                        break
                except:
                    pass
                    
        if img_url:
            print(f"Found {uid}: {img_url}")
            req_img = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(req_img, timeout=10) as response_img:
                with open(f"public/utensils/{uid}.jpg", "wb") as f:
                    f.write(response_img.read())
            print(f"Downloaded {uid}.jpg")
        else:
            print(f"Could not find image for {uid}")
            
    except Exception as e:
        print(f"Error for {uid}: {e}")
        
    time.sleep(1)
