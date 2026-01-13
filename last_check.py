import requests
import socket

def check_url(url):
    print(f"Checking {url}...")
    try:
        try:
            r = requests.get(f"https://{url}", timeout=2)
            if r.status_code < 400:
                print(f"  [FOUND] https://{url}")
                return r.url
        except:
            pass
    except:
        pass
    return None

urls = [
    "atdchattanooga.com", "atdchatt.com",
    "atdupstate.com", "atdupstatesc.com",
    "atdmacon.com", "atdmiddlega.com",
    "atdcsra.com", "atdaugusta.com"
]

for url in urls:
    check_url(url)
