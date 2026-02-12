import requests
import socket

def check_domain(domain):
    try:
        # verifying DNS first is faster
        socket.gethostbyname(domain)
        # if dns resolves, try http
        try:
            r = requests.get(f"https://{domain}", timeout=3)
            if r.status_code == 200:
                print(f"FOUND: {domain} -> {r.url} ({r.headers.get('Server', '')})")
                return True
        except:
            pass
    except:
        pass
    return False

domains = [
    # Toledo / NW Ohio
    "nwohioatd.org", "nwoatd.org", "toledoatd.org", "atdtoledo.org", "atdnwo.org", "atdnwohio.org",
    "nwohio.td.org", "toledo.td.org",
    "nwohioatd.wildapricot.org", "atdtoledo.wildapricot.org", "nwoatd.wildapricot.org",
    
    # Akron / Canton
    "akronatd.org", "atdakron.org", "akroncantonatd.org", "atdakroncanton.org",
    "akron.td.org", "canton.td.org",
    "atdakron.wildapricot.org", "akronatd.wildapricot.org",
    
    # Fort Wayne / NE Indiana
    "neindianaatd.org", "atdneindiana.org", "fortwayneatd.org", "atdfortwayne.org", 
    "atdnei.org", "neiatd.org",
    "northeastindiana.td.org", "fortwayne.td.org",
    "atdneindiana.wildapricot.org",
    
    # Cincinnati / Dayton
    "gcatd.org", "cincinnatiatd.org", "atdcincinnati.org", "greatercincinnati.td.org",
    "daytonatd.org", "atddayton.org", "dayton.td.org", "mv-atd.org", # Miami Valley?
    "gcatd.wildapricot.org", "daytonatd.wildapricot.org"
]

print("Checking domains...")
for d in domains:
    check_domain(d)
