from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from auth import authenticate_user
from database import Base, engine, get_database
from init_db import (
    create_initial_admin,
    create_initial_functionality,
)
from rotteGestioneAttributiProxy import (
    router as proxy_router,
)
from rotteGestioneFunzionalita import (
    router as functionality_router,
)
from schemas import LoginRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    create_initial_admin()
    create_initial_functionality()

    yield


app = FastAPI(lifespan=lifespan)

app.include_router(proxy_router)
app.include_router(functionality_router)


# Permette al frontend React/Vite di chiamare il backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.3.231:3010",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Backend Python avviato correttamente"
    }


@app.post("/api/auth/login")
def login(
        request: LoginRequest,
        database: Session = Depends(get_database),
):
    user = authenticate_user(
        database=database,
        username=request.username,
        password=request.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nome utente o password non corretti",
        )

    return {
        "success": True,
        "message": "Accesso effettuato correttamente",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
        },
    }
