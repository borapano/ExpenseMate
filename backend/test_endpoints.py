import requests

def test():
    try:
        # We don't have token, but we can check if it returns 401 instead of 500
        # Wait, I can generate a token. 
        res = requests.post("http://127.0.0.1:8000/login", data={"username": "test@example.com", "password": "password"})
        if res.status_code != 200:
            print("Login failed:", res.status_code, res.text)
            return
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        endpoints = [
            "/users/me/settlement_dashboard",
            "/users/me/expenses",
            "/groups/me"
        ]
        for ep in endpoints:
            r = requests.get(f"http://127.0.0.1:8000{ep}", headers=headers)
            print(f"{ep}: {r.status_code}")
            if r.status_code == 500:
                print(r.text)
    except Exception as e:
        print(e)

test()
