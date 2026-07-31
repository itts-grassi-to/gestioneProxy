import os

from sqlalchemy import select

from database import SessionLocal
from models import Funzionalita, User
from security import hash_password


def create_initial_admin():
    """
    Crea l'amministratore iniziale.
    Se non vengono specificate altre credenziali, usa admin/password.
    Se l'utente esiste già, non lo ricrea.
    """
    username = os.getenv("ADMIN_USERNAME") or "admin"
    password = os.getenv("ADMIN_PASSWORD") or "password"

    with SessionLocal() as database:
        existing_user = database.scalar(
            select(User).where(User.username == username)
        )

        if existing_user:
            print(
                f"Utente amministratore '{username}' già presente",
                flush=True,
            )
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )

        database.add(admin)
        database.commit()

        print(
            f"Utente amministratore '{username}' creato",
            flush=True,
        )

def create_initial_functionality():
    """
    Crea la funzionalità iniziale per il test del server.
    Se esiste già, non la ricrea.
    """

    with SessionLocal() as database:
        existing_functionality = database.scalar(
            select(Funzionalita).where(
                Funzionalita.codice == "00"
            )
        )

        if existing_functionality:
            print(
                "Funzionalità di test già presente",
                flush=True,
            )
            return

        functionality = Funzionalita(
            codice="00",
            descrizione="Test connessione server",
        )

        database.add(functionality)
        database.commit()

        print(
            "Funzionalità di test creata",
            flush=True,
        )

