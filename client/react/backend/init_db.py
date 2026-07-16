import os

from sqlalchemy import select

from database import SessionLocal
from models import User
from security import hash_password


def create_initial_admin():
    """
    Crea il primo amministratore usando i dati presenti nel file .env.
    Se l'utente esiste già, non lo ricrea.
    """
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not password:
        print("ADMIN_USERNAME o ADMIN_PASSWORD non configurati")
        return

    with SessionLocal() as database:
        existing_user = database.scalar(
            select(User).where(User.username == username)
        )

        if existing_user:
            print(f"Utente amministratore '{username}' già presente")
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )

        database.add(admin)
        database.commit()

        print(f"Utente amministratore '{username}' creato")