import requests
import socket

def check_url(url):
    print(f"Checking {url}...")
    try:
        # DNS check
        try:
            socket.gethostbyname(url)
        except:
            return None

        # HTTP check
        try:
            r = requests.get(f"https://{url}", timeout=3)
            if r.status_code < 400:
                print(f"  [FOUND] https://{url}")
                return r.url
        except:
            pass
        
        try:
            r = requests.get(f"http://{url}", timeout=3)
            if r.status_code < 400:
                print(f"  [FOUND] http://{url}")
                return r.url
        except:
            pass
            
    except:
        pass
    return None

variations = {
    "Chattanooga": [
        "atdchattanooga.org", "chattanooga.td.org", "atdchatt.org", "chattanoogaatd.org",
        "atd-chattanooga.org", "chattanooga-atd.org", "tdchattanooga.org",
        "chattanoogatd.org", "atdchattanooga.wildapricot.org"
    ],
    "Greenville (Upstate SC)": [
        "atdupstate.org", "atdupstatesc.org", "upstatesc.td.org", "atdgreenville.org",
        "upstateatd.org", "atdupstatesc.wildapricot.org", "atd-upstate.org",
        "atd-upstatesc.org", "upstatescatd.org", "atdsouthcarolina.org", "atdsc.org"
    ],
    "Macon (Middle GA)": [
        "atdmiddlegeorgia.org", "middlegeorgia.td.org", "atdmacon.org", "atdmiddlega.org",
        "middlegeorgiaatd.org", "atd-middlegeorgia.org", "atd-middlega.org",
        "middlegaatd.org", "middle-ga-atd.org", "atdmiddlega.wildapricot.org"
    ],
    "Augusta (CSRA)": [
        "atdcsra.org", "csra.td.org", "atdaugusta.org", "csraatd.org",
        "atd-csra.org", "csra-atd.org", "atdcsra.wildapricot.org",
        "augustaatd.org", "atd-augusta.org"
    ]
}

for city, urls in variations.items():
    print(f"\nSearching for {city}...")
    found = False
    for url in urls:
        if check_url(url):
            found = True
            break
