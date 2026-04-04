from database import engine, Base
import models  # Ky rresht është jetik që SQLAlchemy të shohë modelet e tua

print("Duke fshirë tabelat e vjetra (për sinkronizim me ER Diagram)...")
Base.metadata.drop_all(bind=engine)

print("Duke krijuar tabelat e reja në Neon...")
# Kjo komandë gjen të gjitha klasat që trashëgojnë nga Base te models.py
Base.metadata.create_all(bind=engine) 
print("Sukses! Tabelat u krijuan në AWS (Neon).")