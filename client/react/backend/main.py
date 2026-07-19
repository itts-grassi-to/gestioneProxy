from typing import Optional
from rotteGestioneAttributiProxy import router as proxy_router

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from init_db import create_initial_admin

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from auth import authenticate_user
from database import Base, engine, get_database
from schemas import LoginRequest

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_initial_admin()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(proxy_router)

# Permette al frontend React/Vite di chiamare il backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


REQUEST_CODES = {
    "PING": "00",
    "ENABLE_BLACKLIST": "01",
    "DISABLE_BLACKLIST": "02",
    "ADD_WHITELIST": "03",
    "REMOVE_WHITELIST": "04",
}


RESPONSE_MESSAGES = {
    "50": "Motore raggiungibile",
    "51": "Blacklist attivata correttamente",
    "52": "Blacklist disattivata correttamente",
    "53": "Dominio aggiunto alla whitelist",
    "54": "Dominio rimosso dalla whitelist",
    "90": "Codice non riconosciuto dal motore",
    "91": "Parametro mancante",
    "99": "Errore interno del motore",
}


SIMULATED_RESPONSE_CODES = {
    "00": "50",
    "01": "51",
    "02": "52",
    "03": "53",
    "04": "54",
}


class CommandRequest(BaseModel):
    action: str
    parameter: Optional[str] = None


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

@app.post("/api/command")
def command(request: CommandRequest):
    if request.action not in REQUEST_CODES:
        return {
            "success": False,
            "message": "Azione non valida"
        }

    request_code = REQUEST_CODES[request.action]

    # Per ora simuliamo la risposta del motore.
    # Nel prossimo step qui chiameremo davvero il server/motore via socket.
    response_code = SIMULATED_RESPONSE_CODES.get(request_code, "90")
    response_message = RESPONSE_MESSAGES.get(response_code, "Risposta sconosciuta")

    return {
        "success": True,
        "action": request.action,
        "parameter": request.parameter,
        "requestCode": request_code,
        "responseCode": response_code,
        "message": response_message
    }