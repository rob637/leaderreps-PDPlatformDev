import requests
from bs4 import BeautifulSoup
import re

sites = [
    ("Central Ohio (Columbus)", "https://centralohio.td.org/"),
    ("Greater Cleveland", "https://www.atdgreatercleveland.org/"),
    ("Greater Cincinnati", "https://gcatd.org/"),
    ("West Virginia", "https://www.atdwv.org/")
]

def get_text_snippet(soup, keywords, lines=3):
    text = soup.get_text(" ", strip=True)
    for kw in keywords:
        idx = text.lower().find(kw.lower())
        if idx != -1:
            start = max(0, idx - 50)
            end = min(len(text), idx + 150)
            return text[start:end]
    return ""

def analyze_site(name, url):
    print(f"Analyzing {name} ({url})...")
    try:
        r = requests.get(url, timeout=5)
        soup = BeautifulSoup(r.content, 'html.parser')
        
        # Try to find address in footer or contact
        address_text = get_text_snippet(soup, ["Suite", "Box", "Road", "St", "Ave", "Street", "Blvd", "OH", "Ohio", "WV", "West Virginia", "Cincinnati", "Cleveland", "Columbus"])
        print(f"  Snippet: {address_text}")
        
    except Exception as e:
        print(f"  Error: {e}")

for name, url in sites:
    analyze_site(name, url)
