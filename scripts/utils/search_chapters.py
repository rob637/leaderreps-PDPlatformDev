import requests
from bs4 import BeautifulSoup
import subprocess
import re
import time
import urllib.parse

def search_bing(query):
    print(f"Searching Bing for: {query}")
    safe_query = urllib.parse.quote(query)
    cmd = [
        "curl", "-s", "-L",
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        f"https://www.bing.com/search?q={safe_query}"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        html = result.stdout
        
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        # organic results usually in 'h2' -> 'a' or 'li.b_algo' -> 'h2' -> 'a'
        for item in soup.select('li.b_algo h2 a'):
            href = item.get('href')
            text = item.get_text()
            if href and 'http' in href:
                links.append((href, text))
                
        return links
    except Exception as e:
        print(f"Error searching bing: {e}")
        return []

targets = [
    "ATD Northwest Ohio chapter website",
    "ATD Toledo chapter website",
    "ATD Akron Canton chapter website",
    "ATD Northeast Indiana chapter website", 
    "ATD Fort Wayne chapter website",
    "ATD Greater Cincinnati chapter website",
    "ATD Dayton chapter website"
]

found_urls = {}

for target in targets:
    results = search_bing(target)
    print(f"\nResults for '{target}':")
    for href, text in results[:5]:  # Top 5
        print(f"  - {text}: {href}")
        
        # Simple heuristic to identify good candidates
        lower_href = href.lower()
        if "td.org" in lower_href or "atd" in lower_href or "wildapricot" in lower_href:
            if "linkedin" not in lower_href and "facebook" not in lower_href and "events" not in lower_href:
                 print(f"    -> POTENTIAL MATCH: {href}")
    
    time.sleep(1) # Be polite
