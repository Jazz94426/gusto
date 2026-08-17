import os
import urllib.request
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

NEW_UTENSILS = [
    ("oven", "oven,kitchen"),
    ("microwave", "microwave,kitchen"),
    ("mold", "silicone,mold,kitchen,baking"),
    ("pan", "pan,cooking,kitchen"),
    ("pastry_roll", "rolling,pin,kitchen"),
    ("piping_bag", "piping,bag,baking")
]

os.makedirs("public/utensils", exist_ok=True)

for uid, tags in NEW_UTENSILS:
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
