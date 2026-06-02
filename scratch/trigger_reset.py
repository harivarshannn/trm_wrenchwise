import urllib.request
import json
import time

def main():
    url = "https://trm-wrenchwise-backend.onrender.com/api/auth/reset-superadmin"
    req = urllib.request.Request(
        url,
        data=b"", # Empty POST body
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    print("Waiting 40 seconds for Render server to complete building and deploying the master commit...")
    time.sleep(40)
    
    print("Pinging reset endpoint...")
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)
                if data.get("success"):
                    print(f"\nSUCCESS! Super Admin password has been reset. Details: {data['message']}")
                    return
        except Exception as e:
            print(f"Attempt {attempt + 1}: Render backend still updating or sleeping. Retrying in 15 seconds...")
            time.sleep(15)
            
    print("Could not verify reset. Please try hitting the URL manually: POST https://trm-wrenchwise-backend.onrender.com/api/auth/reset-superadmin")

if __name__ == "__main__":
    main()
