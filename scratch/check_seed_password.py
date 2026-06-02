import hashlib

def main():
    salt = "e461f5b045e3d7a8b9f0e1d2c3b4a59f"
    target_key_hex = "b2a656636dbcbae61071f4ca7dcba10c9ed9787ad72ab8decbcddfce94e59110"
    
    # Common test passwords
    candidates = [
        "wrenchwise",
        "superadmin",
        "password",
        "admin",
        "trms",
        "wrenchwise123",
        "superadmin123",
        "wrench",
        "wise",
        "Wrenchwise",
        "WrenchWise"
    ]
    
    for pwd in candidates:
        key = hashlib.pbkdf2_hmac(
            'sha256',
            pwd.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        if key.hex() == target_key_hex:
            print(f"MATCH FOUND! The password is: {pwd}")
            return
            
    print("No match found in common passwords list.")

if __name__ == "__main__":
    main()
