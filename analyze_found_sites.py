import requests
from bs4 import BeautifulSoup

sites = [
    ("Atlanta", "https://atdatlanta.org"),
    ("Birmingham", "https://birminghamatd.org"),
    ("South Carolina", "http://atdsouthcarolina.org")
]

for name, url in sites:
    print(f"--- Analyzing {name} ({url}) ---")
    try:
        r = requests.get(url, timeout=5)
        soup = BeautifulSoup(r.content, 'html.parser')
        print(f"Title: {soup.title.string.strip() if soup.title else 'No Title'}")
        
        text = soup.get_text().lower()
        
        keywords = ["upstate", "greenville", "chattanooga", "augusta", "csra", "macon", "middle georgia", "spartanburg"]
        print("Keywords found:")
        for kw in keywords:
            if kw in text:
                print(f"  - {kw}")
                
        # Check for address/location hints
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            print(f"Description: {meta_desc.get('content', '').strip()}")
            
    except Exception as e:
        print(f"Error: {e}")
    print("\n")
