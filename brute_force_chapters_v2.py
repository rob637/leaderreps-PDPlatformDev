import requests
import socket

def check_url(url):
    print(f"Checking {url}...")
    try:
        # verifying DNS first
        try:
            socket.gethostbyname(url)
        except:
            return None

        # Verify HTTP
        full_url = f"https://{url}"
        try:
            r = requests.get(full_url, timeout=5)
            if r.status_code == 200:
                print(f"  [FOUND] {full_url}")
                return r.url
            # Try with www
            r = requests.get(f"https://www.{url}", timeout=5)
            if r.status_code == 200:
                 print(f"  [FOUND] https://www.{url}")
                 return r.url

        except:
             pass
        
        # Try http if https fails
        try:
            r = requests.get(f"http://{url}", timeout=5)
            if r.status_code == 200:
                print(f"  [FOUND] http://{url}")
                return r.url
        except:
            pass
    except Exception as e:
        print(f"Error checking {url}: {e}")
    return None

chapters = {
    "Atlanta": ["atdatlanta.org", "greateratlanta.td.org"],
    "Chattanooga": [
        "atdchattanooga.org", "chattanooga.td.org", "atdchatt.org", 
        "chattanoogaatd.org", "atdchattanooga.wildapricot.org"
    ],
    "Birmingham": [
        "atdbirmingham.org", "birmingham.td.org", "atdbham.org", 
        "birminghamatd.org", "atdbham.wildapricot.org", "atdbirmingham.wildapricot.org"
    ],
    "Greenville (Upstate SC)": [
        "atdupstate.org", "atdupstatesc.org", "upstatesc.td.org", 
        "atdgreenville.org", "upstateatd.org", "atdupstatesc.wildapricot.org"
    ],
    "Macon (Middle GA)": [
        "atdmiddlegeorgia.org", "middlegeorgia.td.org", "atdmacon.org", 
        "atdmiddlega.org", "middlegeorgiaatd.org", "atdmiddlegeorgia.wildapricot.org"
    ],
    "Augusta (CSRA)": [
        "atdcsra.org", "csra.td.org", "atdaugusta.org", 
        "csraatd.org", "atdcsra.wildapricot.org"
    ]
}

results = {}

for city, urls in chapters.items():
    print(f"\n--- Searching for {city} ---")
    found = False
    for url in urls:
        final_url = check_url(url)
        if final_url:
            results[city] = final_url
            found = True
            break
    if not found:
        results[city] = "Not found (likely inactive or different URL)"

print("\n\n=== RESULTS ===")
for city, url in results.items():
    print(f"{city}: {url}")
