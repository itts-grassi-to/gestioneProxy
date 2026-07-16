from sqlalchemy import select
from sqlalchemy.orm import Session

from models import User
from security import verify_password


def authenticate_user(
        database: Session,
        username: str,
        password: str,
) -> User | None:
    """
    Controlla username, password e stato dell'utente.
    """

    user = database.scalar(
        select(User).where(User.username == username)
    )

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user