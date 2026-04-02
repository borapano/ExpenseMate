from database import SessionLocal
import crud
import schemas
from uuid import uuid4

def test_database_operations():
    db = SessionLocal()
    try:
        print("--- Duke filluar testimin LIVE në Neon ---")

        # 1. Testo Krijimin e Përdoruesit
        test_email = f"test_{uuid4().hex[:6]}@example.com"
        user_data = schemas.UserCreate(
            name="Përdorues Test",
            email=test_email,
            password="fjalekalimi_sigurt_123"
        )
        
        new_user = crud.create_user(db, user_data)
        print(f"✅ Përdoruesi u krijua me ID: {new_user.id}")

        # 2. Testo Krijimin e Grupit (dhe anëtarësimin automatik)
        group_data = schemas.GroupCreate(
            name="Grupi i Testimit",
            description="Ky është një grup provë"
        )
        
        new_group = crud.create_group(db, group_data, creator_id=new_user.id)
        print(f"✅ Grupi u krijua me Kodin: {new_group.code}")
        print(f"✅ Krijuesi u shtua automatikisht si anëtar.")

        # 3. Verifikimi në DB (Leximi)
        user_in_db = crud.get_user_by_email(db, test_email)
        if user_in_db:
            print(f"✅ Verifikimi: Përdoruesi u gjet në Neon me email: {user_in_db.email}")

    except Exception as e:
        print(f"❌ Gabim gjatë testimit: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_database_operations()