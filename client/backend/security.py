from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Trasforma una password in un hash sicuro.
    """
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Controlla se una password corrisponde all'hash salvato.
    """
    return password_hash.verify(password, hashed_password)