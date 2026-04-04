import security
from datetime import timedelta

def test_jwt_logic():
    print("--- Testimi i JWT ---")
    
    # 1. Krijojmë një payload (të dhëna)
    user_id = "12345-abcde"
    data = {"sub": user_id}
    
    # 2. Gjenerojmë tokenin
    token = security.create_access_token(data=data)
    print(f"✅ Token-i u gjenerua: {token[:20]}...")
    
    # 3. Dekodojmë tokenin
    decoded_payload = security.decode_access_token(token)
    assert decoded_payload["sub"] == user_id
    print("✅ Dekodimi doli i saktë. User ID u gjet brenda tokenit.")

if __name__ == "__main__":
    test_jwt_logic()