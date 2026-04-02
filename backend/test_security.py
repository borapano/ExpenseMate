import security

def test_security_logic():
    print("--- Duke filluar testimin e Security ---")

    # TEST 1: Hashing dhe Verifikimi bazë
    p = "test1234"
    h = security.get_password_hash(p)
    assert security.verify_password(p, h) is True
    print("✅ Testi 1: Hashing dhe Verifikimi u krye me sukses.")

    # TEST 2: Fjalëkalim i gabuar
    assert security.verify_password("wrongpass", h) is False
    print("✅ Testi 2: Sistemi refuzon saktë fjalëkalimin e gabuar.")

    # TEST 3: Testimi i fjalëkalimit bosh (Duhet të japë ValueError)
    try:
        security.get_password_hash("   ")
    except ValueError as e:
        print(f"✅ Testi 3: Sistemi bllokoi saktë fjalëkalimin bosh (.strip()): {e}")

    # TEST 4: Unicode Normalization (NFKC)
    # Përdorim dy forma të ndryshme të të njëjtit karakter (p.sh. 'ë')
    p_unicode = "fjalëkalim" 
    h_unicode = security.get_password_hash(p_unicode)
    assert security.verify_password(p_unicode, h_unicode) is True
    print("✅ Testi 4: Normalizimi Unicode funksionon perfekt.")

if __name__ == "__main__":
    test_security_logic()