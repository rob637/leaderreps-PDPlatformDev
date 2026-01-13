import requests
import socket
import math

# Coordinates (Latitude, Longitude)
locations = {
    "Atlanta, GA": (33.7490, -84.3880),
    "Chattanooga, TN": (35.0456, -85.3097),
    "Birmingham, AL": (33.5186, -86.8104),
    "Greenville, SC": (34.8526, -82.3940),
    "Macon, GA": (32.8407, -83.6324),
    "Augusta, GA": (33.4735, -81.9665)
}

# Potential URL patterns to check
potential_urls = {
    "Atlanta, GA": [
        "atdatlanta.org", "greateratlanta.td.org", "atdgreateratlanta.org", "atdatlanta.wildapricot.org"
    ],
    "Chattanooga, TN": [
        "atdchattanooga.org", "chattanooga.td.org", "atdchatt.org", "atdchattanooga.wildapricot.org"
    ],
    "Birmingham, AL": [
        "atdbirmingham.org", "birmingham.td.org", "atdbham.org", "atdbirmingham.wildapricot.org"
    ],
    "Greenville, SC": [
        "atdupstatesc.org", "upstatesc.td.org", "atdgreenville.org", "atdupstatesc.wildapricot.org"
    ],
    "Macon, GA": [
        "atdmiddlegeorgia.org", "middlegeorgia.td.org", "atdmacon.org", "atdmiddlega.org", "atdmiddlegeorgia.wildapricot.org"
    ],
    "Augusta, GA": [
        "atdcsra.org", "csra.td.org", "atdaugusta.org", "atdcsra.wildapricot.org"
    ]
}

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def check_url(url):
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
                return r.url
            # Try http if https fails
            r = requests.get(f"http://{url}", timeout=5)
            if r.status_code == 200:
                return r.url
        except:
            pass
    except:
        pass
    return None

print("Analyzing Chapters within ~150 miles of Atlanta...\n")

origin_lat, origin_lon = locations["Atlanta, GA"]

for city, (lat, lon) in locations.items():
    dist = haversine_distance(origin_lat, origin_lon, lat, lon)
    print(f"--- {city} ---")
    print(f"Approx Distance: {dist:.1f} miles")
    
    found_site = False
    if city in potential_urls:
        print("Checking URLs:")
        for domain in potential_urls[city]:
            result = check_url(domain)
            if result:
                print(f"  [FOUND] {domain} -> {result}")
                found_site = True
    
    if not found_site:
        print("  No active website found in standard patterns.")
    print("")

