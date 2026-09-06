from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('guest', 'docente', 'admin')",
            name="ck_users_role",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="guest",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

class Proxy(Base):
    __tablename__ = "proxies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    codiceProxy: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    descrizione: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    indirizzoIP: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    subnetMask: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

class Funzionalita(Base):
    __tablename__ = "funzionalita"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    codice: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )

    descrizione: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )